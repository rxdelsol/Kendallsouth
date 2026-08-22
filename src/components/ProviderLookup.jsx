import React, { useEffect, useMemo, useState } from "react";
import {
  daysUntil,
  statusOf,
  STATUS_META,
  doctorCredentials,
} from "../utils/credStatus";

// Catálogo de aseguradoras con Provider Directory FHIR (debe coincidir con
// FHIR_PAYERS en api/_lib/fhirDirectory.js). El buscador consulta el directorio
// oficial EN VIVO de cada una para el NPI, exista o no en tu sistema.
const DIR_PAYERS = [
  { key: "aetna", label: "Aetna" },
  { key: "humana", label: "Humana" },
  { key: "unitedhealthcare", label: "UnitedHealthcare" },
  { key: "florida_blue", label: "Florida Blue" },
  { key: "molina", label: "Molina" },
  { key: "sunshine", label: "Sunshine Health" },
  { key: "ambetter", label: "Ambetter" },
  { key: "simply", label: "Simply Healthcare" },
  { key: "wellcare", label: "WellCare" },
];

// Busca un NPI en el registro NACIONAL (NPPES) — no solo en el tracker — y muestra
// al proveedor con su participación REAL en cada aseguradora (directorio oficial FHIR
// en vivo) + verificación pública de Medicare. Funciona aunque el proveedor no esté
// en tu sitio, y permite agregarlo/actualizarlo en tu sistema.
export default function ProviderLookup() {
  const [doctors, setDoctors] = useState([]);
  const [insurances, setInsurances] = useState([]);
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [nppes, setNppes] = useState(null);
  const [medicare, setMedicare] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [onlyActive, setOnlyActive] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState(null);
  const [addMsg, setAddMsg] = useState(null); // 'ok' | 'warn' | 'error'

  // Directorio oficial en vivo (participación real por aseguradora)
  const [directory, setDirectory] = useState(null); // { [payerKey]: result }
  const [dirLoading, setDirLoading] = useState(false);
  const [savingPayer, setSavingPayer] = useState(null);
  const [dirMsg, setDirMsg] = useState(null); // 'ok' | 'error'

  useEffect(() => {
    (async () => {
      try {
        const [dr, ir] = await Promise.all([
          fetch("/api/get-doctors").then((r) => r.json()),
          fetch("/api/get-insurances").then((r) => r.json()),
        ]);
        if (dr.ok) setDoctors(dr.data || []);
        if (ir.ok) setInsurances(ir.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const norm = (s) => (s || "").trim().toLowerCase();
  const isNpi = (s) => /^\d{10}$/.test((s || "").trim());
  const tokens = (s) => norm(s).split(/\s+/).filter((t) => t.length > 1);
  // Coincidencia de nombres tolerante: comparte >=2 tokens (nombre + apellido)
  const nameMatch = (a, b) => {
    if (!a || !b) return false;
    if (norm(a) === norm(b)) return true;
    const ta = tokens(a), tb = tokens(b);
    const shared = ta.filter((t) => tb.includes(t));
    return shared.length >= 2;
  };

  // Coincidencias locales por nombre (para búsqueda por texto)
  const matches = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s || isNpi(q)) return [];
    return doctors.filter(
      (d) => (d.npi || "").toLowerCase().includes(s) || (d.name || "").toLowerCase().includes(s)
    );
  }, [q, doctors]);

  useEffect(() => { if (matches.length === 1) setSelectedId(matches[0].id); }, [matches]);

  const localDoctor = useMemo(
    () => doctors.find((d) => d.id === selectedId) || null,
    [doctors, selectedId]
  );

  // Proveedor "activo": doctor local si existe; si no, el resultado de NPPES
  const provider = useMemo(() => {
    if (localDoctor) {
      return { name: localDoctor.name, npi: localDoctor.npi, source: "local", doctor: localDoctor };
    }
    if (nppes && nppes.found) {
      return { name: nppes.name, npi: nppes.npi, source: "nppes", doctor: null };
    }
    return null;
  }, [localDoctor, nppes]);

  // Seguros del proveedor: match por nombre (exacto si es local; tolerante si viene de NPPES)
  const docInsurances = useMemo(() => {
    if (!provider) return [];
    const list = insurances.filter((i) =>
      provider.source === "local"
        ? norm(i.doctorName) === norm(provider.name)
        : nameMatch(i.doctorName, provider.name)
    );
    return list
      .map((i) => ({ ...i, status: statusOf(i.expiration), days: daysUntil(i.expiration) }))
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [provider, insurances]);

  const shown = onlyActive
    ? docInsurances.filter((i) => !(i.network || "").toLowerCase().includes("out"))
    : docInsurances;

  // ¿Ya existe este seguro (por nombre) en el tracker para este proveedor?
  const hasInTracker = (label) =>
    docInsurances.some((i) => {
      const a = norm(i.name), b = norm(label);
      return a === b || a.includes(b) || b.includes(a);
    });

  const stats = useMemo(() => {
    const s = { active: 0, out: 0, soon: 0, expired: 0 };
    docInsurances.forEach((i) => {
      const isOut = (i.network || "").toLowerCase().includes("out");
      if (isOut) s.out++; else s.active++;
      if (i.status === "expired") s.expired++;
      else if (i.status === "d30" || i.status === "d60") s.soon++;
    });
    return s;
  }, [docInsurances]);

  const creds = useMemo(() => {
    if (!localDoctor) return [];
    return doctorCredentials(localDoctor).map((c) => ({ ...c, status: statusOf(c.date), days: daysUntil(c.date) }));
  }, [localDoctor]);

  async function runSearch() {
    const query = q.trim();
    if (!query) return;
    setSearched(true);
    // Match local: por NPI exacto o por nombre
    const localByNpi = doctors.find((d) => (d.npi || "").trim() === query);
    const localByName = !isNpi(query) && matches.length ? matches[0] : null;
    setSelectedId(localByNpi ? localByNpi.id : localByName ? localByName.id : null);

    if (isNpi(query)) {
      setSearching(true);
      setNppes(null); setMedicare(null);
      setDirectory(null); setDirMsg(null);
      try {
        const [n, m] = await Promise.all([
          fetch(`/api/verify-npi?npi=${encodeURIComponent(query)}`).then((r) => r.json()).catch(() => null),
          fetch(`/api/verify-medicare?npi=${encodeURIComponent(query)}`).then((r) => r.json()).catch(() => null),
        ]);
        setNppes(n); setMedicare(m);
        // Directorio oficial en vivo de cada aseguradora. Pasamos el nombre para
        // los pagadores que no buscan por NPI directo (ej. Aetna/Centene).
        const provName = (localByNpi && localByNpi.name) || (n && n.name) || "";
        setDirLoading(true);
        fetchDirectory(query, provName).finally(() => setDirLoading(false));
      } finally {
        setSearching(false);
      }
    } else {
      setNppes(null); setMedicare(null); setDirectory(null); setDirMsg(null);
    }
  }

  async function reloadDoctors() {
    const dr = await fetch("/api/get-doctors").then((r) => r.json()).catch(() => null);
    if (dr?.ok) setDoctors(dr.data || []);
    return dr?.data || [];
  }

  async function reloadInsurances() {
    const ir = await fetch("/api/get-insurances").then((r) => r.json()).catch(() => null);
    if (ir?.ok) setInsurances(ir.data || []);
    return ir?.data || [];
  }

  // Consulta el Provider Directory FHIR oficial de las 9 aseguradoras en paralelo.
  async function fetchDirectory(npi, name) {
    const entries = await Promise.all(
      DIR_PAYERS.map(async (p) => {
        try {
          const url = `/api/verify-provider-directory?payer=${p.key}&npi=${encodeURIComponent(npi)}${name ? `&name=${encodeURIComponent(name)}` : ""}`;
          const r = await fetch(url).then((x) => x.json());
          return [p.key, r];
        } catch (e) {
          return [p.key, { ok: false, error: "sin conexión" }];
        }
      })
    );
    setDirectory(Object.fromEntries(entries));
  }

  // Agrega/actualiza el seguro en tu sistema a partir del directorio oficial.
  async function addFromDirectory(payer) {
    if (!provider) return;
    setSavingPayer(payer.key); setDirMsg(null);
    try {
      const res = await fetch("/api/save-insurance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: payer.label,
          doctorName: provider.name,
          network: "In Network",
          notes: `Directorio oficial ${payer.label} · ${new Date().toLocaleDateString()}`,
        }),
      }).then((r) => r.json());
      if (res.ok) { await reloadInsurances(); setDirMsg("ok"); }
      else setDirMsg("error");
    } catch (e) {
      setDirMsg("error");
    } finally {
      setSavingPayer(null);
    }
  }

  function openAdd() {
    setAddForm({
      name: nppes?.name || "",
      npi: nppes?.npi || q.trim(),
      taxonomy: nppes?.taxonomy || "",
      license: nppes?.license || "",
      licenseExp: "", dea: "", deaExp: "", caqhAttested: "", malpracticeExp: "", medicareRevalidation: "",
    });
    setAddMsg(null);
    setAddOpen(true);
  }

  async function saveNewDoctor() {
    if (!addForm?.name) { alert("Falta el nombre."); return; }
    setAdding(true); setAddMsg(null);
    try {
      const res = await fetch("/api/save-doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      }).then((r) => r.json());
      if (res.ok) {
        const list = await reloadDoctors();
        const created = res.data;
        const found = list.find((d) => String(d.id) === String(created?.id)) ||
          list.find((d) => (d.npi || "") === addForm.npi);
        if (found) setSelectedId(found.id);
        setAddOpen(false);
        setAddMsg(res.datesSaved === false ? "warn" : "ok");
      } else {
        setAddMsg("error");
      }
    } catch (e) {
      setAddMsg("error");
    } finally {
      setAdding(false);
    }
  }

  const onKey = (e) => { if (e.key === "Enter") runSearch(); };
  const clearAll = () => { setQ(""); setSelectedId(null); setNppes(null); setMedicare(null); setSearched(false); };

  return (
    <div className="bg-card rounded p-4">
      <h2 className="text-sky-200 font-semibold mb-1">Buscar proveedor por NPI</h2>
      <p className="text-slate-400 text-xs mb-3">
        Escribe un <strong>NPI</strong> (se busca en el registro nacional NPPES, no solo en tu sitio) o un nombre.
        Al buscar por NPI se consulta además el <strong>directorio oficial en vivo</strong> de cada aseguradora
        (participación real), y podés agregar lo que falte a tu sistema. Medicare se verifica con datos públicos.
      </p>

      <div className="ins-filters">
        <input
          className="flt-search"
          placeholder="🔎 NPI (10 dígitos) o nombre del doctor…"
          value={q}
          onChange={(e) => { setQ(e.target.value); setSelectedId(null); }}
          onKeyDown={onKey}
          autoFocus
        />
        <button className="btn-red" onClick={runSearch} disabled={searching}>
          {searching ? "Buscando…" : "Buscar"}
        </button>
        {(q || provider || searched) && (
          <button className="flt-clear" onClick={clearAll}>✕ Limpiar</button>
        )}
      </div>

      {loading && <p className="text-slate-400 text-sm">Cargando…</p>}

      {/* Varias coincidencias locales por nombre */}
      {!provider && matches.length > 1 && (
        <div className="npi-matches">
          {matches.map((d) => (
            <button key={d.id} className="npi-match" onClick={() => setSelectedId(d.id)}>
              <strong>{d.name}</strong> <span>NPI {d.npi || "—"}</span>
            </button>
          ))}
        </div>
      )}

      {/* NPI buscado pero no encontrado en NPPES */}
      {searched && isNpi(q) && !searching && nppes && !nppes.found && !localDoctor && (
        <p className="text-slate-400 text-sm">El NPI {q} no aparece en el registro nacional NPPES.</p>
      )}

      {/* Ficha del proveedor */}
      {provider && (
        <div className="npi-card">
          <div className="npi-head">
            <div>
              <h3 style={{ margin: 0 }}>
                {provider.name}{" "}
                <span className={`sem-pill ${provider.source === "local" ? "sem-ok" : "sem-90"}`} style={{ fontSize: 11 }}>
                  {provider.source === "local" ? "En tu sistema" : "NPPES nacional"}
                </span>
              </h3>
              <div className="guide-sub">
                NPI {provider.npi || "—"}
                {localDoctor ? ` · Licencia ${localDoctor.license || "—"} · CAQH ${localDoctor.caqh || "—"}` : ""}
                {nppes && nppes.found ? ` · ${nppes.taxonomy || ""}${nppes.city ? " · " + nppes.city + ", " + (nppes.state || "") : ""}` : ""}
              </div>
            </div>
            {provider.source === "nppes" && !addOpen && (
              <button className="btn-red" onClick={openAdd}>➕ Agregar a mis doctores</button>
            )}
          </div>

          {addMsg === "ok" && (
            <div className="verify-box"><span className="v-ok">✓ Agregado a tus doctores. Ya aparece en Doctors y en la matriz. Las fechas que pusiste activan el semáforo y el aviso por email.</span></div>
          )}
          {addMsg === "warn" && (
            <div className="verify-box"><span className="v-warn">✓ Agregado, pero las fechas de vencimiento NO se guardaron: falta correr la migración de Supabase (supabase-migration.sql). Después edítalo en Doctors para fijarlas.</span></div>
          )}
          {addMsg === "error" && (
            <div className="verify-box"><span className="v-bad">No se pudo agregar. Revisa la conexión con Supabase.</span></div>
          )}

          {addOpen && addForm && (
            <div className="verify-box">
              <h4 className="form-section" style={{ marginTop: 0 }}>Agregar proveedor a tus doctores</h4>
              <p className="guide-note" style={{ marginTop: 0 }}>Pon las fechas de vencimiento para que el semáforo y el email te avisen cuando se venzan.</p>
              <div className="grid grid-cols-2 gap-2">
                <input className="p-2 rounded bg-[#081424]" placeholder="Nombre" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} />
                <input className="p-2 rounded bg-[#081424]" placeholder="NPI" value={addForm.npi} onChange={(e) => setAddForm({ ...addForm, npi: e.target.value })} />
                <input className="p-2 rounded bg-[#081424]" placeholder="License #" value={addForm.license} onChange={(e) => setAddForm({ ...addForm, license: e.target.value })} />
                <input className="p-2 rounded bg-[#081424]" placeholder="Taxonomía" value={addForm.taxonomy} onChange={(e) => setAddForm({ ...addForm, taxonomy: e.target.value })} />
                <label className="form-date"><span>Licencia vence</span><input type="date" className="p-2 rounded bg-[#081424]" value={addForm.licenseExp} onChange={(e) => setAddForm({ ...addForm, licenseExp: e.target.value })} /></label>
                <input className="p-2 rounded bg-[#081424]" placeholder="DEA #" value={addForm.dea} onChange={(e) => setAddForm({ ...addForm, dea: e.target.value })} />
                <label className="form-date"><span>DEA vence</span><input type="date" className="p-2 rounded bg-[#081424]" value={addForm.deaExp} onChange={(e) => setAddForm({ ...addForm, deaExp: e.target.value })} /></label>
                <label className="form-date"><span>CAQH últ. atestación</span><input type="date" className="p-2 rounded bg-[#081424]" value={addForm.caqhAttested} onChange={(e) => setAddForm({ ...addForm, caqhAttested: e.target.value })} /></label>
                <label className="form-date"><span>Malpractice vence</span><input type="date" className="p-2 rounded bg-[#081424]" value={addForm.malpracticeExp} onChange={(e) => setAddForm({ ...addForm, malpracticeExp: e.target.value })} /></label>
                <label className="form-date"><span>Medicare revalidación</span><input type="date" className="p-2 rounded bg-[#081424]" value={addForm.medicareRevalidation} onChange={(e) => setAddForm({ ...addForm, medicareRevalidation: e.target.value })} /></label>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button className="btn-cancel" onClick={() => setAddOpen(false)}>Cancelar</button>
                <button className="btn-red" onClick={saveNewDoctor} disabled={adding}>{adding ? "Guardando…" : "Guardar doctor"}</button>
              </div>
            </div>
          )}

          {/* Verificación externa (NPPES + Medicare) */}
          {(nppes || medicare) && (
            <div className="verify-box">
              <div className="verify-row">
                <strong>NPPES:</strong>{" "}
                {!nppes ? "no consultado" :
                  !nppes.found ? <span className="v-bad">NPI no encontrado</span> :
                  <>
                    <span className={nppes.active ? "v-ok" : "v-bad"}>{nppes.active ? "Activo" : "Inactivo"}</span>
                    {" · "}{nppes.name}{nppes.credential ? `, ${nppes.credential}` : ""}
                    {nppes.licenseState ? ` · Lic ${nppes.license || ""} (${nppes.licenseState})` : ""}
                  </>}
              </div>
              <div className="verify-row">
                <strong>Medicare (PECOS):</strong>{" "}
                {!medicare ? "no consultado" :
                  !medicare.verified ? <span className="v-muted">no verificado ({medicare.reason || "sin configurar"})</span> :
                  medicare.enrolled ? <span className="v-ok">Inscrito{medicare.state ? ` · ${medicare.state}` : ""}</span> :
                  <span className="v-bad">No aparece en el padrón</span>}
              </div>
            </div>
          )}

          {/* Participación oficial en aseguradoras (directorio FHIR en vivo) */}
          {(dirLoading || directory) && (
            <div className="verify-box">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h4 className="form-section" style={{ margin: 0 }}>
                  Participación en aseguradoras — directorio oficial en vivo
                </h4>
                {dirLoading && <span className="v-muted" style={{ fontSize: 12 }}>Consultando…</span>}
              </div>
              <p className="guide-note" style={{ marginTop: 4 }}>
                Estado real publicado por cada aseguradora para este NPI — todas las que existen,
                esté o no el proveedor en tu sistema.
              </p>

              {dirMsg === "ok" && <div className="v-ok" style={{ marginBottom: 6 }}>✓ Agregado a tu sistema. Ya aparece en la lista de seguros.</div>}
              {dirMsg === "error" && <div className="v-bad" style={{ marginBottom: 6 }}>No se pudo guardar. Revisa la conexión con Supabase.</div>}

              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-slate-300">
                    <tr>
                      <th className="p-2" style={{ textAlign: "left" }}>Aseguradora</th>
                      <th className="p-2" style={{ textAlign: "left" }}>Estado en su directorio</th>
                      <th className="p-2" style={{ textAlign: "left" }}>Cómo aparece</th>
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-200">
                    {DIR_PAYERS.map((p) => {
                      const r = directory ? directory[p.key] : undefined;
                      const already = hasInTracker(p.label);
                      let statusEl = <span className="v-muted">…</span>;
                      let detailEl = <span className="v-muted">—</span>;
                      let canAdd = false;
                      if (r === undefined) {
                        statusEl = <span className="v-muted">…</span>;
                      } else if (r && r.ok === false) {
                        statusEl = <span className="v-muted">Error ({r.error || "sin datos"})</span>;
                      } else if (r && r.configured === false) {
                        statusEl = <span className="v-muted">No configurado</span>;
                      } else if (r && r.inNetwork) {
                        statusEl = <span className="badge-in">En red ✓</span>;
                        canAdd = !already;
                        const roles = r.roles || [];
                        const specs = [...new Set(roles.flatMap((x) => x.specialty || []))].slice(0, 3);
                        const nets = [...new Set(roles.flatMap((x) => x.network || []))].slice(0, 2);
                        detailEl = (
                          <span>
                            {roles.length} registro{roles.length === 1 ? "" : "s"}
                            {specs.length ? ` · ${specs.join(", ")}` : ""}
                            {nets.length ? ` · ${nets.join(", ")}` : ""}
                          </span>
                        );
                      } else if (r && r.foundPractitioner) {
                        statusEl = <span className="badge-out">Sin rol activo</span>;
                        detailEl = <span className="v-muted">Aparece pero sin red activa</span>;
                      } else if (r) {
                        statusEl = <span className="v-muted">No aparece</span>;
                      }
                      return (
                        <tr key={p.key} className="border-t border-slate-800">
                          <td className="p-2">{p.label}</td>
                          <td className="p-2">{statusEl}</td>
                          <td className="p-2">{detailEl}</td>
                          <td className="p-2" style={{ textAlign: "right" }}>
                            {already ? (
                              <span className="v-ok" style={{ fontSize: 11 }}>En tu sistema</span>
                            ) : canAdd ? (
                              <button
                                className="btn-red"
                                style={{ padding: "4px 10px", fontSize: 12 }}
                                disabled={savingPayer === p.key}
                                onClick={() => addFromDirectory(p)}
                              >
                                {savingPayer === p.key ? "Guardando…" : "➕ Agregar"}
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Resumen de red */}
          <div className="ins-summary" style={{ marginTop: 12 }}>
            <div className="sum-tile"><span className="sum-num">{docInsurances.length}</span><span className="sum-lbl">Seguros</span></div>
            <div className="sum-tile t-active"><span className="sum-num">{stats.active}</span><span className="sum-lbl">In Network</span></div>
            <div className="sum-tile t-nodate"><span className="sum-num">{stats.out}</span><span className="sum-lbl">Out of Network</span></div>
            <div className="sum-tile t-30"><span className="sum-num">{stats.soon}</span><span className="sum-lbl">Por vencer</span></div>
            <div className="sum-tile t-expired"><span className="sum-num">{stats.expired}</span><span className="sum-lbl">Vencidos</span></div>
          </div>

          {/* Credenciales (solo si es doctor de tu sistema) */}
          {localDoctor && (
            <>
              <h4 className="form-section">Credenciales del doctor</h4>
              <div className="cred-pills" style={{ marginBottom: 6 }}>
                {creds.map((c) => (
                  <span key={c.key} className={`sem-pill ${STATUS_META[c.status].cls}`}
                    title={c.date ? `${new Date(c.date).toLocaleDateString()} · ${STATUS_META[c.status].label}` : "sin fecha"}>
                    {c.label}: {c.date ? `${c.days}d` : "—"}
                  </span>
                ))}
              </div>
            </>
          )}

          {/* Tabla de seguros */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
            <h4 className="form-section" style={{ margin: 0 }}>Seguros de este proveedor</h4>
            <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#cbd5e1", fontSize: 12 }}>
              <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} />
              Solo activos (In Network)
            </label>
          </div>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="text-slate-300">
                <tr>
                  <th className="p-2">Aseguradora</th>
                  <th className="p-2">Tipo</th>
                  <th className="p-2">Estado</th>
                  <th className="p-2">Expiración</th>
                  <th className="p-2">Días</th>
                  <th className="p-2">Notas</th>
                </tr>
              </thead>
              <tbody className="text-slate-200">
                {shown.map((i) => (
                  <tr key={i.id} className="border-t border-slate-800">
                    <td className="p-2">{i.name}</td>
                    <td className="p-2">{i.type}</td>
                    <td className="p-2">
                      {(i.network || "").toLowerCase().includes("out")
                        ? <span className="badge-out">Out of Network</span>
                        : <span className="badge-in">In Network</span>}
                    </td>
                    <td className="p-2">{i.expiration ? new Date(i.expiration).toLocaleDateString() : ""}</td>
                    <td className="p-2">
                      <span className={`sem-pill ${STATUS_META[i.status].cls}`}>{i.expiration ? `${i.days}d` : "—"}</span>
                    </td>
                    <td className="p-2">{i.notes}</td>
                  </tr>
                ))}
                {shown.length === 0 && (
                  <tr><td colSpan={6} className="p-4 text-slate-400">
                    {docInsurances.length === 0
                      ? (provider.source === "nppes"
                          ? "Este proveedor no está en tu tracker, así que no hay seguros comerciales registrados. La participación en red comercial no existe como dato público — solo Medicare/Medicaid (arriba)."
                          : "Este doctor no tiene seguros registrados.")
                      : "No hay seguros In Network para mostrar."}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

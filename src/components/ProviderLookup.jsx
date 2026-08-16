import React, { useEffect, useMemo, useState } from "react";
import {
  daysUntil,
  statusOf,
  STATUS_META,
  doctorCredentials,
} from "../utils/credStatus";

// Busca un NPI en el registro NACIONAL (NPPES) — no solo en el tracker — y muestra
// al proveedor con sus seguros del tracker (fuente real de la participación comercial)
// + verificación pública de Medicare. Funciona aunque el proveedor no esté en tu sitio.
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
      try {
        const [n, m] = await Promise.all([
          fetch(`/api/verify-npi?npi=${encodeURIComponent(query)}`).then((r) => r.json()).catch(() => null),
          fetch(`/api/verify-medicare?npi=${encodeURIComponent(query)}`).then((r) => r.json()).catch(() => null),
        ]);
        setNppes(n); setMedicare(m);
      } finally {
        setSearching(false);
      }
    } else {
      setNppes(null); setMedicare(null);
    }
  }

  const onKey = (e) => { if (e.key === "Enter") runSearch(); };
  const clearAll = () => { setQ(""); setSelectedId(null); setNppes(null); setMedicare(null); setSearched(false); };

  return (
    <div className="bg-card rounded p-4">
      <h2 className="text-sky-200 font-semibold mb-1">Buscar proveedor por NPI</h2>
      <p className="text-slate-400 text-xs mb-3">
        Escribe un <strong>NPI</strong> (se busca en el registro nacional NPPES, no solo en tu sitio) o un nombre.
        Los seguros salen de tu tracker; Medicare se verifica con datos públicos.
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
          </div>

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

import React, { useEffect, useMemo, useState } from "react";
import {
  daysUntil,
  statusOf,
  STATUS_META,
  doctorCredentials,
} from "../utils/credStatus";

// Busca un doctor por NPI (o nombre) y muestra TODOS sus seguros con estado,
// más el semáforo de sus credenciales. Todo con los datos ya cargados en el tracker.
export default function ProviderLookup() {
  const [doctors, setDoctors] = useState([]);
  const [insurances, setInsurances] = useState([]);
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verify, setVerify] = useState(null);       // { nppes, medicare }
  const [verifying, setVerifying] = useState(false);

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

  // Coincidencias por NPI o nombre
  const matches = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return [];
    return doctors.filter(
      (d) =>
        (d.npi || "").toLowerCase().includes(s) ||
        (d.name || "").toLowerCase().includes(s)
    );
  }, [q, doctors]);

  const selected = useMemo(
    () => doctors.find((d) => d.id === selectedId) || null,
    [doctors, selectedId]
  );

  // Auto-selecciona si hay exactamente una coincidencia
  useEffect(() => {
    if (matches.length === 1) setSelectedId(matches[0].id);
  }, [matches]);

  // Seguros del doctor seleccionado (enlazados por nombre)
  const docInsurances = useMemo(() => {
    if (!selected) return [];
    const name = (selected.name || "").trim().toLowerCase();
    return insurances
      .filter((i) => (i.doctorName || "").trim().toLowerCase() === name)
      .map((i) => ({ ...i, status: statusOf(i.expiration), days: daysUntil(i.expiration) }))
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [selected, insurances]);

  const stats = useMemo(() => {
    const s = { active: 0, out: 0, soon: 0, expired: 0 };
    docInsurances.forEach((i) => {
      const isOut = (i.network || "").toLowerCase().includes("out");
      if (isOut) s.out++;
      else s.active++;
      if (i.status === "expired") s.expired++;
      else if (i.status === "d30" || i.status === "d60") s.soon++;
    });
    return s;
  }, [docInsurances]);

  // Reinicia la verificación al cambiar de doctor
  useEffect(() => { setVerify(null); }, [selectedId]);

  async function runVerify() {
    if (!selected?.npi) { alert("Este doctor no tiene NPI registrado."); return; }
    setVerifying(true);
    try {
      const [nppes, medicare] = await Promise.all([
        fetch(`/api/verify-npi?npi=${encodeURIComponent(selected.npi)}&name=${encodeURIComponent((selected.name || "").split(" ").pop() || "")}`).then((r) => r.json()).catch(() => null),
        fetch(`/api/verify-medicare?npi=${encodeURIComponent(selected.npi)}`).then((r) => r.json()).catch(() => null),
      ]);
      setVerify({ nppes, medicare });
    } finally {
      setVerifying(false);
    }
  }

  const creds = useMemo(() => {
    if (!selected) return [];
    return doctorCredentials(selected).map((c) => ({
      ...c,
      status: statusOf(c.date),
      days: daysUntil(c.date),
    }));
  }, [selected]);

  return (
    <div className="bg-card rounded p-4">
      <h2 className="text-sky-200 font-semibold mb-1">Buscar proveedor por NPI</h2>
      <p className="text-slate-400 text-xs mb-3">
        Escribe el NPI (o el nombre) del doctor para ver todos sus seguros y el estado de sus credenciales.
      </p>

      <div className="ins-filters">
        <input
          className="flt-search"
          placeholder="🔎 NPI o nombre del doctor…"
          value={q}
          onChange={(e) => { setQ(e.target.value); setSelectedId(null); }}
          autoFocus
        />
        {(q || selected) && (
          <button className="flt-clear" onClick={() => { setQ(""); setSelectedId(null); }}>✕ Limpiar</button>
        )}
      </div>

      {loading && <p className="text-slate-400 text-sm">Cargando…</p>}

      {/* Lista de coincidencias cuando hay varias */}
      {!selected && matches.length > 1 && (
        <div className="npi-matches">
          {matches.map((d) => (
            <button key={d.id} className="npi-match" onClick={() => setSelectedId(d.id)}>
              <strong>{d.name}</strong> <span>NPI {d.npi || "—"}</span>
            </button>
          ))}
        </div>
      )}
      {!selected && q && matches.length === 0 && !loading && (
        <p className="text-slate-400 text-sm">Ningún doctor coincide con “{q}”.</p>
      )}

      {/* Ficha del proveedor */}
      {selected && (
        <div className="npi-card">
          <div className="npi-head">
            <div>
              <h3 style={{ margin: 0 }}>{selected.name}</h3>
              <div className="guide-sub">
                NPI {selected.npi || "—"} · Licencia {selected.license || "—"} · CAQH {selected.caqh || "—"}
                {selected.taxonomy ? ` · ${selected.taxonomy}` : ""}
              </div>
            </div>
            <button className="btn-red" onClick={runVerify} disabled={verifying}>
              {verifying ? "Verificando…" : "Verificar NPPES + Medicare"}
            </button>
          </div>

          {/* Resultado de verificación externa */}
          {verify && (
            <div className="verify-box">
              <div className="verify-row">
                <strong>NPPES:</strong>{" "}
                {!verify.nppes ? "no disponible" :
                  !verify.nppes.found ? <span className="v-bad">NPI no encontrado</span> :
                  <>
                    <span className={verify.nppes.active ? "v-ok" : "v-bad"}>
                      {verify.nppes.active ? "Activo" : "Inactivo"}
                    </span>
                    {" · "}{verify.nppes.name}{verify.nppes.credential ? `, ${verify.nppes.credential}` : ""}
                    {verify.nppes.taxonomy ? ` · ${verify.nppes.taxonomy}` : ""}
                    {verify.nppes.licenseState ? ` · Lic ${verify.nppes.license || ""} (${verify.nppes.licenseState})` : ""}
                    {verify.nppes.nameMatch === false && <span className="v-warn"> · ⚠ el nombre no coincide con tu registro</span>}
                  </>}
              </div>
              <div className="verify-row">
                <strong>Medicare (PECOS):</strong>{" "}
                {!verify.medicare ? "no disponible" :
                  !verify.medicare.verified ? <span className="v-muted">no verificado ({verify.medicare.reason || "sin configurar"})</span> :
                  verify.medicare.enrolled ? <span className="v-ok">Inscrito{verify.medicare.state ? ` · ${verify.medicare.state}` : ""}</span> :
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

          {/* Credenciales del doctor */}
          <h4 className="form-section">Credenciales del doctor</h4>
          <div className="cred-pills" style={{ marginBottom: 6 }}>
            {creds.map((c) => (
              <span key={c.key} className={`sem-pill ${STATUS_META[c.status].cls}`}
                title={c.date ? `${new Date(c.date).toLocaleDateString()} · ${STATUS_META[c.status].label}` : "sin fecha"}>
                {c.label}: {c.date ? `${c.days}d` : "—"}
              </span>
            ))}
          </div>

          {/* Tabla de seguros */}
          <h4 className="form-section">Seguros de este proveedor</h4>
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
                {docInsurances.map((i) => (
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
                      <span className={`sem-pill ${STATUS_META[i.status].cls}`}>
                        {i.expiration ? `${i.days}d` : "—"}
                      </span>
                    </td>
                    <td className="p-2">{i.notes}</td>
                  </tr>
                ))}
                {docInsurances.length === 0 && (
                  <tr><td colSpan={6} className="p-4 text-slate-400">Este doctor no tiene seguros registrados (o el nombre no coincide con el de la tabla de seguros).</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from "react";

// Verificación de elegibilidad de un PACIENTE con un pagador (Availity 270/271).
// Front-desk: ¿este paciente tiene cobertura activa con este plan hoy?
export default function EligibilityCheck() {
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({
    providerNpi: "",
    payerId: "",
    memberId: "",
    dateOfBirth: "",
    serviceType: "30",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    fetch("/api/get-doctors")
      .then((r) => r.json())
      .then((d) => { if (d.ok) setDoctors(d.data || []); })
      .catch(() => {});
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit() {
    if (!form.providerNpi || !form.payerId || !form.memberId) {
      alert("Completa NPI del proveedor, Payer ID y Member ID.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch("/api/availity-eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setResult(await r.json());
    } catch (e) {
      setResult({ ok: false, error: String(e) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-card rounded p-4">
      <h2 className="text-sky-200 font-semibold mb-1">Elegibilidad del paciente (Availity)</h2>
      <p className="text-slate-400 text-xs mb-3">
        Verifica si un paciente tiene cobertura activa con un plan a la fecha (270/271).
        Esto no confirma la participación del proveedor en la red — eso Availity no lo expone por API.
      </p>

      <div className="elig-form">
        <label className="form-date"><span>Proveedor (NPI)</span>
          <select value={form.providerNpi} onChange={set("providerNpi")}>
            <option value="">— elige doctor —</option>
            {doctors.filter((d) => d.npi).map((d) => (
              <option key={d.id} value={d.npi}>{d.name} · {d.npi}</option>
            ))}
          </select>
        </label>
        <label className="form-date"><span>Payer ID (Availity)</span>
          <input value={form.payerId} onChange={set("payerId")} placeholder="ej. AETNA, BCBSF, 60054…" className="p-2 rounded bg-[#081424]" />
        </label>
        <label className="form-date"><span>Member ID</span>
          <input value={form.memberId} onChange={set("memberId")} placeholder="ID del asegurado" className="p-2 rounded bg-[#081424]" />
        </label>
        <label className="form-date"><span>Fecha de nacimiento</span>
          <input type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} className="p-2 rounded bg-[#081424]" />
        </label>
        <label className="form-date"><span>Service Type</span>
          <input value={form.serviceType} onChange={set("serviceType")} placeholder="30 = general" className="p-2 rounded bg-[#081424]" />
        </label>
        <div className="elig-submit">
          <button className="btn-red" onClick={submit} disabled={loading}>
            {loading ? "Consultando…" : "Verificar cobertura"}
          </button>
        </div>
      </div>

      {result && (
        <div className="verify-box" style={{ marginTop: 14 }}>
          {result.configured === false ? (
            <div className="v-muted">Availity no está configurado: {result.reason}</div>
          ) : result.ok === false ? (
            <div className="v-bad">Error: {result.error || "consulta fallida"} {result.detail ? `· ${typeof result.detail === "string" ? result.detail : JSON.stringify(result.detail)}` : ""}</div>
          ) : (
            <>
              <div className="verify-row">
                <strong>Cobertura:</strong>{" "}
                <span className={result.active ? "v-ok" : "v-bad"}>
                  {result.active ? "ACTIVA" : "No activa / no confirmada"}
                </span>
                {result.status ? ` · ${result.status}` : ""}
              </div>
              <button className="link-btn" onClick={() => setShowRaw(!showRaw)}>
                {showRaw ? "Ocultar" : "Ver"} respuesta completa de Availity
              </button>
              {showRaw && (
                <pre className="elig-raw">{JSON.stringify(result.raw ?? result, null, 2)}</pre>
              )}
            </>
          )}
        </div>
      )}

      <p className="guide-note" style={{ marginTop: 12 }}>
        La primera vez, usa "Ver respuesta completa" para confirmar los nombres de los campos de tu pagador
        y, si hace falta, ajustamos el mapeo. Los Payer ID los da la Payer List de Availity.
      </p>
    </div>
  );
}

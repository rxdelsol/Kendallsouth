import React, { useEffect, useMemo, useState } from "react";
import { PageHead } from "./Shell.jsx";
import { daysUntil, statusOf, doctorCredentials } from "../utils/credStatus";
import { familiaDe } from "../utils/coverage";
import { toCsv, descargar } from "../utils/csv";
import "./styles/reports.css";

const fecha = (v) => (v ? new Date(String(v).slice(0, 10) + "T00:00:00").toLocaleDateString() : "");
const sello = () => new Date().toISOString().slice(0, 10).replace(/-/g, "_");

// Historial de generaciones. Vive en este navegador: no hay tabla de reportes
// en la base, así que no finjo un historial compartido entre usuarios.
const CLAVE = "ks_reports_log";
const leerLog = () => { try { return JSON.parse(localStorage.getItem(CLAVE) || "[]"); } catch { return []; } };
const guardarLog = (l) => { try { localStorage.setItem(CLAVE, JSON.stringify(l.slice(0, 12))); } catch {} };

export default function Reports() {
  const [doctores, setDoctores] = useState([]);
  const [seguros, setSeguros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [log, setLog] = useState(leerLog);

  useEffect(() => {
    Promise.all([
      fetch("/api/get-doctors").then((r) => r.json()).catch(() => ({})),
      fetch("/api/get-insurances").then((r) => r.json()).catch(() => ({})),
    ])
      .then(([d, s]) => {
        setDoctores(d && d.ok ? d.data || [] : []);
        setSeguros(s && s.ok ? s.data || [] : []);
      })
      .finally(() => setCargando(false));
  }, []);

  const redPorDoctor = useMemo(() => {
    const m = new Map();
    seguros.forEach((s) => {
      const k = (s.doctorName || "").trim();
      if (!k) return;
      m.set(k, (m.get(k) || false) || !String(s.network || "").toLowerCase().includes("out"));
    });
    return m;
  }, [seguros]);

  function registrar(nombre, archivo, filas) {
    const l = [{ nombre, archivo, filas, cuando: new Date().toISOString() }, ...leerLog()];
    guardarLog(l);
    setLog(l.slice(0, 12));
  }

  // ---- Los cuatro reportes ----
  const REPORTES = [
    {
      id: "roster",
      icono: "M7 3h10v18H7zM10 7h4M10 11h4M10 15h4",
      tono: "t-acc",
      titulo: "Provider Roster",
      sub: "Complete list of providers with status, network and expiration.",
      generar: () => {
        const cols = [
          { label: "Provider", get: (d) => d.name },
          { label: "NPI", get: (d) => d.npi || "" },
          { label: "Specialty", get: (d) => d.taxonomy || "" },
          { label: "License", get: (d) => d.license || "" },
          { label: "License expires", get: (d) => fecha(d.licenseExp) },
          { label: "DEA", get: (d) => d.dea || "" },
          { label: "DEA expires", get: (d) => fecha(d.deaExp) },
          { label: "CAQH", get: (d) => d.caqh || "" },
          { label: "Medicaid ID", get: (d) => d.medicaid || "" },
          { label: "Medicare ID", get: (d) => d.medicare || "" },
          { label: "Network", get: (d) => (redPorDoctor.get((d.name || "").trim()) ? "In Network" : "Out of Network") },
          { label: "Contracts", get: (d) => seguros.filter((s) => (s.doctorName || "").trim() === (d.name || "").trim()).length },
        ];
        return { csv: toCsv(cols, doctores), filas: doctores.length, archivo: `provider_roster_${sello()}.csv` };
      },
    },
    {
      id: "expiring",
      icono: "M12 7v5l3 2M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z",
      tono: "t-mid",
      titulo: "Expiring Credentials",
      sub: "Every credential coming due in 30, 60 or 90 days — plus what already lapsed.",
      generar: () => {
        const filas = [];
        doctores.forEach((d) => {
          doctorCredentials(d).forEach((c) => {
            if (!c.date) return;
            const st = statusOf(c.date);
            if (st === "ok") return;
            filas.push({ doc: d, cred: c, st, dias: daysUntil(c.date) });
          });
          seguros.filter((s) => (s.doctorName || "").trim() === (d.name || "").trim()).forEach((s) => {
            if (!s.expiration) return;
            const st = statusOf(s.expiration);
            if (st === "ok") return;
            filas.push({ doc: d, cred: { label: "Contract · " + s.name, date: s.expiration, action: "Renew the contract with the payer." }, st, dias: daysUntil(s.expiration) });
          });
        });
        filas.sort((a, b) => (a.dias ?? 0) - (b.dias ?? 0));
        const cols = [
          { label: "Provider", get: (f) => f.doc.name },
          { label: "NPI", get: (f) => f.doc.npi || "" },
          { label: "Credential", get: (f) => f.cred.label },
          { label: "Expires", get: (f) => fecha(f.cred.date) },
          { label: "Days left", get: (f) => f.dias },
          { label: "Status", get: (f) => (f.st === "expired" ? "Expired" : f.st === "d30" ? "≤ 30 days" : f.st === "d60" ? "31–60 days" : "61–90 days") },
          { label: "What to do", get: (f) => f.cred.action || "" },
        ];
        return { csv: toCsv(cols, filas), filas: filas.length, archivo: `expiring_credentials_${sello()}.csv` };
      },
    },
    {
      id: "participation",
      icono: "M12 2l8 4v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6z",
      tono: "t-ok",
      titulo: "Insurance Participation",
      sub: "Network status by payer and provider, one row per contract.",
      generar: () => {
        const cols = [
          { label: "Insurer", get: (s) => familiaDe(s.name) },
          { label: "Plan", get: (s) => s.name },
          { label: "Type", get: (s) => s.type || "" },
          { label: "Provider", get: (s) => s.doctorName || "" },
          { label: "Network", get: (s) => s.network || "" },
          { label: "Expiration", get: (s) => fecha(s.expiration) },
          { label: "Days left", get: (s) => { const d = daysUntil(s.expiration); return d === null ? "" : d; } },
          { label: "Notes", get: (s) => s.notes || "" },
        ];
        const orden = [...seguros].sort((a, b) => familiaDe(a.name).localeCompare(familiaDe(b.name)) || (a.doctorName || "").localeCompare(b.doctorName || ""));
        return { csv: toCsv(cols, orden), filas: orden.length, archivo: `insurance_participation_${sello()}.csv` };
      },
    },
    {
      id: "matrix",
      icono: "M4 6h7v5H4zm9 0h7v5h-7zM4 13h7v5H4zm9 0h7v5h-7z",
      tono: "t-cat",
      titulo: "Provider × Payer Matrix",
      sub: "The full grid: one row per provider, one column per payer.",
      generar: () => {
        const payers = Array.from(new Set(seguros.map((s) => (s.name || "").trim()).filter(Boolean))).sort();
        const nombres = Array.from(new Set([
          ...doctores.map((d) => (d.name || "").trim()),
          ...seguros.map((s) => (s.doctorName || "").trim()),
        ].filter(Boolean))).sort();
        const cols = [{ label: "Provider", get: (n) => n }].concat(
          payers.map((p) => ({
            label: p,
            get: (n) => {
              const filas = seguros.filter((s) => (s.doctorName || "").trim() === n && (s.name || "").trim() === p);
              if (!filas.length) return "";
              return filas.some((f) => !String(f.network || "").toLowerCase().includes("out")) ? "In Network" : "Out of Network";
            },
          }))
        );
        return { csv: toCsv(cols, nombres), filas: nombres.length, archivo: `provider_payer_matrix_${sello()}.csv` };
      },
    },
  ];

  function correr(r) {
    const { csv, filas, archivo } = r.generar();
    descargar(archivo, csv);
    registrar(r.titulo, archivo, filas);
  }

  const cuando = (iso) => {
    const t = new Date(iso);
    return isNaN(t) ? "" : t.toLocaleString([], { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div>
      <PageHead icono="reports" titulo="Reports" sub="Generate and export data" />

      {cargando ? (
        <p className="ks-muted text-sm">Loading…</p>
      ) : (
        <>
          <div className="rep-grid">
            {REPORTES.map((r) => (
              <section className={"panel rep-card " + r.tono} key={r.id}>
                <span className="rep-ic">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d={r.icono} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
                <h3>{r.titulo}</h3>
                <p>{r.sub}</p>
                <button type="button" className="btn-pri" onClick={() => correr(r)}>Generate</button>
              </section>
            ))}
          </div>

          <section className="panel">
            <h3 className="rep-head">Recent reports</h3>
            {log.length === 0 ? (
              <p className="pg-empty">Nothing generated from this browser yet.</p>
            ) : (
              <div className="overflow-auto">
                <table className="prov-table">
                  <thead>
                    <tr><th>Report</th><th>File</th><th className="num">Rows</th><th>Generated</th></tr>
                  </thead>
                  <tbody>
                    {log.map((l, i) => (
                      <tr key={l.cuando + i}>
                        <td>{l.nombre}</td>
                        <td className="mono q">{l.archivo}</td>
                        <td className="num mono">{l.filas}</td>
                        <td className="q">{cuando(l.cuando)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* Sin rodeos sobre qué es esta lista: no hay tabla de reportes en
                la base, así que este historial es de este navegador y los
                archivos no quedan guardados en ningún lado. Volver a generar
                usa los datos de HOY, que pueden no ser los de aquel día. */}
            <p className="rep-note">
              This list lives in this browser only — there is no report table in the database, and the files
              themselves are not stored anywhere. Generating again uses today&rsquo;s data, which may differ from
              the day a file was first produced.
            </p>
          </section>
        </>
      )}
    </div>
  );
}

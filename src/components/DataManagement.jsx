import React, { useEffect, useMemo, useRef, useState } from "react";
import { PageHead } from "./Shell.jsx";
import { toCsv, descargar, parseCsv, campo, fechaIso } from "../utils/csv";
import "./styles/reports.css";

const sello = () => new Date().toISOString().slice(0, 10).replace(/-/g, "_");
const fecha = (v) => (v ? new Date(String(v).slice(0, 10) + "T00:00:00").toLocaleDateString() : "");

const CLAVE = "ks_last_upload";

export default function DataManagement() {
  const [tab, setTab] = useState("providers");
  const [doctores, setDoctores] = useState([]);
  const [seguros, setSeguros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [arrastre, setArrastre] = useState(false);
  const [trabajando, setTrabajando] = useState(false);
  const [msg, setMsg] = useState(null);
  const [ultima, setUltima] = useState(() => { try { return JSON.parse(localStorage.getItem(CLAVE) || "null"); } catch { return null; } });
  const inputRef = useRef(null);

  async function cargar() {
    const [d, s] = await Promise.all([
      fetch("/api/get-doctors").then((r) => r.json()).catch(() => ({})),
      fetch("/api/get-insurances").then((r) => r.json()).catch(() => ({})),
    ]);
    setDoctores(d && d.ok ? d.data || [] : []);
    setSeguros(s && s.ok ? s.data || [] : []);
    setCargando(false);
  }
  useEffect(() => { cargar(); }, []);

  const TABS = [
    ["providers", "Providers", doctores.length],
    ["insurances", "Insurances", seguros.length],
    ["matrix", "Provider × Payer", doctores.length],
  ];

  // ---- Descargas, por pestaña ----
  function descargarCsv() {
    if (tab === "providers") {
      const cols = [
        { label: "Name", get: (d) => d.name }, { label: "NPI", get: (d) => d.npi || "" },
        { label: "License", get: (d) => d.license || "" }, { label: "License expires", get: (d) => d.licenseExp || "" },
        { label: "DEA", get: (d) => d.dea || "" }, { label: "DEA expires", get: (d) => d.deaExp || "" },
        { label: "CAQH", get: (d) => d.caqh || "" }, { label: "CAQH attested", get: (d) => d.caqhAttested || "" },
        { label: "Medicaid ID", get: (d) => d.medicaid || "" }, { label: "Medicare ID", get: (d) => d.medicare || "" },
        { label: "Malpractice expires", get: (d) => d.malpracticeExp || "" },
        { label: "Medicare revalidation", get: (d) => d.medicareRevalidation || "" },
        { label: "Taxonomy", get: (d) => d.taxonomy || "" }, { label: "DOB", get: (d) => d.dob || "" },
      ];
      descargar(`providers_${sello()}.csv`, toCsv(cols, doctores));
    } else if (tab === "insurances") {
      const cols = [
        { label: "Name", get: (s) => s.name }, { label: "Type", get: (s) => s.type || "" },
        { label: "Provider", get: (s) => s.doctorName || "" }, { label: "Network", get: (s) => s.network || "" },
        { label: "Expiration", get: (s) => s.expiration || "" }, { label: "Notes", get: (s) => s.notes || "" },
      ];
      descargar(`insurances_${sello()}.csv`, toCsv(cols, seguros));
    } else {
      const payers = Array.from(new Set(seguros.map((s) => (s.name || "").trim()).filter(Boolean))).sort();
      const nombres = Array.from(new Set(doctores.map((d) => (d.name || "").trim()).filter(Boolean))).sort();
      const cols = [{ label: "Provider", get: (n) => n }].concat(payers.map((p) => ({
        label: p,
        get: (n) => {
          const f = seguros.filter((s) => (s.doctorName || "").trim() === n && (s.name || "").trim() === p);
          return f.length ? (f.some((x) => !String(x.network || "").toLowerCase().includes("out")) ? "In Network" : "Out of Network") : "";
        },
      })));
      descargar(`provider_payer_${sello()}.csv`, toCsv(cols, nombres));
    }
  }

  async function descargarJson() {
    setMsg(null);
    try {
      const r = await fetch("/api/export-database");
      const j = await r.json();
      descargar(`kendallsouth_backup_${sello()}.json`, JSON.stringify(j, null, 2), "application/json");
    } catch (e) {
      setMsg({ tipo: "bad", texto: "Could not reach the database to build the backup." });
    }
  }

  // ---- Subida ----
  // Dos caminos distintos a propósito. El CSV AGREGA o actualiza fila por fila
  // y no borra nada. El backup .json REEMPLAZA la base entera, así que pide
  // confirmación explícita: es la única acción de esta pantalla que destruye
  // datos, y no debería poder dispararse arrastrando un archivo sin querer.
  async function procesar(file) {
    setMsg(null);
    const nombre = file.name.toLowerCase();

    if (nombre.endsWith(".xlsx") || nombre.endsWith(".xls")) {
      setMsg({ tipo: "bad", texto: "Excel files are not supported. In Excel: File → Save As → CSV UTF-8, then upload that." });
      return;
    }
    if (!nombre.endsWith(".csv") && !nombre.endsWith(".json")) {
      setMsg({ tipo: "bad", texto: "Upload a .csv or a .json backup." });
      return;
    }

    const texto = await file.text();
    setTrabajando(true);
    try {
      if (nombre.endsWith(".json")) {
        const obj = JSON.parse(texto);
        const nd = (obj.doctorsList || []).length;
        const ni = (obj.insuranceList || []).length;
        const ok = window.confirm(
          `This REPLACES the whole database with the file's contents: ${nd} provider(s) and ${ni} contract(s).\n\n` +
          `Everything currently stored (${doctores.length} providers, ${seguros.length} contracts) is deleted first. ` +
          `This cannot be undone.\n\nContinue?`
        );
        if (!ok) { setTrabajando(false); return; }
        const r = await fetch("/api/import-database", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj),
        });
        const j = await r.json();
        if (!j.ok) throw new Error(j.error || "import failed");
        registrarSubida(file, nd + ni, "Full restore");
        setMsg({ tipo: "ok", texto: `Database restored: ${nd} providers and ${ni} contracts.` });
      } else {
        const { registros } = parseCsv(texto);
        if (!registros.length) throw new Error("The file has no data rows.");
        let ok = 0;
        const fallos = [];
        for (const reg of registros) {
          const esProveedor = tab === "providers";
          const cuerpo = esProveedor
            ? {
                name: campo(reg, "name", "provider", "full name", "doctor"),
                npi: campo(reg, "npi"),
                license: campo(reg, "license", "license number"),
                licenseExp: fechaIso(campo(reg, "license expires", "license exp", "license expiration")),
                dea: campo(reg, "dea"),
                deaExp: fechaIso(campo(reg, "dea expires", "dea exp")),
                caqh: campo(reg, "caqh"),
                caqhAttested: fechaIso(campo(reg, "caqh attested", "caqh attestation")),
                medicaid: campo(reg, "medicaid id", "medicaid"),
                medicare: campo(reg, "medicare id", "medicare"),
                malpracticeExp: fechaIso(campo(reg, "malpractice expires", "malpractice")),
                medicareRevalidation: fechaIso(campo(reg, "medicare revalidation")),
                taxonomy: campo(reg, "taxonomy", "specialty"),
                dob: fechaIso(campo(reg, "dob", "date of birth")),
              }
            : {
                name: campo(reg, "name", "insurance", "payer", "plan"),
                type: campo(reg, "type", "plan type"),
                doctorName: campo(reg, "provider", "doctor", "doctor name"),
                network: campo(reg, "network", "status"),
                expiration: fechaIso(campo(reg, "expiration", "expires", "expiration date")),
                notes: campo(reg, "notes", "note"),
              };
          if (!cuerpo.name) { fallos.push("row without a name"); continue; }
          const r = await fetch(esProveedor ? "/api/save-doctor" : "/api/save-insurance", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo),
          });
          const j = await r.json().catch(() => ({}));
          if (j && j.ok) ok++; else fallos.push(`${cuerpo.name}: ${(j && j.error) || "rejected"}`);
        }
        await cargar();
        registrarSubida(file, ok, tab === "providers" ? "Providers (add / update)" : "Insurances (add / update)");
        setMsg(
          fallos.length
            ? { tipo: "warn", texto: `${ok} of ${registros.length} rows saved. Not saved: ${fallos.slice(0, 4).join("; ")}${fallos.length > 4 ? ` … and ${fallos.length - 4} more` : ""}` }
            : { tipo: "ok", texto: `${ok} row${ok === 1 ? "" : "s"} saved. Nothing was deleted.` }
        );
      }
    } catch (e) {
      setMsg({ tipo: "bad", texto: "Could not process the file: " + (e.message || "unknown error") });
    } finally {
      setTrabajando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function registrarSubida(file, filas, que) {
    const u = { archivo: file.name, cuando: new Date().toISOString(), filas, que };
    try { localStorage.setItem(CLAVE, JSON.stringify(u)); } catch {}
    setUltima(u);
  }

  const onDrop = (e) => {
    e.preventDefault(); setArrastre(false);
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) procesar(f);
  };

  const cuando = (iso) => { const t = new Date(iso); return isNaN(t) ? "" : t.toLocaleString(); };

  return (
    <div>
      <PageHead icono="data" titulo="Data Management" sub="Upload, download and manage your provider and insurance data" />

      <div className="panel">
        <div className="lk-tabs">
          {TABS.map(([id, etq, n]) => (
            <button key={id} type="button" className={"lk-tab" + (tab === id ? " on" : "")} onClick={() => setTab(id)}>
              {etq} <span className="dm-n">{n}</span>
            </button>
          ))}
        </div>

        {msg && (
          <p className={"dm-msg " + msg.tipo}>{msg.texto}</p>
        )}

        <div className="dm-grid">
          <div
            className={"dm-drop" + (arrastre ? " on" : "")}
            onDragOver={(e) => { e.preventDefault(); setArrastre(true); }}
            onDragLeave={() => setArrastre(false)}
            onDrop={onDrop}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0L8 8m4-4l4 4M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <h4>Upload data</h4>
            <p>
              Drag a file here or <button type="button" className="dm-link" onClick={() => inputRef.current && inputRef.current.click()}>click to browse</button>
            </p>
            <small>
              CSV adds and updates <b>{tab === "insurances" ? "insurance" : "provider"}</b> rows without deleting anything.
              A <code>.json</code> backup replaces the entire database and asks first.
            </small>
            <input ref={inputRef} type="file" accept=".csv,.json" hidden onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) procesar(f); }} />
            {trabajando && <p className="dm-busy">Working…</p>}
          </div>

          <div className="dm-drop dm-out">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v12m0 0l-4-4m4 4l4-4M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <h4>Download data</h4>
            <p>Export what is stored right now.</p>
            <div className="dm-btns">
              <button className="btn-pri" onClick={descargarCsv} disabled={cargando}>Download CSV</button>
              <button className="flt-clear" onClick={descargarJson} disabled={cargando}>Full backup (.json)</button>
            </div>
            <small>The CSV covers the tab you are on. The backup covers everything and is what a restore reads.</small>
          </div>
        </div>

        <div className="dm-last">
          <h4>Last upload</h4>
          {!ultima ? (
            <p className="pg-empty">No file uploaded from this browser yet.</p>
          ) : (
            <table className="lk-def">
              <tbody>
                <tr><th>File name</th><td className="mono">{ultima.archivo}</td></tr>
                <tr><th>What it did</th><td>{ultima.que}</td></tr>
                <tr><th>Rows saved</th><td className="mono">{ultima.filas}</td></tr>
                <tr><th>Date</th><td className="mono">{cuando(ultima.cuando)}</td></tr>
              </tbody>
            </table>
          )}
          <p className="rep-note">Upload history is kept in this browser only — the database has no upload log.</p>
        </div>
      </div>
    </div>
  );
}

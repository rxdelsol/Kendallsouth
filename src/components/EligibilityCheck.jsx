import React, { useEffect, useMemo, useState } from "react";
import { daysUntil, statusOf } from "../utils/credStatus";
import { PageHead } from "./Shell.jsx";
import "./styles/matrix.css";
import "./styles/matrix.css";

// Debe coincidir con las claves de FHIR_PAYERS en api/_lib/fhirDirectory.js.
// Solo metadatos (sin secretos ni lógica) — la verificación real vive en el
// servidor (api/verify-provider-directory.js).
const FHIR_PAYER_KEYS = {
  aetna: "aetna",
  humana: "humana",
  unitedhealthcare: "unitedhealthcare",
  "florida blue": "florida_blue",
  molina: "molina",
  "sunshine health": "sunshine",
  ambetter: "ambetter",
  "simply healthcare": "simply",
  wellcare: "wellcare",
};

// Matriz Doctor × Seguro: muestra, para cada doctor y cada aseguradora, si está
// In Network / Out / Aplicó, según los datos del tracker (fuente de verdad para
// las comerciales; no existe API pública de participación de red).
//
// Además, el botón "Verify Medicare (CMS)" consulta EN VIVO el sistema oficial
// de CMS (PECOS) para confirmar automáticamente la inscripción en Medicare de cada
// doctor. Es dato oficial y automático; los demás seguros comerciales siguen siendo
// verificación manual porque no tienen API pública de red.

// Mapea el nombre de un seguro a su DIRECTORIO OFICIAL de proveedores (fuente
// autoritativa para confirmar in-network). Devuelve { family, url }. Para seguros
// no reconocidos usa una búsqueda para llegar al directorio oficial correcto.
function directoryInfoFor(name) {
  const n = (name || "").toLowerCase();
  if (n.includes("aetna"))
    return { family: "Aetna", url: "https://www.aetna.com/individuals-families/find-a-doctor.html" };
  if (n.includes("florida blue") || n.includes("floridablue") || n.includes("bcbs") || n.includes("blue cross"))
    return { family: "Florida Blue", url: "https://providersearch.floridablue.com/" };
  if (n.includes("ambetter"))
    return { family: "Ambetter", url: "https://www.ambetterhealth.com/en/fl/find-a-provider/" };
  if (n.includes("oscar"))
    return { family: "Oscar", url: "https://www.hioscar.com/search" };
  if (n.includes("molina"))
    return { family: "Molina", url: "https://molina.sapphirethreesixtyfive.com/?ci=fl-molina" };
  if (n.includes("sunshine"))
    return { family: "Sunshine Health", url: "https://www.sunshinehealth.com/find-a-doctor.html" };
  if (n.includes("simply"))
    return { family: "Simply Healthcare", url: "https://www.simplyhealthcareplans.com/florida-medicaid/find-a-doctor.html" };
  if (n.includes("united") || n.includes("uhc") || n.includes("optum"))
    return { family: "UnitedHealthcare", url: "https://www.uhc.com/find-a-doctor" };
  if (n.includes("cigna"))
    return { family: "Cigna", url: "https://hcpdirectory.cigna.com/web/public/consumer/directory/search" };
  if (n.includes("humana"))
    return { family: "Humana", url: "https://finder.humana.com/" };
  if (n.includes("wellcare"))
    return { family: "WellCare", url: "https://www.wellcare.com/en/Florida/Members/Medicaid-Plans/Find-a-Provider" };
  if (n.includes("curative"))
    return { family: "Curative", url: "https://www.curative.com/find-care" };
  if (n.includes("multiplan") || n.includes("phcs"))
    return { family: "MultiPlan/PHCS", url: "https://www.multiplan.com/webcenter/portal/ProviderSearch" };
  if (n.includes("devoted"))
    return { family: "Devoted Health", url: "https://www.devoted.com/find-a-doctor/" };
  if (n.includes("careplus"))
    return { family: "CarePlus", url: "https://www.careplushealthplans.com/resources/find-a-doctor/" };
  if (n.includes("medicaid"))
    return { family: "Medicaid FL (AHCA)", url: "https://www.flmedicaidmanagedcare.com/providerSearch/" };
  if (n.includes("medicare"))
    return { family: "Medicare (CMS)", url: "https://www.medicare.gov/care-compare/" };
  return { family: name, url: "https://www.google.com/search?q=" + encodeURIComponent(name + " find a provider directory Florida") };
}

export default function EligibilityCheck() {
  const [insurances, setInsurances] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [payerQ, setPayerQ] = useState("");
  const [fDoc, setFDoc] = useState("all");
  const [onlyGaps, setOnlyGaps] = useState(false);

  // Verificación automática de Medicare (CMS/PECOS), keyed por NPI.
  const [medStatus, setMedStatus] = useState({}); // npi -> { enrolled, eid, error }
  const [verifying, setVerifying] = useState(false);
  const [verifiedDone, setVerifiedDone] = useState(0);
  const [verifiedTotal, setVerifiedTotal] = useState(0);

  // Verificación automática de aseguradoras comerciales (Provider Directory FHIR
  // oficial de cada pagador — igual de "en vivo" que Medicare, pero una por pagador
  // y solo si configuraste sus credenciales en Vercel; ver SETUP-PROVIDER-DIRECTORY-APIS.md).
  const [fhirStatus, setFhirStatus] = useState({}); // payerKey -> { npi -> {inNetwork, foundPractitioner, configured, error, reason} }
  const [verifyingFhir, setVerifyingFhir] = useState({}); // payerKey -> bool
  const [fhirProgress, setFhirProgress] = useState({}); // payerKey -> { done, total }

  // Directorios oficiales: doctor seleccionado (NPI) y mensaje de confirmación.
  const [selDoc, setSelDoc] = useState("");
  const [copiedMsg, setCopiedMsg] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/get-insurances").then((r) => r.json()).catch(() => null),
      fetch("/api/get-doctors").then((r) => r.json()).catch(() => null),
    ]).then(([ins, docs]) => {
      if (ins?.ok) setInsurances(ins.data || []);
      if (docs?.ok) setDoctors(docs.data || []);
    });
  }, []);

  const norm = (s) => (s || "").trim().toLowerCase();

  // name -> npi (para cruzar la matriz con la verificación de CMS)
  const npiByName = useMemo(() => {
    const m = new Map();
    doctors.forEach((d) => { if (d.name && d.npi) m.set(norm(d.name), String(d.npi).trim()); });
    return m;
  }, [doctors]);

  // Consulta CMS para todos los doctores con NPI válido y guarda el resultado.
  async function verifyMedicare() {
    const targets = doctors.filter((d) => /^\d{10}$/.test(String(d.npi || "").trim()));
    setVerifying(true);
    setVerifiedTotal(targets.length);
    setVerifiedDone(0);
    const next = {};
    await Promise.all(
      targets.map(async (d) => {
        const npi = String(d.npi).trim();
        try {
          const r = await fetch("/api/verify-medicare?npi=" + npi);
          const j = await r.json();
          next[npi] = { enrolled: !!j.enrolled, eid: j.enrollmentId || "", state: j.state || "" };
        } catch (e) {
          next[npi] = { error: true };
        } finally {
          setVerifiedDone((n) => n + 1);
        }
      })
    );
    setMedStatus(next);
    setVerifying(false);
  }

  const medCell = (doctorName) => {
    const npi = npiByName.get(norm(doctorName));
    if (!npi) return { kind: "sin-npi" };
    const s = medStatus[npi];
    if (!s) return { kind: "none" };
    if (s.error) return { kind: "error" };
    return s.enrolled ? { kind: "in", eid: s.eid } : { kind: "review" };
  };

  const medEnrolledCount = useMemo(
    () => Object.values(medStatus).filter((s) => s && s.enrolled).length,
    [medStatus]
  );
  const hasMed = Object.keys(medStatus).length > 0;

  // Consulta el Provider Directory FHIR oficial de `payerKey` para todos los
  // doctores con NPI válido. Igual patrón que verifyMedicare(), pero por pagador.
  async function verifyFhirPayer(payerKey) {
    const targets = doctors.filter((d) => /^\d{10}$/.test(String(d.npi || "").trim()));
    setVerifyingFhir((s) => ({ ...s, [payerKey]: true }));
    setFhirProgress((s) => ({ ...s, [payerKey]: { done: 0, total: targets.length } }));
    const next = {};
    await Promise.all(
      targets.map(async (d) => {
        const npi = String(d.npi).trim();
        try {
          const r = await fetch(`/api/verify-provider-directory?payer=${payerKey}&npi=${npi}&name=${encodeURIComponent(d.name || "")}`);
          const j = await r.json();
          next[npi] = {
            configured: !!j.configured,
            inNetwork: !!j.inNetwork,
            foundPractitioner: !!j.foundPractitioner,
            reason: j.reason || j.error || "",
          };
        } catch (e) {
          next[npi] = { error: true };
        } finally {
          setFhirProgress((s) => ({ ...s, [payerKey]: { done: (s[payerKey]?.done || 0) + 1, total: targets.length } }));
        }
      })
    );
    setFhirStatus((s) => ({ ...s, [payerKey]: next }));
    setVerifyingFhir((s) => ({ ...s, [payerKey]: false }));
  }

  // Estado FHIR de una celda (payerKey + doctor). null si aún no se ha verificado ese pagador.
  const fhirCell = (payerKey, doctorName) => {
    const npi = npiByName.get(norm(doctorName));
    const byNpi = fhirStatus[payerKey];
    if (!npi || !byNpi) return null;
    const s = byNpi[npi];
    if (!s) return null;
    if (s.error) return { kind: "error" };
    if (!s.configured) return { kind: "unconfigured", reason: s.reason };
    if (!s.foundPractitioner) return { kind: "review", reason: s.reason };
    return { kind: s.inNetwork ? "in" : "review" };
  };

  // Filas: doctores (de la tabla doctors + los que aparezcan en seguros)
  const doctorRows = useMemo(() => {
    const set = new Map();
    doctors.forEach((d) => { if (d.name) set.set(norm(d.name), d.name.trim()); });
    insurances.forEach((i) => { if (i.doctorName && !set.has(norm(i.doctorName))) set.set(norm(i.doctorName), i.doctorName.trim()); });
    return Array.from(set.values()).sort((a, b) => a.localeCompare(b));
  }, [doctors, insurances]);

  // Columnas: aseguradoras únicas
  const payers = useMemo(() => {
    const set = new Set();
    insurances.forEach((i) => { if (i.name) set.add(i.name.trim()); });
    let arr = Array.from(set).sort((a, b) => a.localeCompare(b));
    const q = payerQ.toLowerCase().trim();
    if (q) arr = arr.filter((p) => p.toLowerCase().includes(q));
    return arr;
  }, [insurances, payerQ]);

  // Doctores con NPI válido (para el selector de directorios).
  const doctorsWithNpi = useMemo(
    () => doctors.filter((d) => /^\d{10}$/.test(String(d.npi || "").trim())),
    [doctors]
  );

  // Selecciona el primer doctor por defecto cuando cargan.
  useEffect(() => {
    if (!selDoc && doctorsWithNpi.length) setSelDoc(String(doctorsWithNpi[0].npi).trim());
  }, [doctorsWithNpi, selDoc]);

  // Botones de directorio: uno por "familia" de seguro (dedupe), sobre TODAS
  // las aseguradoras que tengas registradas (sin filtrar por la búsqueda).
  const dirButtons = useMemo(() => {
    const all = new Set();
    insurances.forEach((i) => { if (i.name) all.add(i.name.trim()); });
    const byFamily = new Map();
    Array.from(all).forEach((p) => {
      const info = directoryInfoFor(p);
      if (!byFamily.has(info.family)) byFamily.set(info.family, info.url);
    });
    return Array.from(byFamily.entries())
      .map(([family, url]) => ({ family, url, fhirKey: FHIR_PAYER_KEYS[family.toLowerCase()] || null }))
      .sort((a, b) => a.family.localeCompare(b.family));
  }, [insurances]);

  // Solo las familias que tienen un Provider Directory FHIR soportado (ver
  // FHIR_PAYER_KEYS arriba). Estas son las que consiguen un botón "oficial",
  // idéntico en espíritu al de Medicare — dato en vivo del propio pagador.
  const fhirButtons = useMemo(
    () => dirButtons.filter((b) => b.fhirKey),
    [dirButtons]
  );

  // Abre el directorio oficial del seguro y copia el NPI del doctor seleccionado.
  async function openDirectory(family, url) {
    const npi = selDoc;
    if (npi) {
      try {
        await navigator.clipboard.writeText(npi);
        setCopiedMsg(`NPI ${npi} copiado — pégalo en el directorio oficial de ${family}.`);
      } catch (e) {
        setCopiedMsg(`Abriendo ${family}. Busca el NPI ${npi} en el directorio.`);
      }
    } else {
      setCopiedMsg(`Abriendo ${family}. Elige un doctor arriba para copiar su NPI.`);
    }
    try { window.open(url, "_blank", "noopener"); } catch (e) {}
  }

  // Índice (doctor|payer) -> estado
  const cellFor = (doctor, payer) => {
    const rows = insurances.filter(
      (i) => norm(i.doctorName) === norm(doctor) && norm(i.name) === norm(payer)
    );
    if (rows.length === 0) return { state: "none" };
    const anyIn = rows.some((r) => norm(r.network).includes("in"));
    const applied = rows.some((r) => /appl|pending|submitted/i.test(`${r.notes || ""} ${r.network || ""}`));
    let state = anyIn ? "in" : applied ? "applied" : "out";
    // aviso de vencimiento para los In Network
    let warn = false;
    if (anyIn) {
      rows.forEach((r) => {
        if (norm(r.network).includes("in") && r.expiration) {
          const st = statusOf(r.expiration);
          if (st === "expired" || st === "d30" || st === "d60") warn = true;
        }
      });
    }
    const tip = rows
      .map((r) => `${r.type || ""} · ${r.network || ""}${r.expiration ? " · vence " + new Date(r.expiration).toLocaleDateString() : ""}${r.notes ? " · " + r.notes : ""}`)
      .join(" | ");
    return { state, warn, tip };
  };

  // Cuatro estados, cuatro clases. Los colores son los del semáforo del resto
  // del sistema: dentro de red = ok, aplicó = a la espera, fuera = hot, sin
  // registro = neutro. "Sin registro" NO es rojo: no saber si un proveedor
  // está en una red es distinto de saber que no lo está.
  const meta = {
    in: { cls: "mx-in", label: "In" },
    applied: { cls: "mx-app", label: "Applied" },
    out: { cls: "mx-out", label: "Out" },
    none: { cls: "mx-none", label: "—" },
  };

  // Precalcular la matriz
  const matrix = useMemo(() => {
    return doctorRows.map((doc) => {
      const cells = payers.map((p) => ({
        payer: p,
        fhirKey: FHIR_PAYER_KEYS[directoryInfoFor(p).family.toLowerCase()] || null,
        ...cellFor(doc, p),
      }));
      const inCount = cells.filter((c) => c.state === "in").length;
      return { doc, cells, inCount };
    });
  }, [doctorRows, payers, insurances]);

  const rowsToShow = useMemo(() => {
    let r = matrix;
    if (fDoc !== "all") r = r.filter((x) => x.doc === fDoc);
    if (onlyGaps) r = r.filter((x) => x.cells.some((c) => c.state === "out" || c.state === "applied"));
    return r;
  }, [matrix, fDoc, onlyGaps]);

  // Monograma de la aseguradora para la cabecera de columna. No uso los logos
  // de las aseguradoras: son marcas registradas de terceros y no me toca
  // redistribuirlas dentro de la app.
  const mono = (n) => String(n || "?").replace(/[^A-Za-z ]/g, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  const anyFhirBusy = Object.values(verifyingFhir).some(Boolean);
  const [herramientas, setHerramientas] = useState(false);

  return (
    <div>
      <PageHead icono="matrix" titulo="Provider × Payer Network Participation"
        sub="View each provider's participation status with different insurance payers" />

      <div className="filterbar">
        <div className="flex flex-col gap-1">
          <label>Provider</label>
          <select className="p-2 rounded ks-field text-sm" value={fDoc} onChange={(e) => setFDoc(e.target.value)}>
            <option value="all">All</option>
            {doctorRows.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label>Insurance</label>
          <input className="p-2 rounded ks-field text-sm" placeholder="Filter payer columns…" value={payerQ} onChange={(e) => setPayerQ(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label>Network</label>
          <select className="p-2 rounded ks-field text-sm" value={onlyGaps ? "gaps" : "all"} onChange={(e) => setOnlyGaps(e.target.value === "gaps")}>
            <option value="all">All providers</option>
            <option value="gaps">Only providers with gaps</option>
          </select>
        </div>
      </div>

      <div className="panel">
        {/* La leyenda va arriba de la matriz y siempre visible: sin ella, una
            celda de color no dice nada, y el color por sí solo nunca debería
            ser la única forma de leer un estado — por eso cada celda lleva
            además su palabra. */}
        <div className="mx-legend">
          {["in", "applied", "out", "none"].map((k) => (
            <span key={k} className="mx-lg">
              <i className={"mx-dot " + meta[k].cls} />
              {k === "in" ? "In Network" : k === "applied" ? "Applied / Pending" : k === "out" ? "Out of Network" : "Not Listed"}
            </span>
          ))}
          <span className="mx-lg mx-note"><i className="mx-warn" /> expiring or expired</span>
          <span className="mx-count">{rowsToShow.length} provider{rowsToShow.length === 1 ? "" : "s"} × {payers.length} payer{payers.length === 1 ? "" : "s"}</span>
        </div>

        <div className="mx-wrap">
          <table className="mx-table">
            <thead>
              <tr>
                <th className="mx-first">Provider</th>
                <th className="mx-num" title="Payers where this provider is in network">In</th>
                <th title="Medicare enrollment per CMS/PECOS — official live data">
                  <span className="mx-mono mx-cms">CMS</span>
                  <span className="mx-pname">Medicare</span>
                </th>
                {payers.map((p) => (
                  <th key={p} title={p}>
                    <span className="mx-mono">{mono(p)}</span>
                    <span className="mx-pname">{p}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowsToShow.map((row) => {
                const mc = medCell(row.doc);
                return (
                  <tr key={row.doc}>
                    <td className="mx-first">{row.doc}</td>
                    <td className="mx-num"><b>{row.inCount}</b></td>
                    <td title={mc.kind === "in" ? ("Enrolled in Medicare · ID " + (mc.eid || "—")) : mc.kind === "review" ? "Not found in CMS — worth checking (can be normal depending on provider type)" : mc.kind === "sin-npi" ? "No valid NPI on file" : "Not checked yet"}>
                      {mc.kind === "in" ? <span className="mx-cell mx-in">In</span>
                        : mc.kind === "review" ? <span className="mx-cell mx-app">Review</span>
                        : mc.kind === "error" ? <span className="mx-cell mx-out">Error</span>
                        : <span className="mx-cell mx-none">—</span>}
                    </td>
                    {row.cells.map((c) => {
                      const m = meta[c.state];
                      const fc = c.fhirKey ? fhirCell(c.fhirKey, row.doc) : null;
                      const fcTip =
                        fc?.kind === "in" ? "Confirmed in the payer's official Provider Directory (live data)"
                        : fc?.kind === "review" ? `Not listed as active in the official Provider Directory — worth checking${fc.reason ? " (" + fc.reason + ")" : ""}`
                        : fc?.kind === "unconfigured" ? "Official Provider Directory not configured yet"
                        : fc?.kind === "error" ? "Error querying the official Provider Directory"
                        : "";
                      // Si ya se verificó EN VIVO contra el Provider Directory
                      // oficial, ese resultado manda sobre lo cargado a mano:
                      // es la fuente autoritativa. Si no se verificó, se sigue
                      // mostrando lo que dice tu tracker.
                      return (
                        <td key={c.payer} title={[c.tip, fcTip].filter(Boolean).join(" | ")}>
                          {fc?.kind === "in" ? <span className="mx-cell mx-in mx-live">In</span>
                            : fc?.kind === "review" ? <span className="mx-cell mx-app mx-live">Review</span>
                            : <span className={"mx-cell " + m.cls}>{m.label}{c.warn ? <i className="mx-warn" /> : null}</span>}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {rowsToShow.length === 0 && (
                <tr><td className="mx-empty" colSpan={payers.length + 3}>No provider matches the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verificación en vivo. Va debajo y plegada: la matriz es lo que se
          mira todos los días; esto se usa cuando hay una duda concreta. */}
      <section className="panel mx-tools">
        <button type="button" className="mx-tools-head" aria-expanded={herramientas} onClick={() => setHerramientas((v) => !v)}>
          <span>Verify against official sources</span>
          <small>Live data from CMS and each payer&rsquo;s own Provider Directory</small>
          <span className="pg-chev">{herramientas ? "\u2212" : "+"}</span>
        </button>

        {herramientas && (
          <div className="mx-tools-body">
            <div className="mx-tool-row">
              <button className="btn-pri" onClick={verifyMedicare} disabled={verifying}>
                {verifying ? `Checking… ${verifiedDone}/${verifiedTotal}` : "Verify Medicare (official CMS)"}
              </button>
              {hasMed && !verifying && (
                <span className="v-ok" style={{ fontSize: 12.5 }}>
                  {medEnrolledCount}/{Object.keys(medStatus).length} enrolled in Medicare (PECOS)
                </span>
              )}
              <span className="mx-hint">Official CMS data, queried live.</span>
            </div>

            {fhirButtons.length > 0 && (
              <div className="mx-tool-block">
                <h4>Commercial payers &mdash; official Provider Directory</h4>
                <div className="mx-chiprow">
                  {fhirButtons.map((b) => {
                    const busy = !!verifyingFhir[b.fhirKey];
                    const prog = fhirProgress[b.fhirKey];
                    const byNpi = fhirStatus[b.fhirKey];
                    const done = byNpi && !busy;
                    const configuredCount = done ? Object.values(byNpi).filter((s) => s.configured).length : 0;
                    const inCount = done ? Object.values(byNpi).filter((s) => s.inNetwork).length : 0;
                    const allUnconfigured = done && configuredCount === 0;
                    // Ambetter, Simply, Sunshine y WellCare comparten UN
                    // servidor FHIR de Centene. Dos verificaciones a la vez
                    // disparan 24-48 llamadas simultáneas contra él y empieza
                    // a devolver "no encontrado" para doctores que SÍ están en
                    // la red — falsos negativos, comprobados probando una sola
                    // aseguradora contra varias a la vez. Por eso van en fila.
                    const disabledByOther = anyFhirBusy && !busy;
                    return (
                      <button
                        key={b.fhirKey}
                        className={"mx-chip" + (busy ? " busy" : "") + (allUnconfigured ? " off" : "")}
                        onClick={() => verifyFhirPayer(b.fhirKey)}
                        disabled={busy || disabledByOther}
                        title={disabledByOther
                          ? "Wait for the running check to finish — several payers share one server, so they are queried one at a time"
                          : done && allUnconfigured ? "Not configured yet — see SETUP-PROVIDER-DIRECTORY-APIS.md"
                          : `Check ${b.family} in its official Provider Directory`}
                      >
                        {busy ? `${b.family}… ${prog?.done ?? 0}/${prog?.total ?? 0}`
                          : done ? (allUnconfigured ? `${b.family}: not configured` : `${b.family}: ${inCount}/${configuredCount} in network`)
                          : `Check ${b.family}`}
                      </button>
                    );
                  })}
                </div>
                <p className="mx-hint">
                  Each payer publishes its own Provider Directory (required by CMS). You register once, free, on that
                  payer&rsquo;s developer portal and paste the keys into Vercel — see <code>SETUP-PROVIDER-DIRECTORY-APIS.md</code>.
                  Until then the button says so and nothing breaks.
                </p>
              </div>
            )}

            <div className="mx-tool-block">
              <h4>Open a payer&rsquo;s directory</h4>
              <div className="mx-tool-row">
                <select className="p-2 rounded ks-field text-sm" value={selDoc} onChange={(e) => setSelDoc(e.target.value)}>
                  <option value="">— choose a provider —</option>
                  {doctorsWithNpi.map((d) => (
                    <option key={String(d.npi)} value={String(d.npi).trim()}>{d.name} · NPI {d.npi}</option>
                  ))}
                </select>
              </div>
              <div className="mx-chiprow">
                {dirButtons.map((b) => (
                  <button key={b.family} className="mx-chip ghost" onClick={() => openDirectory(b.family, b.url)}
                    title={`Open ${b.family}'s official directory and copy the NPI`}>
                    {b.family}
                  </button>
                ))}
              </div>
              {copiedMsg && <p className="v-ok" style={{ fontSize: 12.5, marginTop: 7 }}>{copiedMsg}</p>}
              <p className="mx-hint">
                Opens the payer&rsquo;s own directory and copies the NPI, so you confirm against the authoritative
                source rather than a number typed here.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

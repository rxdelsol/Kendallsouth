import React, { useEffect, useMemo, useState } from "react";
import { daysUntil, statusOf } from "../utils/credStatus";

// Matriz Doctor × Seguro: muestra, para cada doctor y cada aseguradora, si está
// In Network / Out / Aplicó, según los datos del tracker (fuente de verdad para
// las comerciales; no existe API pública de participación de red).
//
// Además, el botón "Verificar Medicare (CMS)" consulta EN VIVO el sistema oficial
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
  const [onlyGaps, setOnlyGaps] = useState(false);

  // Verificación automática de Medicare (CMS/PECOS), keyed por NPI.
  const [medStatus, setMedStatus] = useState({}); // npi -> { enrolled, eid, error }
  const [verifying, setVerifying] = useState(false);
  const [verifiedDone, setVerifiedDone] = useState(0);
  const [verifiedTotal, setVerifiedTotal] = useState(0);

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
      .map(([family, url]) => ({ family, url }))
      .sort((a, b) => a.family.localeCompare(b.family));
  }, [insurances]);

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

  const meta = {
    in: { bg: "#14532d", fg: "#bbf7d0", label: "In" },
    applied: { bg: "#713f12", fg: "#fde68a", label: "Aplicó" },
    out: { bg: "#4b1e1e", fg: "#fecaca", label: "Out" },
    none: { bg: "transparent", fg: "#334155", label: "·" },
  };

  // Precalcular la matriz
  const matrix = useMemo(() => {
    return doctorRows.map((doc) => {
      const cells = payers.map((p) => ({ payer: p, ...cellFor(doc, p) }));
      const inCount = cells.filter((c) => c.state === "in").length;
      return { doc, cells, inCount };
    });
  }, [doctorRows, payers, insurances]);

  const rowsToShow = onlyGaps
    ? matrix.filter((r) => r.cells.some((c) => c.state === "out" || c.state === "applied"))
    : matrix;

  const thBase = { position: "sticky", top: 0, background: "#0b1a33", zIndex: 2, padding: "6px 4px", fontSize: 11, color: "#9fb3d1", borderBottom: "1px solid #22385f", whiteSpace: "nowrap" };
  const firstCol = { position: "sticky", left: 0, background: "#0d1b33", zIndex: 1, padding: "6px 10px", whiteSpace: "nowrap", borderRight: "1px solid #22385f", color: "#e6f6ff" };

  return (
    <div className="bg-card rounded p-4">
      <h2 className="text-sky-200 font-semibold mb-1">Doctor × Seguro — participación en red</h2>
      <p className="text-slate-400 text-xs mb-3">
        Estado de cada doctor con cada aseguradora, según tu tracker. Pasa el cursor sobre una celda para ver tipo, vencimiento y notas.
        <br />
        Nota: la participación en redes comerciales no tiene API pública; esta vista refleja lo que registras en Insurances.
      </p>

      {/* Verificación automática oficial (CMS/PECOS) */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <button
          onClick={verifyMedicare}
          disabled={verifying}
          style={{
            background: verifying ? "#334155" : "#0e7490",
            color: "#e0f2fe",
            border: "none",
            borderRadius: 6,
            padding: "7px 12px",
            fontSize: 13,
            fontWeight: 600,
            cursor: verifying ? "default" : "pointer",
          }}
        >
          {verifying ? `Verificando… ${verifiedDone}/${verifiedTotal}` : "⚡ Verificar Medicare (CMS oficial)"}
        </button>
        {hasMed && !verifying && (
          <span style={{ color: "#bbf7d0", fontSize: 13 }}>
            {medEnrolledCount}/{Object.keys(medStatus).length} inscritos en Medicare (PECOS)
          </span>
        )}
        <span style={{ color: "#64748b", fontSize: 11 }}>
          Dato oficial de CMS, en vivo. Los seguros comerciales siguen siendo manuales.
        </span>
      </div>

      {/* Verificar en directorios oficiales (uno por seguro) */}
      <div style={{ marginBottom: 12, padding: "10px 12px", background: "#0b1a33", borderRadius: 8, border: "1px solid #22385f" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ color: "#e6f6ff", fontWeight: 600, fontSize: 13 }}>🔗 Verificar en directorios oficiales</span>
          <select
            value={selDoc}
            onChange={(e) => setSelDoc(e.target.value)}
            style={{ background: "#0d1b33", color: "#e6f6ff", border: "1px solid #22385f", borderRadius: 6, padding: "5px 8px", fontSize: 13 }}
          >
            <option value="">— elige doctor —</option>
            {doctorsWithNpi.map((d) => (
              <option key={String(d.npi)} value={String(d.npi).trim()}>
                {d.name} · NPI {d.npi}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
          {dirButtons.map((b) => (
            <button
              key={b.family}
              onClick={() => openDirectory(b.family, b.url)}
              style={{ background: "#132b4d", color: "#cfe6ff", border: "1px solid #22385f", borderRadius: 6, padding: "5px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              title={`Abrir el directorio oficial de ${b.family} y copiar el NPI`}
            >
              {b.family}
            </button>
          ))}
        </div>
        {copiedMsg && <div style={{ marginTop: 7, color: "#bbf7d0", fontSize: 12 }}>{copiedMsg}</div>}
        <div style={{ marginTop: 4, color: "#64748b", fontSize: 11 }}>
          Abre el directorio oficial del seguro y copia el NPI del doctor. Confirmas en la fuente autoritativa — sin datos inventados.
        </div>
      </div>

      <div className="ins-filters">
        <input
          className="flt-search"
          placeholder="🔎 Filtrar aseguradoras (columnas)…"
          value={payerQ}
          onChange={(e) => setPayerQ(e.target.value)}
        />
        <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#cbd5e1", fontSize: 13 }}>
          <input type="checkbox" checked={onlyGaps} onChange={(e) => setOnlyGaps(e.target.checked)} />
          Solo doctores con Out/Aplicó
        </label>
        {(payerQ || onlyGaps) && (
          <button className="flt-clear" onClick={() => { setPayerQ(""); setOnlyGaps(false); }}>✕ Limpiar</button>
        )}
      </div>

      {/* Leyenda */}
      <div style={{ display: "flex", gap: 12, margin: "6px 0 10px", flexWrap: "wrap", fontSize: 12 }}>
        {["in", "applied", "out"].map((k) => (
          <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#cbd5e1" }}>
            <span style={{ width: 14, height: 14, borderRadius: 3, background: meta[k].bg, display: "inline-block" }} />
            {meta[k].label}
          </span>
        ))}
        <span style={{ color: "#fbbf24" }}>• = por vencer / vencido</span>
      </div>

      <p className="text-slate-400 text-xs mb-2">
        {rowsToShow.length} doctores × {payers.length} aseguradoras
      </p>

      <div className="overflow-auto" style={{ maxHeight: "70vh" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 0, fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ ...thBase, ...firstCol, top: 0, zIndex: 3 }}>Doctor</th>
              <th style={{ ...thBase, textAlign: "center" }}>In</th>
              <th style={{ ...thBase, textAlign: "center" }} title="Inscripción en Medicare según CMS/PECOS (dato oficial en vivo)">Medicare CMS</th>
              {payers.map((p) => (
                <th key={p} style={{ ...thBase, textAlign: "center", maxWidth: 92, overflow: "hidden", textOverflow: "ellipsis" }} title={p}>
                  {p.length > 14 ? p.slice(0, 13) + "…" : p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowsToShow.map((row) => {
              const mc = medCell(row.doc);
              return (
                <tr key={row.doc}>
                  <td style={firstCol}>{row.doc}</td>
                  <td style={{ textAlign: "center", padding: "4px 6px", color: "#93c5fd", fontWeight: 700, borderBottom: "1px solid #16233b" }}>{row.inCount}</td>
                  <td style={{ textAlign: "center", padding: "3px 4px", borderBottom: "1px solid #16233b" }}
                      title={mc.kind === "in" ? ("Inscrito en Medicare · ID " + (mc.eid || "—")) : mc.kind === "review" ? "No aparece en CMS — revisar (puede ser normal según el tipo de proveedor)" : mc.kind === "sin-npi" ? "Sin NPI válido" : ""}>
                    {mc.kind === "in" ? (
                      <span style={{ background: "#14532d", color: "#bbf7d0", borderRadius: 4, padding: "2px 6px", fontSize: 11, fontWeight: 700 }}>✓ Sí</span>
                    ) : mc.kind === "review" ? (
                      <span style={{ background: "#713f12", color: "#fde68a", borderRadius: 4, padding: "2px 6px", fontSize: 11, fontWeight: 700 }}>⚠ Revisar</span>
                    ) : mc.kind === "error" ? (
                      <span style={{ color: "#fca5a5" }}>error</span>
                    ) : mc.kind === "sin-npi" ? (
                      <span style={{ color: "#334155" }}>—</span>
                    ) : (
                      <span style={{ color: "#334155" }}>·</span>
                    )}
                  </td>
                  {row.cells.map((c) => {
                    const m = meta[c.state];
                    return (
                      <td key={c.payer} title={c.tip || ""} style={{ textAlign: "center", padding: "3px 4px", borderBottom: "1px solid #16233b" }}>
                        {c.state === "none" ? (
                          <span style={{ color: "#334155" }}>·</span>
                        ) : (
                          <span style={{ background: m.bg, color: m.fg, borderRadius: 4, padding: "2px 6px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                            {m.label}{c.warn ? " •" : ""}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {rowsToShow.length === 0 && (
              <tr><td style={{ padding: 16, color: "#94a3b8" }}>No hay datos para mostrar.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

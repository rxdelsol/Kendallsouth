import React, { useEffect, useMemo, useState } from "react";
import { daysUntil, statusOf } from "../utils/credStatus";

// Matriz Doctor × Seguro: muestra, para cada doctor y cada aseguradora, si está
// In Network / Out / Aplicó, según los datos del tracker (fuente de verdad para
// las comerciales; no existe API pública de participación de red).
export default function EligibilityCheck() {
  const [insurances, setInsurances] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [payerQ, setPayerQ] = useState("");
  const [onlyGaps, setOnlyGaps] = useState(false);

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
              {payers.map((p) => (
                <th key={p} style={{ ...thBase, textAlign: "center", maxWidth: 92, overflow: "hidden", textOverflow: "ellipsis" }} title={p}>
                  {p.length > 14 ? p.slice(0, 13) + "…" : p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowsToShow.map((row) => (
              <tr key={row.doc}>
                <td style={firstCol}>{row.doc}</td>
                <td style={{ textAlign: "center", padding: "4px 6px", color: "#93c5fd", fontWeight: 700, borderBottom: "1px solid #16233b" }}>{row.inCount}</td>
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
            ))}
            {rowsToShow.length === 0 && (
              <tr><td style={{ padding: 16, color: "#94a3b8" }}>No hay datos para mostrar.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

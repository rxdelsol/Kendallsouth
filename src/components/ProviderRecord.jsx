import React, { useEffect, useMemo, useState } from "react";
import { daysUntil, doctorCredentials } from "../utils/credStatus";
import { resumenCobertura, LINEAS } from "../utils/coverage";
import { applyLinkFor, PAYER_APPLY } from "../data/payerApply";
import { deaCheck, DEA_STATE_META } from "../utils/dea";
import "./styles/record.css";

// Ficha completa del proveedor: identidad, credenciales con su vigencia,
// seguros aceptados por línea de negocio y dónde solicitar los que faltan.
// Un clic en el doctor y está todo acá, sin ir a tres pantallas.

const tier = (d) => (d === null ? "none" : d <= 180 ? "hot" : d <= 365 ? "mid" : "ok");
const fmt = (iso) =>
  iso ? new Date(String(iso).slice(0, 10) + "T00:00:00").toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : null;

export default function ProviderRecord({ doctor, insurances, onClose, onEdit }) {
  const [rows, setRows] = useState(insurances || null);

  // Si el padre no los pasó, los pedimos: la ficha tiene que servir sola.
  useEffect(() => {
    if (insurances) { setRows(insurances); return; }
    let vivo = true;
    fetch("/api/get-insurances")
      .then((r) => r.json())
      .then((j) => { if (vivo && j?.ok) setRows(j.data || []); })
      .catch(() => { if (vivo) setRows([]); });
    return () => { vivo = false; };
  }, [insurances]);

  const creds = useMemo(
    () => doctorCredentials(doctor).map((c) => ({ ...c, days: daysUntil(c.date) })),
    [doctor]
  );
  const cobertura = useMemo(
    () => resumenCobertura(rows || [], doctor?.name),
    [rows, doctor]
  );

  // Aseguradoras donde NO participa: son las que hay que gestionar. Las que ya
  // tiene contratadas no necesitan un botón de "aplicar".
  const faltantes = useMemo(() => {
    const suyas = new Set(
      (rows || [])
        .filter((i) => String(i.doctorName || "").trim().toLowerCase() === String(doctor?.name || "").trim().toLowerCase())
        .filter((i) => !String(i.network || "").toLowerCase().includes("out"))
        .map((i) => applyLinkFor(i.name)?.label)
        .filter(Boolean)
    );
    return PAYER_APPLY.filter((p) => !suyas.has(p.label));
  }, [rows, doctor]);

  const licDays = doctor?.licenseExp ? daysUntil(doctor.licenseExp) : null;
  const t = tier(licDays);
  const dc = deaCheck(doctor?.dea, doctor?.name);
  const dcMeta = DEA_STATE_META[dc.state];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="rec" onClick={(e) => e.stopPropagation()}>
        <div className="rec-top">
          <div style={{ minWidth: 0 }}>
            <span className="eyebrow">Provider record</span>
            <h2 className="rec-name">{doctor?.name}</h2>
            <p className="rec-role">{doctor?.taxonomy || "No taxonomy on file"}</p>
            <div className="rec-facts">
              <div className="rec-fact"><span className="eyebrow">NPI</span><span className="v">{doctor?.npi || "—"}</span></div>
              <div className="rec-fact"><span className="eyebrow">License</span><span className="v">{doctor?.license || "—"}</span></div>
              <div className="rec-fact"><span className="eyebrow">CAQH</span><span className="v">{doctor?.caqh || "—"}</span></div>
              <div className="rec-fact">
                <span className="eyebrow">DEA</span>
                <span className="v" title={dc.label}>{doctor?.dea || "—"}</span>
                {doctor?.dea ? <span className="rec-via">{dcMeta.icon} {dc.label}</span> : null}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
            <button className="rec-close" onClick={onClose}>Close</button>
            <div className={`rec-stamp s-${t}`}>
              <span className="n">{licDays === null ? "—" : licDays}</span>
              <span className="u">{licDays === null ? "no license on file" : "days of license"}</span>
            </div>
          </div>
        </div>

        <section className="sheet">
          <div className="sechead">
            <span className="eyebrow">Credentials</span>
            <span>Florida license and Medicare revalidation load automatically</span>
          </div>
          <div className="rec-ledger">
            {creds.map((c) => {
              const tt = tier(c.days);
              const pct = c.days === null ? 0 : Math.max(3, Math.min(100, Math.round((c.days / 730) * 100)));
              return (
                <div className="rec-row" key={c.key}>
                  <div className="k">{c.label}<small>{c.action}</small></div>
                  <div className="rec-meter">{c.days === null ? null : <i className={`i-${tt}`} style={{ width: pct + "%" }} />}</div>
                  {c.days === null
                    ? <div className="rec-when none">not on file yet</div>
                    : <div className="rec-when"><b>{fmt(c.date)}</b><small>{c.days} days</small></div>}
                </div>
              );
            })}
          </div>
        </section>

        <section className="sheet">
          <div className="sechead">
            <span className="eyebrow">Accepted insurance</span>
            <span>{rows === null ? "loading…" : `${cobertura.activos} of ${cobertura.total} contracts active`}</span>
          </div>
          {rows === null ? (
            <p className="rec-empty">Loading contracts…</p>
          ) : cobertura.total === 0 ? (
            <p className="rec-empty">No contracts on file for this provider.</p>
          ) : (
            <div className="rec-lineas">
              {LINEAS.map((k) => {
                const g = cobertura.grupos[k];
                if (!g.dentro.length && !g.fuera.length) return null;
                return (
                  <div className="rec-linea" key={k}>
                    <div className="rec-lhead">
                      <span className="eyebrow">{k}</span>
                      <span className={`rec-lcount${g.dentro.length ? "" : " zero"}`}>
                        {g.dentro.length}/{g.dentro.length + g.fuera.length}
                      </span>
                    </div>
                    {g.dentro.length ? (
                      <div className="rec-chips">
                        {g.dentro.map((x, n) => (
                          <span className="rec-chip yes" key={n}>{x.etiqueta}{x.expiration ? <small>{fmt(x.expiration)}</small> : null}</span>
                        ))}
                      </div>
                    ) : <p className="rec-none">None active in this line.</p>}
                    {g.fuera.length ? (
                      <div className="rec-chips">
                        {g.fuera.map((x, n) => <span className="rec-chip no" key={n}>{x.etiqueta}</span>)}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {faltantes.length ? (
          <section className="sheet">
            <div className="sechead">
              <span className="eyebrow">Where to apply</span>
              <span>verified enrollment links</span>
            </div>
            <table className="rec-apply">
              <thead><tr><th>Payer</th><th>How to apply</th><th></th></tr></thead>
              <tbody>
                {faltantes.map((p) => (
                  <tr key={p.label}>
                    <td className="rec-pn">{p.label}</td>
                    <td><span className="rec-via" style={{ marginTop: 0 }}>{p.via}</span></td>
                    <td style={{ textAlign: "right" }}>
                      <a className="rec-link" href={p.url} target="_blank" rel="noopener noreferrer">Apply ↗</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        <div className="rec-foot">
          <span>License verified against the Florida MQA registry · contracts from your system</span>
          <button onClick={() => { onClose(); onEdit && onEdit(doctor); }}>Edit dates</button>
        </div>
      </div>
    </div>
  );
}

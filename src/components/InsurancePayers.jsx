import React, { useEffect, useMemo, useState } from "react";
import { agruparPorAseguradora } from "../utils/coverage";
import { applyLinkFor } from "../data/payerApply";
import "./styles/payers.css";

// Pantalla de aseguradoras en maestro-detalle: la lista a la izquierda, el
// detalle de la seleccionada a la derecha. Una tabla plana de 147 contratos
// no deja ver el estado de UNA aseguradora, que es como se trabaja: hoy toca
// Oscar, mañana Aetna.

const dias = (iso) => {
  if (!iso) return null;
  const t = new Date(String(iso).slice(0, 10) + "T00:00:00");
  if (isNaN(t)) return null;
  return Math.floor((t - new Date()) / 86400000);
};
const fmt = (iso) => (iso ? new Date(String(iso).slice(0, 10) + "T00:00:00").toLocaleDateString() : "—");
const esOut = (n) => String(n || "").toLowerCase().includes("out");
const tono = (d) => (d === null ? "" : d < 0 || d <= 60 ? "d-hot" : d <= 90 ? "d-mid" : "d-ok");

// Monograma en lugar del logotipo de cada aseguradora: no reproducimos marcas
// registradas de terceros. Las iniciales identifican igual en una lista.
const inicial = (n) => String(n || "?").replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase() || "?";

export default function InsurancePayers() {
  const [filas, setFilas] = useState(null);
  const [busca, setBusca] = useState("");
  const [sel, setSel] = useState(null);
  const [buscaDoc, setBuscaDoc] = useState("");

  useEffect(() => {
    let vivo = true;
    fetch("/api/get-insurances")
      .then((r) => r.json())
      .then((j) => { if (vivo) setFilas(j?.ok ? (j.data || []) : []); })
      .catch(() => { if (vivo) setFilas([]); });
    return () => { vivo = false; };
  }, []);

  const grupos = useMemo(() => {
    const conDias = (filas || []).map((i) => ({ ...i, _daysLeft: dias(i.expiration) }));
    return agruparPorAseguradora(conDias);
  }, [filas]);

  const visibles = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return q ? grupos.filter((g) => g.nombre.toLowerCase().includes(q)) : grupos;
  }, [grupos, busca]);

  useEffect(() => {
    if (!sel && visibles.length) setSel(visibles[0].nombre);
  }, [visibles, sel]);

  const activo = useMemo(() => grupos.find((g) => g.nombre === sel) || null, [grupos, sel]);

  const detalle = useMemo(() => {
    if (!activo) return null;
    const q = buscaDoc.trim().toLowerCase();
    const filas = q
      ? activo.filas.filter((f) => String(f.doctorName || "").toLowerCase().includes(q))
      : activo.filas;
    const porVencer = activo.filas.filter((f) => f._daysLeft !== null && f._daysLeft >= 0 && f._daysLeft <= 60).length;
    const vencidos = activo.filas.filter((f) => f._daysLeft !== null && f._daysLeft < 0).length;
    const pct = activo.total ? Math.round((activo.dentro / activo.total) * 100) : 0;
    const tipos = [...new Set(activo.filas.map((f) => f.type).filter(Boolean))];
    return { filas, porVencer, vencidos, pct, tipos };
  }, [activo, buscaDoc]);

  if (filas === null) return <div className="ks-card rounded p-4"><p className="py-empty">Loading insurance contracts…</p></div>;

  return (
    <div className="ks-card rounded p-4">
      <div className="py-head">
        <div>
          <h2 className="py-title">Insurances</h2>
          <p className="py-sub">Select a payer to see its contracted providers.</p>
        </div>
        <span className="py-total">{grupos.length} payers · {filas.length} contracts</span>
      </div>

      <div className="py-split">
        <aside className="py-list">
          <input
            className="flt-search py-search"
            placeholder="🔎 Search payer…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          {visibles.map((g) => {
            const pct = g.total ? Math.round((g.dentro / g.total) * 100) : 0;
            return (
              <button
                key={g.nombre}
                type="button"
                className="py-item"
                aria-current={g.nombre === sel}
                onClick={() => { setSel(g.nombre); setBuscaDoc(""); }}
              >
                <span className="py-mono">{inicial(g.nombre)}</span>
                <span className="py-nombre">
                  <b>{g.nombre}</b>
                  <span className="py-bar" aria-hidden="true"><i style={{ width: pct + "%" }} /></span>
                </span>
                <span className={`py-num${g.fuera ? " gap" : ""}`}>{g.total}</span>
              </button>
            );
          })}
          {!visibles.length && <p className="py-empty">No payer matches that search.</p>}
        </aside>

        <section className="py-detail">
          {!activo ? (
            <p className="py-empty">Select a payer.</p>
          ) : (
            <>
              <div className="py-dhead">
                <div className="py-dname">
                  <span className="py-mono big">{inicial(activo.nombre)}</span>
                  <div>
                    <h3>{activo.nombre}</h3>
                    <p>{detalle.tipos.length ? detalle.tipos.join(" · ") : "No plan type recorded"}</p>
                  </div>
                </div>
                {applyLinkFor(activo.nombre) && (
                  <a
                    className="py-apply"
                    href={applyLinkFor(activo.nombre).url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Contracting ↗
                  </a>
                )}
              </div>

              <div className="py-stats">
                <div className="py-stat">
                  <span className="py-k">Contracts</span>
                  <b>{activo.total}</b>
                </div>
                <div className="py-stat">
                  <span className="py-k">In network</span>
                  <b className={activo.fuera ? "" : "ok"}>{detalle.pct}%</b>
                  <small>{activo.dentro} of {activo.total}</small>
                </div>
                <div className="py-stat">
                  <span className="py-k">Out of network</span>
                  <b className={activo.fuera ? "hot" : ""}>{activo.fuera}</b>
                </div>
                <div className="py-stat">
                  <span className="py-k">Expiring ≤ 60 days</span>
                  <b className={detalle.porVencer ? "hot" : ""}>{detalle.porVencer}</b>
                  {detalle.vencidos > 0 && <small className="hot">{detalle.vencidos} expired</small>}
                </div>
              </div>

              <div className="py-tablehead">
                <span className="py-k">Providers ({activo.total})</span>
                <input
                  className="flt-search py-search sm"
                  placeholder="Search provider…"
                  value={buscaDoc}
                  onChange={(e) => setBuscaDoc(e.target.value)}
                />
              </div>

              <div className="overflow-auto">
                <table className="py-table">
                  <thead>
                    <tr>
                      <th>Provider</th><th>Plan</th><th>Type</th><th>Network</th>
                      <th>Expiration</th><th className="num">Days left</th><th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalle.filas.map((f) => (
                      <tr key={f.id}>
                        <td>{f.doctorName || <span className="q">no provider assigned</span>}</td>
                        <td className="q">{f.name}</td>
                        <td className="q">{f.type || "—"}</td>
                        <td>{esOut(f.network) ? <span className="badge-out">Out of Network</span> : <span className="badge-in">In Network</span>}</td>
                        <td className="mono">{fmt(f.expiration)}</td>
                        <td className={`num mono ${tono(f._daysLeft)}`}>{f._daysLeft === null ? "—" : f._daysLeft}</td>
                        <td className="q">{f.notes}</td>
                      </tr>
                    ))}
                    {!detalle.filas.length && (
                      <tr><td colSpan={7} className="py-empty">No provider matches that search.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

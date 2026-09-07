import React, { useEffect, useMemo, useState } from "react";
import { agruparPorAseguradora, familiaDe } from "../utils/coverage";
import { statusOf, daysUntil } from "../utils/credStatus";
import Donut, { CATEGORICA } from "./Donut";
import { PageHead } from "./Shell.jsx";
import "./styles/groups.css";

const saludo = (h) => (h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening");

// Hace cuánto, en palabras. Devuelve null si no hay fecha: prefiero no
// mostrar hora a mostrar una inventada.
function hace(iso) {
  if (!iso) return null;
  const t = new Date(iso);
  if (isNaN(t)) return null;
  const m = Math.floor((Date.now() - t.getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h ago";
  const d = Math.floor(h / 24);
  if (d < 30) return d + "d ago";
  return t.toLocaleDateString();
}

const inicial = (n) =>
  String(n || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export default function Dashboard({ onNav }) {
  const [loading, setLoading] = useState(true);
  const [seguros, setSeguros] = useState([]);
  const [doctores, setDoctores] = useState([]);
  const [filtros, setFiltros] = useState({ search: "", doctor: "all", network: "all", expiration: "all" });

  useEffect(() => {
    Promise.all([
      fetch("/api/get-insurances").then((r) => r.json()).catch(() => ({})),
      fetch("/api/get-doctors").then((r) => r.json()).catch(() => ({})),
    ])
      .then(([s, d]) => {
        setSeguros(s && s.ok ? s.data || [] : []);
        setDoctores(d && d.ok ? d.data || [] : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const hoy = new Date();

  // ---- Filtros sobre los contratos (alimentan las tablas de abajo) ----
  const opcionesDoctor = useMemo(
    () => Array.from(new Set(seguros.map((i) => (i.doctorName || "").trim()).filter(Boolean))).sort(),
    [seguros]
  );

  const filtrados = useMemo(() => {
    let l = seguros.map((i) => ({ ...i, _daysLeft: daysUntil(i.expiration) }));
    const t = filtros.search.trim().toLowerCase();
    if (t) l = l.filter((i) => (i.name || "").toLowerCase().includes(t));
    if (filtros.doctor !== "all") l = l.filter((i) => (i.doctorName || "") === filtros.doctor);
    if (filtros.network !== "all") l = l.filter((i) => i.network === filtros.network);
    if (filtros.expiration !== "all")
      l = l.filter((i) => {
        const d = i._daysLeft;
        if (d === null) return false;
        if (filtros.expiration === "expiring") return d >= 0 && d <= 60;
        if (filtros.expiration === "expired") return d < 0;
        return d > 60;
      });
    return l;
  }, [seguros, filtros]);

  // ---- Métricas a nivel de PROVEEDOR (es lo que cuentan las tarjetas) ----
  // "In network" = el proveedor tiene al menos un contrato dentro de red.
  // El resto no tiene ninguno. Las dos categorías son excluyentes y suman
  // el total, que es lo que hace legible un porcentaje.
  const metricas = useMemo(() => {
    const porDoctor = new Map();
    doctores.forEach((d) => porDoctor.set((d.name || "").trim(), { dentro: false, contratos: 0 }));
    seguros.forEach((s) => {
      const k = (s.doctorName || "").trim();
      if (!k) return;
      if (!porDoctor.has(k)) porDoctor.set(k, { dentro: false, contratos: 0 });
      const e = porDoctor.get(k);
      e.contratos += 1;
      if (!String(s.network || "").toLowerCase().includes("out")) e.dentro = true;
    });
    let dentro = 0;
    porDoctor.forEach((v) => { if (v.dentro) dentro += 1; });
    const total = porDoctor.size;

    // Vencimientos por proveedor: cuenta el peor de sus credenciales y de
    // sus contratos, con los mismos cortes que usa el resto del sistema.
    let d30 = 0, d60 = 0, resto = 0, vencidos = 0;
    porDoctor.forEach((_v, nombre) => {
      const doc = doctores.find((x) => (x.name || "").trim() === nombre) || {};
      const fechas = [doc.licenseExp, doc.deaExp, doc.malpracticeExp, doc.medicareRevalidation]
        .concat(seguros.filter((s) => (s.doctorName || "").trim() === nombre).map((s) => s.expiration))
        .filter(Boolean);
      const dias = fechas.map(daysUntil).filter((n) => n !== null);
      if (!dias.length) { resto += 1; return; }
      const min = Math.min(...dias);
      if (min < 0) vencidos += 1;
      else if (min <= 30) d30 += 1;
      else if (min <= 60) d60 += 1;
      else resto += 1;
    });

    return { total, dentro, fuera: total - dentro, d30, d60, resto, vencidos };
  }, [doctores, seguros]);

  const pct = (n, sobre) => (sobre ? Math.round((n / sobre) * 100) : 0);

  // ---- Dona 1: proveedores por aseguradora ----
  // Cada porción son los proveedores distintos inscritos en esa aseguradora.
  // Un proveedor puede estar en varias, así que el centro cuenta inscripciones
  // (proveedor × aseguradora), no cabezas — el porcentaje es sobre eso.
  const donaSeguros = useMemo(() => {
    const m = new Map();
    seguros.forEach((s) => {
      const f = familiaDe(s.name);
      if (!m.has(f)) m.set(f, new Set());
      if (s.doctorName) m.get(f).add(s.doctorName.trim());
    });
    const lista = [...m.entries()].map(([nombre, set]) => ({ nombre, valor: set.size })).sort((a, b) => b.valor - a.valor);
    const cabeza = lista.slice(0, CATEGORICA.length);
    const cola = lista.slice(CATEGORICA.length).reduce((a, x) => a + x.valor, 0);
    if (cola > 0) cabeza.push({ nombre: "Other", valor: cola, color: "var(--idle)" });
    return cabeza;
  }, [seguros]);

  // ---- Dona 2: estado de red, a nivel de proveedor ----
  // Acá sí van los colores del semáforo: "fuera de red" es un estado, no una
  // categoría cualquiera, y reutilizar el verde/rojo de otra cosa los gastaría.
  const donaRed = useMemo(
    () => [
      { nombre: "In network", valor: metricas.dentro, color: "var(--ok)" },
      { nombre: "Out of network", valor: metricas.fuera, color: "var(--hot)" },
    ].filter((d) => d.valor > 0),
    [metricas]
  );

  // ---- Actividad reciente ----
  // Altas reales de la base, ordenadas por fecha de creación. No hay bitácora
  // de ediciones en el esquema, así que este panel dice exactamente lo que
  // puede saber — "provider added", "contract added" — y nada más.
  const actividad = useMemo(() => {
    const a = [
      ...doctores.map((d) => ({ clave: "d" + d.id, quien: d.name, que: "New provider added", cuando: d.createdAt, ini: inicial(d.name), tono: "acc" })),
      ...seguros.map((s) => ({ clave: "i" + s.id, quien: s.name, que: (s.doctorName ? s.doctorName + " · " : "") + "contract added", cuando: s.createdAt, ini: inicial(s.name), tono: "ok" })),
    ].filter((x) => x.cuando);
    a.sort((x, y) => new Date(y.cuando) - new Date(x.cuando));
    return a.slice(0, 5);
  }, [doctores, seguros]);

  const grupos = useMemo(() => agruparPorAseguradora(filtrados), [filtrados]);
  const [cerrados, setCerrados] = useState({});
  const alternar = (n) => setCerrados((p) => ({ ...p, [n]: !p[n] }));
  const cambiar = (k, v) => setFiltros((p) => ({ ...p, [k]: v }));

  return (
    <div className="dash-page">
      <PageHead icono="dashboard" titulo="Dashboard" sub="Credentialing status across every provider and payer" />

      {/* Fila de contexto: la fecha y el saludo. Es la línea que confirma que
          los números de abajo son de hoy. */}
      <div className="greet">
        <span className="greet-date">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
          {hoy.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
        </span>
        <span className="greet-hi">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          {saludo(hoy.getHours())}, <b>Kendall South</b>
        </span>
      </div>

      {loading ? (
        <p className="ks-muted text-sm">Loading…</p>
      ) : (
        <>
          <div className="kpi-row">
            <div className="kpi">
              <span className="kpi-ic acc"><svg viewBox="0 0 24 24"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9a8 8 0 0 1 16 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg></span>
              <span className="kpi-txt"><small>Total providers</small><b className="acc">{metricas.total}</b></span>
            </div>
            <div className="kpi">
              <span className="kpi-ic ok"><svg viewBox="0 0 24 24"><path d="M4 12.5l5.2 5L20 6.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
              <span className="kpi-txt"><small>In network</small><b className="ok">{metricas.dentro}</b><em className="q">{pct(metricas.dentro, metricas.total)}%</em></span>
            </div>
            <div className="kpi">
              <span className="kpi-ic hot"><svg viewBox="0 0 24 24"><path d="M12 4l9 16H3zM12 10v4M12 17h.01" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
              <span className="kpi-txt"><small>Out of network</small><b className="hot">{metricas.fuera}</b><em className="q">{pct(metricas.fuera, metricas.total)}%</em></span>
            </div>
            <div className="kpi">
              <span className="kpi-ic mid"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg></span>
              <span className="kpi-txt">
                <small>Expiring &le; 60 days</small>
                <b className={metricas.d30 + metricas.d60 ? "mid" : ""}>{metricas.d30 + metricas.d60}</b>
                <em className={metricas.vencidos ? "" : "q"}>Expired {metricas.vencidos}</em>
              </span>
            </div>
          </div>

          <div className="dash-grid">
            <section className="panel">
              <h3>Providers by insurance</h3>
              <div className="panel-body">
                {donaSeguros.length ? (
                  <Donut datos={donaSeguros} etiquetaCentro="enrollments" />
                ) : (
                  <p className="pg-empty">No contracts on file yet.</p>
                )}
              </div>
            </section>

            <section className="panel">
              <h3>Network status</h3>
              <div className="panel-body">
                {donaRed.length ? (
                  <Donut datos={donaRed} etiquetaCentro="providers" />
                ) : (
                  <p className="pg-empty">No providers on file yet.</p>
                )}
              </div>
            </section>
          </div>

          <div className="dash-grid">
            <section className="panel">
              <h3>
                Upcoming expirations
                {onNav && (
                  <button type="button" className="panel-link" onClick={() => onNav("doctors")}>View all</button>
                )}
              </h3>
              <table className="buckets">
                <thead>
                  <tr><th>Days left</th><th className="num">Providers</th><th className="num">% of total</th></tr>
                </thead>
                <tbody>
                  {[
                    ["≤ 30 days", metricas.d30, "b-hot"],
                    ["31 – 60 days", metricas.d60, "b-mid"],
                    ["> 60 days", metricas.resto, "b-ok"],
                  ].map(([etq, n, cls]) => (
                    <tr key={etq}>
                      <td><span className={`dot ${cls}`} />{etq}</td>
                      <td className="num">{n}</td>
                      <td className="num">{pct(n, metricas.total)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="panel">
              <h3>Recent activity</h3>
              {actividad.length === 0 ? (
                <p className="pg-empty">
                  No dated records yet. Activity appears here as providers and contracts are added.
                </p>
              ) : (
                <ul className="feed">
                  {actividad.map((a) => (
                    <li key={a.clave}>
                      <span className={"feed-av " + a.tono}>{a.ini}</span>
                      <span className="feed-tx"><b>{a.quien}</b><small>{a.que}</small></span>
                      <span className="feed-when">{hace(a.cuando)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Detalle: los contratos agrupados por aseguradora. Aetna, Aetna
              Medicare y Aetna Medicaid son la misma aseguradora; verlos
              sueltos esconde qué líneas faltan. Los grupos se ordenan por
              riesgo — primero los que tienen contratos fuera de red. */}
          <div className="filterbar">
            <div className="flex flex-col gap-1">
              <label>Insurance</label>
              <input className="p-2 rounded ks-field text-sm" placeholder="Search by name…" value={filtros.search} onChange={(e) => cambiar("search", e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label>Provider</label>
              <select className="p-2 rounded ks-field text-sm" value={filtros.doctor} onChange={(e) => cambiar("doctor", e.target.value)}>
                <option value="all">All</option>
                {opcionesDoctor.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label>Network</label>
              <select className="p-2 rounded ks-field text-sm" value={filtros.network} onChange={(e) => cambiar("network", e.target.value)}>
                <option value="all">All</option>
                <option value="In Network">In Network</option>
                <option value="Out of Network">Out of Network</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label>Expiration</label>
              <select className="p-2 rounded ks-field text-sm" value={filtros.expiration} onChange={(e) => cambiar("expiration", e.target.value)}>
                <option value="all">All</option>
                <option value="expiring">Expiring &le; 60 days</option>
                <option value="expired">Expired</option>
                <option value="active">Active &gt; 60 days</option>
              </select>
            </div>
          </div>

          {grupos.map((g) => {
            const abierto = !cerrados[g.nombre];
            const pctDentro = g.total ? Math.round((g.dentro / g.total) * 100) : 0;
            return (
              <section className="pg" key={g.nombre}>
                <button type="button" className="pg-head" aria-expanded={abierto} onClick={() => alternar(g.nombre)}>
                  <span className="pg-name">{g.nombre}</span>
                  <span className="pg-count">{g.total} contract{g.total === 1 ? "" : "s"}</span>
                  <span className="pg-bar" title={`${g.dentro} in network · ${g.fuera} out`}><i style={{ width: pctDentro + "%" }} /></span>
                  <span className={`pg-state ${g.fuera ? "gap" : "full"}`}>{g.fuera ? `${g.fuera} out of network` : "All in network"}</span>
                  <span className="pg-chev">{abierto ? "−" : "+"}</span>
                </button>

                {abierto && (
                  <div className="overflow-auto">
                    <table className="pg-table">
                      <thead>
                        <tr><th>Plan</th><th>Type</th><th>Provider</th><th>Network</th><th>Expiration</th><th className="num">Days left</th><th>Notes</th></tr>
                      </thead>
                      <tbody>
                        {g.filas.map((ins) => {
                          const st = statusOf(ins.expiration);
                          const cls = st === "expired" || st === "d30" ? "d-hot" : st === "d60" || st === "d90" ? "d-mid" : st === "ok" ? "d-ok" : "";
                          return (
                            <tr key={ins.id}>
                              <td>{ins.name}</td>
                              <td className="q">{ins.type}</td>
                              <td>{ins.doctorName || <span className="q">no provider</span>}</td>
                              <td>{String(ins.network || "").toLowerCase().includes("out") ? <span className="badge-out">Out of Network</span> : <span className="badge-in">In Network</span>}</td>
                              <td className="mono">{ins.expiration ? new Date(String(ins.expiration).slice(0, 10) + "T00:00:00").toLocaleDateString() : "—"}</td>
                              <td className={`num mono ${cls}`}>{ins._daysLeft === null ? "—" : ins._daysLeft}</td>
                              <td className="q">{ins.notes}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            );
          })}
          {grupos.length === 0 && <p className="pg-empty">No results for current filters</p>}
        </>
      )}
    </div>
  );
}

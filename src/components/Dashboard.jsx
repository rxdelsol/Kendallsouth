import React, { useEffect, useMemo, useState } from "react";
import { agruparPorAseguradora } from "../utils/coverage";
import Donut, { CATEGORICA } from "./Donut";
import "./styles/groups.css";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [allInsurances, setAllInsurances] = useState([]);

  const [filters, setFilters] = useState({
    search: "",
    doctor: "all",
    network: "all",
    expiration: "all", // all | expiring | expired | active
  });

  // Cargar insurances desde la API
  async function loadData() {
    try {
      const res = await fetch("/api/get-insurances");
      const data = await res.json();

      if (!data.ok) {
        console.error(data.error);
        setLoading(false);
        return;
      }

      setAllInsurances(data.data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const daysLeft = (expiration) => {
    if (!expiration) return null;
    const expDate = new Date(expiration);
    const today = new Date();
    const diffMs = expDate.getTime() - today.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  };

  // Opciones de doctores para el filtro
  const doctorOptions = useMemo(() => {
    const set = new Set();
    allInsurances.forEach((ins) => {
      if (ins.doctorName && ins.doctorName.trim() !== "") {
        set.add(ins.doctorName.trim());
      }
    });
    return Array.from(set).sort();
  }, [allInsurances]);

  // Aplicar filtros + calcular stats
  const { filtered, stats } = useMemo(() => {
    const today = new Date();

    let filteredList = allInsurances.map((i) => ({
      ...i,
      _daysLeft: daysLeft(i.expiration),
    }));

    // Filtro por texto (insurance name)
    if (filters.search.trim() !== "") {
      const term = filters.search.toLowerCase();
      filteredList = filteredList.filter((i) =>
        (i.name || "").toLowerCase().includes(term)
      );
    }

    // Filtro por doctor
    if (filters.doctor !== "all") {
      filteredList = filteredList.filter(
        (i) => (i.doctorName || "") === filters.doctor
      );
    }

    // Filtro por network
    if (filters.network !== "all") {
      filteredList = filteredList.filter(
        (i) => i.network === filters.network
      );
    }

    // Filtro por estado de expiración
    filteredList = filteredList.filter((i) => {
      const d = i._daysLeft;
      if (d === null || isNaN(d)) {
        // si no tiene fecha, solo mostrar si no se está filtrando por estado
        return filters.expiration === "all";
      }
      if (filters.expiration === "expiring") {
        return d >= 0 && d <= 60;
      }
      if (filters.expiration === "expired") {
        return d < 0;
      }
      if (filters.expiration === "active") {
        return d > 60;
      }
      return true; // all
    });

    // Stats basados en la lista FILTRADA
    let inNetwork = 0;
    let outNetwork = 0;
    let expiringSoon = 0;
    let expired = 0;

    filteredList.forEach((i) => {
      if (i.network === "In Network") inNetwork++;
      if (i.network === "Out of Network") outNetwork++;
      if (typeof i._daysLeft === "number") {
        if (i._daysLeft < 0) expired++;
        else if (i._daysLeft <= 60) expiringSoon++;
      }
    });

    return {
      filtered: filteredList,
      stats: {
        total: filteredList.length,
        inNetwork,
        outNetwork,
        expiringSoon,
        expired,
      },
    };
  }, [allInsurances, filters]);

  const grupos = useMemo(() => agruparPorAseguradora(filtered), [filtered]);
  const [cerrados, setCerrados] = useState({});
  const alternar = (n) => setCerrados((p) => ({ ...p, [n]: !p[n] }));

  // Dona 1: contratos por aseguradora. Solo las cuatro primeras familias
  // reciben color propio; el resto se pliega en "Other". No se generan
  // colores nuevos para una quinta o sexta aseguradora — una paleta
  // categórica sirve para identificar, y a partir de cinco hues nadie
  // distingue cuál es cuál.
  const donaAseguradoras = useMemo(() => {
    const top = grupos.slice().sort((a, b) => b.total - a.total);
    const cabeza = top.slice(0, CATEGORICA.length).map((g) => ({ nombre: g.nombre, valor: g.total }));
    const resto = top.slice(CATEGORICA.length).reduce((a, g) => a + g.total, 0);
    if (resto > 0) cabeza.push({ nombre: "Other", valor: resto, color: "var(--idle)" });
    return cabeza;
  }, [grupos]);

  // Dona 2: estado de red. Acá sí van los colores del semáforo, porque
  // "fuera de red" es un estado, no una categoría cualquiera.
  const donaRed = useMemo(() => {
    const sin = stats.total - stats.inNetwork - stats.outNetwork;
    const d = [
      { nombre: "In network", valor: stats.inNetwork, color: "var(--ok)" },
      { nombre: "Out of network", valor: stats.outNetwork, color: "var(--hot)" },
    ];
    if (sin > 0) d.push({ nombre: "Not set", valor: sin, color: "var(--idle)" });
    return d.filter((x) => x.valor > 0);
  }, [stats]);

  // Vencimientos por tramo, con los mismos cortes que usa el resto del
  // sistema (30 / 60 / 90) para que una fecha no salga roja en un lado y
  // verde en el otro.
  const tramos = useMemo(() => {
    const t = { venc: 0, d30: 0, d60: 0, d90: 0, ok: 0, sin: 0 };
    filtered.forEach((i) => {
      const d = i._daysLeft;
      if (typeof d !== "number" || isNaN(d)) t.sin++;
      else if (d < 0) t.venc++;
      else if (d <= 30) t.d30++;
      else if (d <= 60) t.d60++;
      else if (d <= 90) t.d90++;
      else t.ok++;
    });
    return t;
  }, [filtered]);

  // En lugar de un registro de actividad —que no existe en los datos y no
  // voy a inventar— este panel muestra dónde están los huecos reales:
  // aseguradoras con contratos fuera de red.
  const huecos = useMemo(
    () => grupos.filter((g) => g.fuera > 0).slice(0, 6),
    [grupos]
  );

  const pct = (n) => (stats.total ? Math.round((n / stats.total) * 100) : 0);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="dash-page">
      {/* Los filtros van en su propia barra, arriba de todo: filtran el
          tablero entero —tarjetas, donas y tabla— así que no pertenecen
          dentro de ninguno de los paneles. */}
      <div className="filterbar">
        {/* Filtro por texto (insurance) */}
        <div className="flex flex-col gap-1">
          <label className="text-xs ks-muted">Insurance</label>
          <input
            className="p-2 rounded ks-field text-sm"
            placeholder="Search by name…"
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
          />
        </div>

        {/* Filtro por doctor */}
        <div className="flex flex-col gap-1">
          <label className="text-xs ks-muted">Doctor</label>
          <select
            className="p-2 rounded ks-field text-sm"
            value={filters.doctor}
            onChange={(e) => handleFilterChange("doctor", e.target.value)}
          >
            <option value="all">All</option>
            {doctorOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por network */}
        <div className="flex flex-col gap-1">
          <label className="text-xs ks-muted">Network</label>
          <select
            className="p-2 rounded ks-field text-sm"
            value={filters.network}
            onChange={(e) => handleFilterChange("network", e.target.value)}
          >
            <option value="all">All</option>
            <option value="In Network">In Network</option>
            <option value="Out of Network">Out of Network</option>
          </select>
        </div>

        {/* Filtro por estado de expiración */}
        <div className="flex flex-col gap-1">
          <label className="text-xs ks-muted">Expiration</label>
          <select
            className="p-2 rounded ks-field text-sm"
            value={filters.expiration}
            onChange={(e) => handleFilterChange("expiration", e.target.value)}
          >
            <option value="all">All</option>
            <option value="expiring">Expiring ≤ 60 days</option>
            <option value="expired">Expired</option>
            <option value="active">Active &gt; 60 days</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="ks-muted text-sm">Loading...</p>
      ) : (
        <>
          {/* Tarjetas de resumen. El círculo con ícono da un ancla visual
              para leer las cuatro de un vistazo; el color es el mismo del
              semáforo, no uno decorativo. */}
          <div className="kpi-row">
            <div className="kpi">
              <span className="kpi-ic acc">
                <svg viewBox="0 0 24 24"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9a8 8 0 0 1 16 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              </span>
              <span className="kpi-txt"><small>Total</small><b className="acc">{stats.total}</b></span>
            </div>
            <div className="kpi">
              <span className="kpi-ic ok">
                <svg viewBox="0 0 24 24"><path d="M4 12.5l5.2 5L20 6.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
              <span className="kpi-txt"><small>In network</small><b className="ok">{stats.inNetwork}</b><em className="q">{pct(stats.inNetwork)}% of contracts</em></span>
            </div>
            <div className="kpi">
              <span className="kpi-ic hot">
                <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
              </span>
              <span className="kpi-txt"><small>Out of network</small><b className="hot">{stats.outNetwork}</b><em>{pct(stats.outNetwork)}% of contracts</em></span>
            </div>
            <div className="kpi">
              <span className="kpi-ic mid">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.8"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              </span>
              <span className="kpi-txt">
                <small>Expiring ≤ 60 days</small>
                <b className={stats.expiringSoon ? "mid" : ""}>{stats.expiringSoon}</b>
                {stats.expired > 0 && <em>{stats.expired} expired</em>}
              </span>
            </div>
          </div>

          <div className="dash-grid">
            <section className="panel">
              <h3>Contracts by insurer</h3>
              <div className="panel-body">
                <Donut datos={donaAseguradoras} etiquetaCentro="contracts" />
              </div>
            </section>

            <section className="panel">
              <h3>Network status</h3>
              <div className="panel-body">
                <Donut datos={donaRed} etiquetaCentro="contracts" />
              </div>
            </section>
          </div>

          <div className="dash-grid">
            <section className="panel">
              <h3>Upcoming expirations</h3>
              <table className="buckets">
                <thead>
                  <tr><th>Window</th><th className="num">Contracts</th><th className="num">Share</th></tr>
                </thead>
                <tbody>
                  {[
                    ["Already expired", tramos.venc, "b-hot"],
                    ["Within 30 days", tramos.d30, "b-hot"],
                    ["31 – 60 days", tramos.d60, "b-mid"],
                    ["61 – 90 days", tramos.d90, "b-mid"],
                    ["More than 90 days", tramos.ok, "b-ok"],
                    ["No date on file", tramos.sin, "b-idle"],
                  ].map(([etq, n, cls]) => (
                    <tr key={etq}>
                      <td><span className={`dot ${cls}`} />{etq}</td>
                      <td className="num">{n}</td>
                      <td className="num">{pct(n)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="panel">
              <h3>Where the gaps are</h3>
              {huecos.length === 0 ? (
                <p className="pg-empty">Every contract on file is in network.</p>
              ) : (
                huecos.map((g) => (
                  <div className="gapline" key={g.nombre}>
                    <span>{g.nombre}</span>
                    <span className="bar" title={`${g.fuera} of ${g.total} out of network`}>
                      <i style={{ width: Math.round((g.fuera / g.total) * 100) + "%" }} />
                    </span>
                    <b>{g.fuera}/{g.total} out</b>
                  </div>
                ))
              )}
            </section>
          </div>

          {/* Contratos agrupados por aseguradora, no una lista plana:
              Aetna, Aetna Medicare y Aetna Medicaid son la misma aseguradora,
              y verlos sueltos esconde qué líneas faltan. Los grupos se ordenan
              por riesgo — primero los que tienen contratos fuera de red. */}
          {grupos.map((g) => {
            const abierto = !cerrados[g.nombre];
            const pctDentro = g.total ? Math.round((g.dentro / g.total) * 100) : 0;
            return (
              <section className="pg" key={g.nombre}>
                <button
                  type="button"
                  className="pg-head"
                  aria-expanded={abierto}
                  onClick={() => alternar(g.nombre)}
                >
                  <span className="pg-name">{g.nombre}</span>
                  <span className="pg-count">{g.total} contract{g.total === 1 ? "" : "s"}</span>
                  <span className="pg-bar" title={`${g.dentro} in network · ${g.fuera} out`}>
                    <i style={{ width: pctDentro + "%" }} />
                  </span>
                  <span className={`pg-state ${g.fuera ? "gap" : "full"}`}>
                    {g.fuera ? `${g.fuera} out of network` : "All in network"}
                  </span>
                  <span className="pg-chev">{abierto ? "\u2212" : "+"}</span>
                </button>

                {abierto && (
                  <div className="overflow-auto">
                    <table className="pg-table">
                      <thead>
                        <tr>
                          <th>Plan</th><th>Type</th><th>Provider</th><th>Network</th>
                          <th>Expiration</th><th className="num">Days left</th><th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.filas.map((ins) => {
                          const d = ins._daysLeft;
                          const cls = typeof d !== "number" || isNaN(d) ? "" : d < 0 ? "d-hot" : d <= 60 ? "d-hot" : d <= 90 ? "d-mid" : "d-ok";
                          return (
                            <tr key={ins.id}>
                              <td>{ins.name}</td>
                              <td className="q">{ins.type}</td>
                              <td>{ins.doctorName || <span className="q">no provider</span>}</td>
                              <td>
                                {String(ins.network || "").toLowerCase().includes("out")
                                  ? <span className="badge-out">Out of Network</span>
                                  : <span className="badge-in">In Network</span>}
                              </td>
                              <td className="mono">{ins.expiration ? new Date(ins.expiration).toLocaleDateString() : "\u2014"}</td>
                              <td className={`num mono ${cls}`}>{typeof d === "number" && !isNaN(d) ? d : "\u2014"}</td>
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
          {grupos.length === 0 && (
            <p className="pg-empty">No results for current filters</p>
          )}

          <p className="ks-muted text-xs mt-3">
            Showing data from Supabase table <code>insurances</code> with
            filters applied.
          </p>
        </>
      )}
    </div>
  );
}

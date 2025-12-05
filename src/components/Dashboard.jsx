import React, { useEffect, useMemo, useState } from "react";

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

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-card rounded p-4">
      <h2 className="text-sky-200 font-semibold mb-4">
        Insurance Expiration Summary
      </h2>

      {/* Filtros */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Filtro por texto (insurance) */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Insurance</label>
          <input
            className="p-2 rounded bg-[#081424] text-sm"
            placeholder="Buscar por nombre..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
          />
        </div>

        {/* Filtro por doctor */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Doctor</label>
          <select
            className="p-2 rounded bg-[#081424] text-sm"
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
          <label className="text-xs text-slate-400">Network</label>
          <select
            className="p-2 rounded bg-[#081424] text-sm"
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
          <label className="text-xs text-slate-400">Expiration</label>
          <select
            className="p-2 rounded bg-[#081424] text-sm"
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
        <p className="text-slate-400 text-sm">Loading...</p>
      ) : (
        <>
          {/* Tarjetas de resumen (sobre lista filtrada) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="rounded-xl bg-[#081424] p-4">
              <p className="text-slate-400 text-xs uppercase">Total</p>
              <p className="text-3xl font-semibold text-sky-200">
                {stats.total}
              </p>
            </div>

            <div className="rounded-xl bg-[#081424] p-4">
              <p className="text-slate-400 text-xs uppercase">In Network</p>
              <p className="text-3xl font-semibold text-emerald-300">
                {stats.inNetwork}
              </p>
            </div>

            <div className="rounded-xl bg-[#081424] p-4">
              <p className="text-slate-400 text-xs uppercase">Out of Network</p>
              <p className="text-3xl font-semibold text-rose-300">
                {stats.outNetwork}
              </p>
            </div>

            <div className="rounded-xl bg-[#081424] p-4">
              <p className="text-slate-400 text-xs uppercase">
                Expiring ≤ 60 days
              </p>
              <p className="text-3xl font-semibold text-amber-300">
                {stats.expiringSoon}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Expired:{" "}
                <span className="text-rose-300 font-semibold">
                  {stats.expired}
                </span>
              </p>
            </div>
          </div>

          {/* Tabla detallada (como antes) */}
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="text-slate-300">
                <tr>
                  <th className="p-2 text-left">Insurance</th>
                  <th className="p-2 text-left">Type</th>
                  <th className="p-2 text-left">Doctor</th>
                  <th className="p-2 text-left">Network</th>
                  <th className="p-2 text-left">Expiration</th>
                  <th className="p-2 text-left">Days Left</th>
                  <th className="p-2 text-left">Notes</th>
                </tr>
              </thead>
              <tbody className="text-slate-200">
                {filtered.map((ins) => {
                  const d = ins._daysLeft;
                  let colorClass = "";
                  if (typeof d === "number") {
                    if (d < 0) colorClass = "text-rose-300";
                    else if (d <= 60) colorClass = "text-amber-300";
                    else colorClass = "text-emerald-300";
                  }

                  return (
                    <tr key={ins.id} className="border-t border-slate-800">
                      <td className="p-2">{ins.name}</td>
                      <td className="p-2">{ins.type}</td>
                      <td className="p-2">{ins.doctorName || ""}</td>
                      <td className="p-2">
                        {ins.network === "In Network" ? (
                          <span className="badge-in">In Network</span>
                        ) : (
                          <span className="badge-out">Out of Network</span>
                        )}
                      </td>
                      <td className="p-2">
                        {ins.expiration
                          ? new Date(ins.expiration).toLocaleDateString()
                          : ""}
                      </td>
                      <td className={`p-2 ${colorClass}`}>
                        {typeof d === "number" ? d : ""}
                      </td>
                      <td className="p-2">{ins.notes}</td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-4 text-slate-400 text-center"
                    >
                      No results for current filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="text-slate-500 text-xs mt-3">
            Showing data from Supabase table <code>insurances</code> with
            filters applied.
          </p>
        </>
      )}
    </div>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import { getRenewalGuide } from "../data/renewalGuides";

export default function InsurancesTable() {
  const empty = () => ({
    id: null,
    name: "",
    type: "HMO",          // valor que se guardará en Supabase
    typeSelect: "HMO",    // valor del <select>
    doctorName: "",
    network: "In Network",
    expiration: "",
    notes: "",
  });

  const [list, setList] = useState([]);
  const [item, setItem] = useState(empty());
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [doctors, setDoctors] = useState([]);

  // ---- Filtros ----
  const [search, setSearch] = useState("");
  const [fName, setFName] = useState("");
  const [fDoctor, setFDoctor] = useState("");
  const [fNetwork, setFNetwork] = useState("");
  const [fType, setFType] = useState("");
  const [fExp, setFExp] = useState(""); // "", expired, d30, d60, d90, nodate

  // ---- Guía de renovación ----
  const [guideFor, setGuideFor] = useState(null); // objeto insurance

  async function loadInsurances() {
    try {
      const res = await fetch("/api/get-insurances");
      const data = await res.json();
      if (data.ok) setList(data.data || []);
      else console.error(data.error);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadDoctors() {
    try {
      const res = await fetch("/api/get-doctors");
      const data = await res.json();
      if (data.ok) setDoctors(data.data || []);
      else console.error(data.error);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    loadInsurances();
    loadDoctors();
  }, []);

  const doctorOptions = useMemo(() => {
    const set = new Set();
    doctors.forEach((d) => {
      if (d.name && d.name.trim() !== "") set.add(d.name.trim());
    });
    return Array.from(set).sort();
  }, [doctors]);

  const daysLeft = (expiration) => {
    if (!expiration) return "";
    const exp = new Date(expiration);
    const today = new Date();
    const diffMs = exp.getTime() - today.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Clasificación de estado por vencimiento (semáforo)
  const expStatus = (expiration) => {
    if (!expiration) return "nodate";
    const d = daysLeft(expiration);
    if (d < 0) return "expired";
    if (d <= 30) return "d30";
    if (d <= 60) return "d60";
    if (d <= 90) return "d90";
    return "ok";
  };

  const statusMeta = {
    expired: { cls: "sem-expired", label: "Vencido" },
    d30: { cls: "sem-30", label: "≤ 30 días" },
    d60: { cls: "sem-60", label: "≤ 60 días" },
    d90: { cls: "sem-90", label: "≤ 90 días" },
    ok: { cls: "sem-ok", label: "Vigente" },
    nodate: { cls: "sem-nodate", label: "Sin fecha" },
  };

  // ---- Opciones únicas para dropdowns ----
  const nameOptions = useMemo(
    () => Array.from(new Set(list.map((i) => i.name).filter(Boolean))).sort(),
    [list]
  );
  const typeOptions = useMemo(
    () => Array.from(new Set(list.map((i) => i.type).filter(Boolean))).sort(),
    [list]
  );
  const doctorFilterOptions = useMemo(
    () => Array.from(new Set(list.map((i) => i.doctorName).filter(Boolean))).sort(),
    [list]
  );

  // ---- Lista filtrada ----
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return list.filter((i) => {
      if (fName && i.name !== fName) return false;
      if (fType && i.type !== fType) return false;
      if (fDoctor && (i.doctorName || "") !== fDoctor) return false;
      if (fNetwork && (i.network || "") !== fNetwork) return false;
      if (fExp && expStatus(i.expiration) !== fExp) return false;
      if (q) {
        const hay = [i.name, i.type, i.doctorName, i.network, i.notes]
          .map((x) => (x || "").toLowerCase())
          .join(" ");
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [list, search, fName, fType, fDoctor, fNetwork, fExp]);

  // ---- Resumen de vencimientos ----
  const summary = useMemo(() => {
    const s = { total: list.length, expired: 0, d30: 0, d60: 0, nodate: 0 };
    list.forEach((i) => {
      const st = expStatus(i.expiration);
      if (st === "expired") s.expired++;
      else if (st === "d30") s.d30++;
      else if (st === "d60") s.d60++;
      else if (st === "nodate") s.nodate++;
    });
    return s;
  }, [list]);

  const anyFilter = search || fName || fDoctor || fNetwork || fType || fExp;
  const clearFilters = () => {
    setSearch(""); setFName(""); setFDoctor(""); setFNetwork(""); setFType(""); setFExp("");
  };

  const saveInsurance = async () => {
    if (!item.name.trim()) return alert("Enter insurance name");

    const finalType =
      item.typeSelect === "Other" && item.otherType?.trim()
        ? item.otherType.trim()
        : item.typeSelect;

    try {
      const bodyToSend = {
        id: item.id,
        name: item.name.trim(),
        type: finalType,
        doctorName: item.doctorName,
        network: item.network,
        expiration: item.expiration || null,
        notes: item.notes,
      };

      const res = await fetch("/api/save-insurance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyToSend),
      });

      const data = await res.json();
      if (data.ok) {
        setShowModal(false);
        setItem(empty());
        setIsEditing(false);
        loadInsurances();
      } else {
        alert("Error saving insurance");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving insurance");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this insurance?")) return;

    try {
      const res = await fetch("/api/delete-insurance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      if (data.ok) {
        loadInsurances();
      } else {
        alert("Error deleting");
      }
    } catch (e) {
      console.error(e);
      alert("Error deleting");
    }
  };

  const openAddModal = () => {
    setItem(empty());
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = (ins) => {
    const standard = ["HMO", "PPO", "Medicare", "Medicaid"];
    const t = ins.type || "HMO";
    const isStandard = standard.includes(t);

    setItem({
      id: ins.id,
      name: ins.name || "",
      typeSelect: isStandard ? t : "Other",
      otherType: isStandard ? "" : t,
      doctorName: ins.doctorName || "",
      network: ins.network || "In Network",
      expiration: ins.expiration ? ins.expiration.slice(0, 10) : "",
      notes: ins.notes || "",
    });

    setIsEditing(true);
    setShowModal(true);
  };

  return (
    <div className="bg-card rounded p-4">
      <h2 className="text-sky-200 font-semibold mb-2">Insurances</h2>

      {/* ---- Tarjetas resumen de vencimientos ---- */}
      <div className="ins-summary">
        <button className={`sum-tile ${fExp === "" ? "active" : ""}`} onClick={() => setFExp("")}>
          <span className="sum-num">{summary.total}</span><span className="sum-lbl">Total</span>
        </button>
        <button className={`sum-tile t-expired ${fExp === "expired" ? "active" : ""}`} onClick={() => setFExp(fExp === "expired" ? "" : "expired")}>
          <span className="sum-num">{summary.expired}</span><span className="sum-lbl">Vencidos</span>
        </button>
        <button className={`sum-tile t-30 ${fExp === "d30" ? "active" : ""}`} onClick={() => setFExp(fExp === "d30" ? "" : "d30")}>
          <span className="sum-num">{summary.d30}</span><span className="sum-lbl">≤ 30 días</span>
        </button>
        <button className={`sum-tile t-60 ${fExp === "d60" ? "active" : ""}`} onClick={() => setFExp(fExp === "d60" ? "" : "d60")}>
          <span className="sum-num">{summary.d60}</span><span className="sum-lbl">31–60 días</span>
        </button>
        <button className={`sum-tile t-nodate ${fExp === "nodate" ? "active" : ""}`} onClick={() => setFExp(fExp === "nodate" ? "" : "nodate")}>
          <span className="sum-num">{summary.nodate}</span><span className="sum-lbl">Sin fecha</span>
        </button>
      </div>

      {/* ---- Barra de filtros ---- */}
      <div className="ins-filters">
        <input
          className="flt-search"
          placeholder="🔎 Buscar (aseguradora, doctor, notas…)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={fName} onChange={(e) => setFName(e.target.value)}>
          <option value="">Aseguradora: todas</option>
          {nameOptions.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={fDoctor} onChange={(e) => setFDoctor(e.target.value)}>
          <option value="">Doctor: todos</option>
          {doctorFilterOptions.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={fType} onChange={(e) => setFType(e.target.value)}>
          <option value="">Tipo: todos</option>
          {typeOptions.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={fNetwork} onChange={(e) => setFNetwork(e.target.value)}>
          <option value="">Network: todos</option>
          <option value="In Network">In Network</option>
          <option value="Out of Network">Out of Network</option>
        </select>
        {anyFilter && (
          <button className="flt-clear" onClick={clearFilters}>✕ Limpiar</button>
        )}
      </div>

      <p className="text-slate-400 text-xs mb-2">
        Mostrando {filtered.length} de {list.length} seguros
      </p>

      <div className="overflow-auto mb-4">
        <table className="min-w-full text-sm">
          <thead className="text-slate-300">
            <tr>
              <th className="p-2">Insurance Name</th>
              <th className="p-2">Type</th>
              <th className="p-2">Doctor</th>
              <th className="p-2">Network</th>
              <th className="p-2">Expiration</th>
              <th className="p-2">Days Left</th>
              <th className="p-2">Notes</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody className="text-slate-200">
            {filtered.map((ins) => {
              const st = expStatus(ins.expiration);
              const meta = statusMeta[st];
              const dl = daysLeft(ins.expiration);
              return (
                <tr key={ins.id} className="border-t border-slate-800">
                  <td className="p-2">{ins.name}</td>
                  <td className="p-2">{ins.type}</td>
                  <td className="p-2">{ins.doctorName || ""}</td>
                  <td className="p-2">
                    {ins.network === "Out of Network" ? (
                      <span className="badge-out">Out of Network</span>
                    ) : (
                      <span className="badge-in">In Network</span>
                    )}
                  </td>
                  <td className="p-2">
                    {ins.expiration
                      ? new Date(ins.expiration).toLocaleDateString()
                      : ""}
                  </td>
                  <td className="p-2">
                    <span className={`sem-pill ${meta.cls}`} title={meta.label}>
                      {ins.expiration ? `${dl}d` : "—"}
                    </span>
                  </td>
                  <td className="p-2">{ins.notes}</td>
                  <td className="p-2 space-x-3 whitespace-nowrap">
                    <button
                      className="text-emerald-300 hover:underline"
                      onClick={() => setGuideFor(ins)}
                      title="Cómo renovar o aplicar"
                    >
                      Guía
                    </button>
                    <button
                      className="text-sky-300 hover:underline"
                      onClick={() => openEditModal(ins)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-500 hover:underline"
                      onClick={() => remove(ins.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="p-4 text-slate-400">
                  {list.length === 0 ? "No insurances yet" : "Ningún seguro coincide con el filtro"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-2 text-left">
        <button
          onClick={openAddModal}
          className="text-sky-300 hover:underline text-sm"
        >
          + Add Insurance
        </button>
      </div>

      {/* ---- Modal Guía de renovación ---- */}
      {guideFor && (() => {
        const g = getRenewalGuide(guideFor.name);
        const st = expStatus(guideFor.expiration);
        const isNew = (guideFor.network || "").toLowerCase().includes("out") ||
          !!(guideFor.notes || "").toLowerCase().match(/appl|pending|submitted/);
        return (
          <div className="modal-backdrop" onClick={() => setGuideFor(null)}>
            <div className="modal guide-modal" onClick={(e) => e.stopPropagation()}>
              <div className="guide-head">
                <div>
                  <h3 style={{ margin: 0 }}>{guideFor.name}</h3>
                  <div className="guide-sub">
                    {guideFor.doctorName || "Sin doctor asignado"} · {guideFor.type} ·{" "}
                    <span className={`sem-pill ${statusMeta[st].cls}`}>{statusMeta[st].label}</span>
                  </div>
                </div>
                <button className="btn-cancel" onClick={() => setGuideFor(null)}>Cerrar</button>
              </div>

              <div className="guide-portal">
                <strong>Portal:</strong> {g.portal}
              </div>

              <div className="guide-cols">
                <div>
                  <h4 className={isNew ? "hl" : ""}>
                    {isNew ? "▶ Aplicar (nuevo / pendiente)" : "Aplicar (nuevo)"}
                  </h4>
                  <ol>{g.apply.map((s, i) => <li key={i}>{s}</li>)}</ol>
                </div>
                <div>
                  <h4 className={!isNew ? "hl" : ""}>
                    {!isNew ? "▶ Renovar / mantener" : "Renovar / mantener"}
                  </h4>
                  <ol>{g.renew.map((s, i) => <li key={i}>{s}</li>)}</ol>
                </div>
              </div>

              <div className="guide-docs">
                <strong>Documentos:</strong> {g.docs.join(" · ")}
              </div>
              <div className="guide-deadline">⏰ {g.deadline}</div>
              <p className="guide-note">
                Portales y plazos pueden cambiar; verifica la fecha efectiva y los deadlines en el portal del pagador.
              </p>
            </div>
          </div>
        );
      })()}

      {/* ---- Modal Add/Edit ---- */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>{isEditing ? "Edit Insurance" : "Add Insurance"}</h3>
            <div className="grid grid-cols-1 gap-2 mt-2">
              {/* Insurance Name */}
              <input
                placeholder="Insurance Name"
                value={item.name}
                onChange={(e) =>
                  setItem({ ...item, name: e.target.value })
                }
                className="p-2 rounded bg-[#081424]"
              />

              {/* TYPE SELECT */}
              <select
                value={item.typeSelect}
                onChange={(e) =>
                  setItem({ ...item, typeSelect: e.target.value })
                }
                className="p-2 rounded bg-[#081424]"
              >
                <option value="HMO">HMO</option>
                <option value="PPO">PPO</option>
                <option value="Medicare">Medicare</option>
                <option value="Medicaid">Medicaid</option>
                <option value="Other">Other</option>
              </select>

              {/* INPUT PARA OTHER */}
              {item.typeSelect === "Other" && (
                <input
                  placeholder="Write custom insurance type"
                  value={item.otherType || ""}
                  onChange={(e) =>
                    setItem({ ...item, otherType: e.target.value })
                  }
                  className="p-2 rounded bg-[#081424]"
                />
              )}

              {/* Doctor Name (dropdown) */}
              <select
                value={item.doctorName}
                onChange={(e) =>
                  setItem({ ...item, doctorName: e.target.value })
                }
                className="p-2 rounded bg-[#081424]"
              >
                <option value="">Unassigned</option>
                {doctorOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>

              {/* Network */}
              <select
                value={item.network}
                onChange={(e) =>
                  setItem({ ...item, network: e.target.value })
                }
                className="p-2 rounded bg-[#081424]"
              >
                <option>In Network</option>
                <option>Out of Network</option>
              </select>

              {/* Expiration */}
              <input
                type="date"
                value={item.expiration || ""}
                onChange={(e) =>
                  setItem({ ...item, expiration: e.target.value })
                }
                className="p-2 rounded bg-[#081424]"
              />

              {/* Notes */}
              <textarea
                placeholder="Notes"
                value={item.notes}
                onChange={(e) =>
                  setItem({ ...item, notes: e.target.value })
                }
                className="p-2 rounded bg-[#081424]"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowModal(false);
                  setIsEditing(false);
                  setItem(empty());
                }}
              >
                Cancel
              </button>
              <button className="btn-red" onClick={saveInsurance}>
                {isEditing ? "Save Changes" : "Save Insurance"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

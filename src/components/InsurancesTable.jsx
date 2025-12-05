import React, { useEffect, useMemo, useState } from "react";

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

  const saveInsurance = async () => {
    if (!item.name.trim()) return alert("Enter insurance name");

    // si seleccionó Other, usamos lo que escribió en otherType
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

      <p className="text-slate-400 text-xs mb-2">
        (Debug) Insurances cargados: {list.length}
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
            {list.map((ins) => (
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
                <td className="p-2">{daysLeft(ins.expiration)}</td>
                <td className="p-2">{ins.notes}</td>
                <td className="p-2 space-x-3">
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
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={8} className="p-4 text-slate-400">
                  No insurances yet
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

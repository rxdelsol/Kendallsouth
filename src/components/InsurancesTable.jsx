import React, { useEffect, useState } from "react";

export default function InsurancesTable() {
  const empty = () => ({
    id: null,
    name: "",
    type: "HMO",
    doctorName: "",
    network: "In Network",
    expiration: "",
    notes: "",
  });

  const [list, setList] = useState([]);
  const [item, setItem] = useState(empty());
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  async function loadInsurances() {
    try {
      const res = await fetch("/api/get-insurances");
      const data = await res.json();
      console.log("API /api/get-insurances →", data);
      if (data.ok) setList(data.data || []);
      else console.error(data.error);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    loadInsurances();
  }, []);

  const saveInsurance = async () => {
    if (!item.name.trim()) return alert("Enter insurance name");

    try {
      const res = await fetch("/api/save-insurance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
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
    setItem({
      id: ins.id,
      name: ins.name,
      type: ins.type,
      doctorName: ins.doctorName || "",
      network: ins.network,
      expiration: ins.expiration ? ins.expiration.slice(0, 10) : "",
      notes: ins.notes || "",
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const daysLeft = (expiration) => {
    if (!expiration) return "";
    const exp = new Date(expiration);
    const today = new Date();
    const diffMs = exp.getTime() - today.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
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
              <input
                placeholder="Insurance Name"
                value={item.name}
                onChange={(e) =>
                  setItem({ ...item, name: e.target.value })
                }
                className="p-2 rounded bg-[#081424]"
              />

              <select
                value={item.type}
                onChange={(e) =>
                  setItem({ ...item, type: e.target.value })
                }
                className="p-2 rounded bg-[#081424]"
              >

::contentReference[oaicite:0]{index=0}

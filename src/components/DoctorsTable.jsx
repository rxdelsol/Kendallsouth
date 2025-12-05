import React, { useEffect, useState } from "react";

export default function DoctorsTable() {
  const empty = () => ({
    id: null,
    name: "",
    npi: "",
    license: "",
    caqh: "",
    medicaid: "",
    medicare: "",
    dob: "",
    taxonomy: "",
  });

  const [list, setList] = useState([]);
  const [doctor, setDoctor] = useState(empty());
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  async function loadDoctors() {
    try {
      const res = await fetch("/api/get-doctors");
      const data = await res.json();
      console.log("API /api/get-doctors →", data);
      if (data.ok) setList(data.data);
      else console.error(data.error);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    loadDoctors();
  }, []);

  const saveDoctor = async () => {
    if (!doctor.name.trim()) return alert("Enter doctor name");

    try {
      const res = await fetch("/api/save-doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(doctor),
      });

      const data = await res.json();
      if (data.ok) {
        setShowModal(false);
        setDoctor(empty());
        setIsEditing(false);
        loadDoctors();
      } else {
        alert("Error saving doctor");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving doctor");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this doctor?")) return;

    try {
      const res = await fetch("/api/delete-doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      if (data.ok) {
        loadDoctors();
      } else {
        alert("Error deleting doctor");
      }
    } catch (e) {
      console.error(e);
      alert("Error deleting doctor");
    }
  };

  const openAddModal = () => {
    setDoctor(empty());
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setDoctor({
      id: item.id,
      name: item.name,
      npi: item.npi || "",
      license: item.license || "",
      caqh: item.caqh || "",
      medicaid: item.medicaid || "",
      medicare: item.medicare || "",
      dob: item.dob ? item.dob.slice(0, 10) : "",
      taxonomy: item.taxonomy || "",
    });
    setIsEditing(true);
    setShowModal(true);
  };

  return (
    <div className="bg-card rounded p-4">
      <h2 className="text-sky-200 font-semibold mb-2">Doctors</h2>

      <p className="text-slate-400 text-xs mb-2">
        (Debug) Doctores cargados: {list.length}
      </p>

      <div className="overflow-auto mb-4">
        <table className="min-w-full text-sm">
          <thead className="text-slate-300">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">NPI</th>
              <th className="p-2">License</th>
              <th className="p-2">CAQH</th>
              <th className="p-2">Medicaid</th>
              <th className="p-2">Medicare</th>
              <th className="p-2">DOB</th>
              <th className="p-2">Taxonomy</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody className="text-slate-200">
            {list.map((d) => (
              <tr key={d.id} className="border-t border-slate-800">
                <td className="p-2">{d.name}</td>
                <td className="p-2">{d.npi}</td>
                <td className="p-2">{d.license}</td>
                <td className="p-2">{d.caqh}</td>
                <td className="p-2">{d.medicaid}</td>
                <td className="p-2">{d.medicare}</td>
                <td className="p-2">
                  {d.dob ? new Date(d.dob).toLocaleDateString() : ""}
                </td>
                <td className="p-2">{d.taxonomy}</td>
                <td className="p-2 space-x-3">
                  <button
                    className="text-sky-300 hover:underline"
                    onClick={() => openEditModal(d)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-500 hover:underline"
                    onClick={() => remove(d.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={9} className="p-4 text-slate-400">
                  No doctors added yet
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
          + Add Doctor
        </button>
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>{isEditing ? "Edit Doctor" : "Add Doctor"}</h3>
            <div className="grid grid-cols-1 gap-2 mt-2">
              <input
                placeholder="Name"
                value={doctor.name}
                onChange={(e) =>
                  setDoctor({ ...doctor, name: e.target.value })
                }
                className="p-2 rounded bg-[#081424]"
              />
              <input
                placeholder="NPI"
                value={doctor.npi}
                onChange={(e) =>
                  setDoctor({ ...doctor, npi: e.target.value })
                }
                className="p-2 rounded bg-[#081424]"
              />
              <input
                placeholder="License"
                value={doctor.license}
                onChange={(e) =>
                  setDoctor({ ...doctor, license: e.target.value })
                }
                className="p-2 rounded bg-[#081424]"
              />
              <input
                placeholder="CAQH"
                value={doctor.caqh}
                onChange={(e) =>
                  setDoctor({ ...doctor, caqh: e.target.value })
                }
                className="p-2 rounded bg-[#081424]"
              />
              <input
                placeholder="Medicaid"
                value={doctor.medicaid}
                onChange={(e) =>
                  setDoctor({ ...doctor, medicaid: e.target.value })
                }
                className="p-2 rounded bg-[#081424]"
              />
              <input
                placeholder="Medicare"
                value={doctor.medicare}
                onChange={(e) =>
                  setDoctor({ ...doctor, medicare: e.target.value })
                }
                className="p-2 rounded bg-[#081424]"
              />
              <input
                type="date"
                value={doctor.dob || ""}
                onChange={(e) =>
                  setDoctor({ ...doctor, dob: e.target.value })
                }
                className="p-2 rounded bg-[#081424]"
              />
              <input
                placeholder="Taxonomy"
                value={doctor.taxonomy}
                onChange={(e) =>
                  setDoctor({ ...doctor, taxonomy: e.target.value })
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
                  setDoctor(empty());
                }}
              >
                Cancel
              </button>
              <button className="btn-red" onClick={saveDoctor}>
                {isEditing ? "Save Changes" : "Save Doctor"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import "./modal.css";

export default function InsurancesModal({ open, onClose }) {
  const [insurances, setInsurances] = useState([]);
  const [newInsurance, setNewInsurance] = useState({
    insuranceName: "",
    expirationDate: "",
    contactInfo: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem("insurances");
    if (saved) setInsurances(JSON.parse(saved));
  }, []);

  const saveToStorage = (list) => {
    localStorage.setItem("insurances", JSON.stringify(list));
  };

  const handleAdd = () => {
    if (!newInsurance.insuranceName.trim()) return;
    const updated = [...insurances, newInsurance];
    setInsurances(updated);
    saveToStorage(updated);
    setNewInsurance({ insuranceName: "", expirationDate: "", contactInfo: "" });
  };

  const handleDelete = (index) => {
    const updated = insurances.filter((_, i) => i !== index);
    setInsurances(updated);
    saveToStorage(updated);
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Insurance Management</h2>
        <div className="form-section">
          <input
            type="text"
            placeholder="Insurance Name"
            value={newInsurance.insuranceName}
            onChange={(e) =>
              setNewInsurance({ ...newInsurance, insuranceName: e.target.value })
            }
          />
          <input
            type="date"
            value={newInsurance.expirationDate}
            onChange={(e) =>
              setNewInsurance({ ...newInsurance, expirationDate: e.target.value })
            }
          />
          <textarea
            placeholder="Contact info or notes"
            value={newInsurance.contactInfo}
            onChange={(e) =>
              setNewInsurance({ ...newInsurance, contactInfo: e.target.value })
            }
          />
          <button className="btn-add" onClick={handleAdd}>
            Add Insurance
          </button>
          <button className="btn-close" onClick={onClose}>
            Close
          </button>
        </div>

        <table>
          <thead>
            <tr>
              <th>Insurance Name</th>
              <th>Expiration Date</th>
              <th>Contact / Notes</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {insurances.length > 0 ? (
              insurances.map((ins, index) => (
                <tr key={index}>
                  <td>{ins.insuranceName}</td>
                  <td>{ins.expirationDate || "—"}</td>
                  <td>{ins.contactInfo || "—"}</td>
                  <td>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(index)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", opacity: 0.6 }}>
                  No insurances added yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

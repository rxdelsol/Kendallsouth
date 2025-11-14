import React, { useState, useEffect } from "react";
import "./DoctorsByInsurance.css";

const insurances = [
  "Aetna",
  "Florida Blue",
  "Cigna",
  "Ambetter",
  "UnitedHealthcare",
  "Molina Healthcare",
  "AmeriHealth Caritas",
  "Florida Health Care Plan",
  "Oscar",
];

export default function DoctorsByInsurance() {
  const [activeInsurance, setActiveInsurance] = useState(null);
  const [doctors, setDoctors] = useState({});
  const [newDoctor, setNewDoctor] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("doctorsByInsurance");
    if (saved) {
      setDoctors(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("doctorsByInsurance", JSON.stringify(doctors));
  }, [doctors]);

  const toggleInsurance = (insurance) => {
    setActiveInsurance(activeInsurance === insurance ? null : insurance);
  };

  const handleAddDoctor = (insurance) => {
    if (!newDoctor.trim()) return;
    setDoctors((prev) => ({
      ...prev,
      [insurance]: [...(prev[insurance] || []), newDoctor],
    }));
    setNewDoctor("");
  };

  const handleDeleteDoctor = (insurance, index) => {
    const updated = { ...doctors };
    updated[insurance].splice(index, 1);
    setDoctors(updated);
  };

  return (
    <div className="container">
      <h1 className="title">Doctors by Insurance (Miami FL 2026)</h1>
      <div className="accordion">
        {insurances.map((insurance) => (
          <div key={insurance} className="accordion-item">
            <button
              className="accordion-button"
              onClick={() => toggleInsurance(insurance)}
            >
              {insurance}
            </button>

            {activeInsurance === insurance && (
              <div className="accordion-content">
                <ul>
                  {(doctors[insurance] || []).map((doc, index) => (
                    <li key={index} className="doctor-item">
                      <span>{doc}</span>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteDoctor(insurance, index)}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="add-doctor-form">
                  <input
                    type="text"
                    placeholder="Add active doctor..."
                    value={newDoctor}
                    onChange={(e) => setNewDoctor(e.target.value)}
                  />
                  <button onClick={() => handleAddDoctor(insurance)}>
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

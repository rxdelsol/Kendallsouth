import React, { useState } from "react";
import { doctors } from "../data/doctors";
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

  const toggleInsurance = (insurance) => {
    setActiveInsurance(activeInsurance === insurance ? null : insurance);
  };

  return (
    <div className="container">
      <h1 className="title">Doctors by Insurance (Miami FL 2026)</h1>
      <div className="accordion">
        {insurances.map((insurance) => {
          const filtered = doctors.filter(
            (doc) => doc.insurance === insurance
          );

          return (
            <div key={insurance} className="accordion-item">
              <button
                className="accordion-button"
                onClick={() => toggleInsurance(insurance)}
              >
                {insurance}
              </button>

              {activeInsurance === insurance && (
                <div className="accordion-content">
                  {filtered.length > 0 ? (
                    <ul>
                      {filtered.map((doc) => (
                        <li key={doc.id}>{doc.name}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>No doctors listed for this insurance yet.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

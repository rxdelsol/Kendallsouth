
import React, { useState } from "react";
import InsurancesModal from "./components/InsurancesModal";
import DoctorsModal from "./components/DoctorsModal";
import "./index.css";

export default function App() {
  const [showInsurances, setShowInsurances] = useState(false);
  const [showDoctors, setShowDoctors] = useState(false);

  return (
    <div className="app">
      <header className="header">
        <img src="/logo.png" alt="Kendall South Medical Center" className="logo" />
        <h1>Kendall South Medical Center — Provider Credential Tracker</h1>
      </header>
      <div className="actions">
        <button onClick={() => setShowInsurances(true)}>Insurances</button>
        <button onClick={() => setShowDoctors(true)}>Doctors</button>
      </div>
      {showInsurances && <InsurancesModal onClose={() => setShowInsurances(false)} />}
      {showDoctors && <DoctorsModal onClose={() => setShowDoctors(false)} />}
    </div>
  );
}

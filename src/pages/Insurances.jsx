import React from "react";
import DoctorsByInsurance from "../components/DoctorsByInsurance";
import "./Insurances.css";

export default function Insurances() {
  return (
    <div className="insurances-page">
      <div className="banner">
        <h1>Active Doctors by Insurance</h1>
        <p>Miami FL — 2026 Credentialing Directory</p>
      </div>
      <div className="content">
        <DoctorsByInsurance />
      </div>
    </div>
  );
}

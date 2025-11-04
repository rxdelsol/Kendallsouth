import React from "react";
import "../styles/header.css";

export default function Header({ onOpenIns, onOpenDocs }) {
  return (
    <div className="ks-header">
      <div className="ks-header-inner">
        <img src="/logo.png" alt="Kendall South Medical Center" className="ks-logo" />
        <div className="ks-title">Kendall South Medical Center — Provider Credential Tracker</div>
      </div>

      <div className="ks-actions">
        {/* Keep your original buttons here or below; these buttons simply trigger modals */}
        <button className="ks-btn" onClick={onOpenIns}>Insurances</button>
        <button className="ks-btn" onClick={onOpenDocs}>Doctors</button>
      </div>
    </div>
  );
}


import React from "react";

export default function InsurancesModal({ onClose }) {
  return (
    <div className="modal">
      <h2>Insurances</h2>
      <p>Add or edit doctors under each insurance plan here.</p>
      <button onClick={onClose}>Close</button>
    </div>
  );
}


import React from "react";

export default function DoctorsModal({ onClose }) {
  return (
    <div className="modal">
      <h2>Doctors</h2>
      <p>Manage all doctors, search and filter by specialty.</p>
      <button onClick={onClose}>Close</button>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import "../styles/header.css";

export default function DoctorsModal({ open, onClose }){
  const [doctors, setDoctors] = useState([]);
  const [q, setQ] = useState("");
  const [specialty, setSpecialty] = useState("");

  useEffect(()=>{
    const d = localStorage.getItem("doctorsByInsurance");
    if(d){
      const obj = JSON.parse(d);
      const list = [];
      Object.keys(obj).forEach(ins=> obj[ins].forEach(name=> list.push({name, insurance: ins})));
      setDoctors(list);
    }
  },[open]);

  const filtered = useMemo(()=>{
    const term = q.trim().toLowerCase();
    return doctors.filter(d=> (d.name.toLowerCase().includes(term) || d.insurance.toLowerCase().includes(term)) && (specialty? (d.specialty||'').toLowerCase().includes(specialty.toLowerCase()) : true));
  },[doctors,q,specialty]);

  if(!open) return null;
  return (
    <div className="ks-modal-overlay">
      <div className="ks-modal-full">
        <div className="ks-modal-header">
          <h2>Doctors Directory</h2>
          <button className="ks-close" onClick={onClose}>✕</button>
        </div>
        <div className="ks-modal-body">
          <div className="ks-docs-controls">
            <input placeholder="Search by name or insurance..." value={q} onChange={e=>setQ(e.target.value)} />
            <input placeholder="Filter by specialty (optional)..." value={specialty} onChange={e=>setSpecialty(e.target.value)} />
          </div>
          <div className="ks-docs-list">
            {filtered.length===0 ? <div className="ks-empty">No doctors found</div> : (
              <table className="ks-docs-table">
                <thead><tr><th>Name</th><th>Insurance</th></tr></thead>
                <tbody>
                  {filtered.map((d,i)=> <tr key={i}><td>{d.name}</td><td>{d.insurance}</td></tr>)}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

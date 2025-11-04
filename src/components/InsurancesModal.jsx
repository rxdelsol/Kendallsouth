import React, { useEffect, useState } from "react";
import "../styles/header.css";

export default function InsurancesModal({ open, onClose }){
  const [insList, setInsList] = useState([]);
  const [doctorsByIns, setDoctorsByIns] = useState({});
  const [newIns, setNewIns] = useState("");
  const [newDoc, setNewDoc] = useState("");

  useEffect(()=>{
    const i = localStorage.getItem("insuranceList");
    if(i) setInsList(JSON.parse(i));
    const d = localStorage.getItem("doctorsByInsurance");
    if(d) setDoctorsByIns(JSON.parse(d));
  },[]);

  useEffect(()=>{
    localStorage.setItem("insuranceList", JSON.stringify(insList));
  },[insList]);

  useEffect(()=>{
    localStorage.setItem("doctorsByInsurance", JSON.stringify(doctorsByIns));
  },[doctorsByIns]);

  if(!open) return null;
  return (
    <div className="ks-modal-overlay">
      <div className="ks-modal-full">
        <div className="ks-modal-header">
          <h2>Manage Insurances</h2>
          <button className="ks-close" onClick={onClose}>✕</button>
        </div>
        <div className="ks-modal-body">
          <div className="ks-ins-panel">
            <div className="ks-ins-left">
              <h3>Insurances</h3>
              <ul className="ks-ins-list">
                {insList.map((ins, idx) => <li key={ins}>{ins}</li>)}
              </ul>
              <div className="ks-ins-add">
                <input value={newIns} onChange={e=>setNewIns(e.target.value)} placeholder="New insurance..." />
                <button onClick={()=>{ if(newIns.trim()){ setInsList(prev=>[...prev,newIns.trim()]); setNewIns(''); }}}>Add</button>
              </div>
            </div>
            <div className="ks-ins-right">
              <h3>Doctors per Insurance</h3>
              {insList.map(ins => (
                <div className="ks-ins-card" key={ins}>
                  <div className="ks-ins-card-title">{ins}</div>
                  <div className="ks-ins-card-body">
                    <ul>
                      {(doctorsByIns[ins]||[]).map((d,idx)=>(
                        <li key={idx}>{d} <button onClick={()=>{ const copy={...doctorsByIns}; copy[ins].splice(idx,1); setDoctorsByIns(copy); }}>✕</button></li>
                      ))}
                    </ul>
                    <div className="ks-add-doc">
                      <input value={newDoc} onChange={e=>setNewDoc(e.target.value)} placeholder="Doctor name..." />
                      <button onClick={()=>{ if(newDoc.trim()){ setDoctorsByIns(prev=>({...prev,[ins]:[...(prev[ins]||[]), newDoc.trim()]})); setNewDoc(''); }}}>Add</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

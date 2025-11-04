import React, { useEffect, useState } from "react";

export default function InsurancesModal({ open, onClose }){
  const [insList, setInsList] = useState([]);
  const [doctorsByIns, setDoctorsByIns] = useState({});
  const [newIns, setNewIns] = useState("");
  const [newDocName, setNewDocName] = useState("");
  const [active, setActive] = useState(null);

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
                {insList.map((ins) => (
                  <li key={ins} onClick={() => setActive(ins)} style={{cursor:"pointer", padding:"6px 4px", background: active===ins? "rgba(255,255,255,0.02)":"transparent"}}>{ins}</li>
                ))}
              </ul>
              <div style={{display:"flex", gap:8, marginTop:10}}>
                <input value={newIns} onChange={e=>setNewIns(e.target.value)} placeholder="New insurance..." />
                <button onClick={()=>{ const v=newIns.trim(); if(!v) return; if(insList.includes(v)){ setNewIns(''); return;} setInsList(prev=>[...prev,v]); setNewIns(''); }}>Add</button>
              </div>
            </div>
            <div className="ks-ins-right">
              <h3>Doctors per Insurance</h3>
              {active ? (
                <div className="ks-ins-card">
                  <div style={{marginBottom:8, fontWeight:700}}>{active}</div>
                  <ul>
                    {(doctorsByIns[active]||[]).map((d,idx)=>(
                      <li key={idx} style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 4px"}}>
                        <span>{d}</span>
                        <button onClick={()=>{ const copy={...doctorsByIns}; copy[active].splice(idx,1); setDoctorsByIns(copy); }}>✕</button>
                      </li>
                    ))}
                  </ul>
                  <div style={{display:"flex", gap:8, marginTop:8}}>
                    <input value={newDocName} onChange={e=>setNewDocName(e.target.value)} placeholder="Doctor name..." />
                    <button onClick={()=>{ const name=newDocName.trim(); if(!name) return; setDoctorsByIns(prev=>({...prev, [active]: [...(prev[active]||[]), name]})); setNewDocName(''); }}>Add</button>
                  </div>
                </div>
              ) : <div>Select an insurance to view or add doctors.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";

export default function InsurancesModal({ open, onClose }){
  const defaultIns = ["Aetna","Florida Blue","Cigna","Ambetter","UnitedHealthcare","Molina Healthcare","AmeriHealth Caritas","Florida Health Care Plan","Oscar"];
  const [insList, setInsList] = useState(defaultIns);
  const [doctorsByIns, setDoctorsByIns] = useState({});
  const [activeIns, setActiveIns] = useState(insList[0]);
  const [docName, setDocName] = useState('');
  const [expiration, setExpiration] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(()=>{
    const i = localStorage.getItem('insuranceList');
    if(i) setInsList(JSON.parse(i));
    const d = localStorage.getItem('doctorsByInsurance');
    if(d) setDoctorsByIns(JSON.parse(d));
  },[]);

  useEffect(()=>{
    localStorage.setItem('insuranceList', JSON.stringify(insList));
  },[insList]);

  useEffect(()=>{
    localStorage.setItem('doctorsByInsurance', JSON.stringify(doctorsByIns));
  },[doctorsByIns]);

  useEffect(()=>{
    if(!insList.includes(activeIns)) setActiveIns(insList[0]||'');
  },[insList]);

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
                {insList.map(i=> <li key={i} onClick={()=>setActiveIns(i)} style={{cursor:'pointer', padding:'6px 4px', background: activeIns===i? 'rgba(255,255,255,0.02)':'transparent'}}>{i}</li>)}
              </ul>
              <div style={{display:'flex', gap:8, marginTop:10}}>
                <input placeholder="New insurance..." onKeyDown={(e)=>{ if(e.key==='Enter'){ const v=e.target.value.trim(); if(v){ setInsList(prev=>[...prev,v]); e.target.value=''; } } }} />
                <button onClick={()=>{ const el=document.querySelector('.ks-ins-left input'); const v=el&&el.value.trim(); if(v){ setInsList(prev=>[...prev,v]); if(el) el.value=''; } }}>Add</button>
              </div>
            </div>

            <div className="ks-ins-right">
              <h3>Doctors per Insurance</h3>
              <div className="ks-ins-right-grid">
                {(insList||[]).map(ins=> (
                  <div className="ks-card" key={ins}>
                    <div className="ks-card-title">{ins}</div>
                    <div className="ks-card-body">
                      <ul>
                        {(doctorsByIns[ins]||[]).map((d,idx)=>(
                          <li key={idx} style={{display:'flex', justifyContent:'space-between', padding:'6px 4px'}}>
                            <div>
                              <div style={{fontWeight:700}}>{d.name}</div>
                              <div style={{fontSize:12, color:'#9aa4b2'}}>{d.expiration ? d.expiration : 'No expiration'}</div>
                              <div style={{fontSize:12, color:'#9aa4b2'}}>{d.notes}</div>
                            </div>
                            <button onClick={()=>{ const copy={...doctorsByIns}; copy[ins].splice(idx,1); setDoctorsByIns(copy); }}>✕</button>
                          </li>
                        ))}
                      </ul>

                      <div style={{display:'flex', gap:8, marginTop:8, alignItems:'center'}}>
                        <input placeholder="Doctor name..." value={activeIns===ins?docName:''} onChange={(e)=>setDocName(e.target.value)} style={{flex:1}} />
                        <input type="date" value={activeIns===ins?expiration:''} onChange={(e)=>setExpiration(e.target.value)} />
                        <input placeholder="Notes" value={activeIns===ins?notes:''} onChange={(e)=>setNotes(e.target.value)} />
                        <button onClick={()=>{
                          if(!docName.trim()) return;
                          setDoctorsByIns(prev=> ({
                            ...prev,
                            [ins]: [...(prev[ins]||[]), { name: docName.trim(), expiration: expiration||null, notes: notes||'' }]
                          }));
                          setDocName(''); setExpiration(''); setNotes('');
                        }}>Add</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import InsurancesModal from "./components/InsurancesModal";
import DoctorsModal from "./components/DoctorsModal";
import "./styles/header.css";

export default function App(){
  const [showIns, setShowIns] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [doctorsByIns, setDoctorsByIns] = useState({});

  useEffect(()=>{
    const raw = localStorage.getItem('doctorsByInsurance') || '{}';
    setDoctorsByIns(JSON.parse(raw));
  },[]);

  // listen to storage updates from modals
  useEffect(()=>{
    const onStorage = ()=>{
      const raw = localStorage.getItem('doctorsByInsurance') || '{}';
      setDoctorsByIns(JSON.parse(raw));
    };
    window.addEventListener('storage', onStorage);
    return ()=> window.removeEventListener('storage', onStorage);
  },[]);

  // compute alerts summary
  const summary = Object.entries(doctorsByIns).map(([ins, docs])=>{
    const soon = docs.filter(d=>{
      if(!d.expiration) return false;
      const days = Math.ceil((new Date(d.expiration) - new Date()) / (1000*60*60*24));
      return days <= 90;
    }).length;
    return {insurance: ins, total: docs.length, soon};
  });

  return (
    <div>
      <Header onOpenIns={()=>setShowIns(true)} onOpenDocs={()=>setShowDocs(true)} />
      <div className="actions-bar" role="toolbar" aria-label="Actions">
        <button className="action-btn">Apply</button>
        <button className="action-btn">Clear</button>
        <button className="action-btn primary">+ Add</button>
        <button className="action-btn">Reload</button>
        <button className="action-btn">CSV</button>
        <button className="action-btn">Backup</button>
        <button className="action-btn">Restore</button>
        <div style={{flex:1}} />
        <button className="action-btn" onClick={()=>setShowIns(true)}>Insurances</button>
        <button className="action-btn" onClick={()=>setShowDocs(true)}>Doctors</button>
      </div>

      <main style={{padding:20}}>
        <div className="table-placeholder">
          This is your main table (keep your existing content). Use the Doctors modal to manage doctors and the Insurances modal to manage insurers.
        </div>

        <section style={{marginTop:20}}>
          <h3 style={{margin:'8px 24px', color:'#cfe9ff'}}>Expiration Dashboard</h3>
          <div className="expiration-grid">
            {Object.keys(doctorsByIns).length===0 ? (
              <div className="empty-card">No doctors/insurances yet</div>
            ) : Object.entries(doctorsByIns).map(([ins, docs])=> (
              <div key={ins} className="exp-card">
                <div className="exp-card-header">
                  <strong>{ins}</strong>
                  <div className="exp-meta">{docs.length} doctors</div>
                </div>
                <ul className="exp-list">
                  {docs.map((d,idx)=> {
                    const exp = d.expiration;
                    let days = null;
                    if(exp){ days = Math.ceil((new Date(exp) - new Date())/(1000*60*60*24)); }
                    const status = days===null ? 'none' : (days<0 ? 'expired' : (days<=30 ? 'danger' : (days<=90 ? 'warn' : 'ok')));
                    return (
                      <li key={idx} className={`exp-item ${status}`}>
                        <div className="exp-name">{d.name}</div>
                        <div className="exp-info">
                          <div className="exp-days">{exp ? (days<0 ? 'Expired' : `${days} days`) : 'No date'}</div>
                          <div className="exp-notes">{d.notes || ''}</div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </main>

      <InsurancesModal open={showIns} onClose={()=>setShowIns(false)} />
      <DoctorsModal open={showDocs} onClose={()=>setShowDocs(false)} />
    </div>
  );
}

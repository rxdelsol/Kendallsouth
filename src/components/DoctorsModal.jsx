import React, { useEffect, useMemo, useState } from "react";

export default function DoctorsModal({ open, onClose }){
  const [doctors, setDoctors] = useState([]);
  const [q, setQ] = useState('');

  useEffect(()=>{
    const d = localStorage.getItem('doctorsByInsurance');
    if(d){
      const obj = JSON.parse(d);
      const list = [];
      Object.keys(obj).forEach(ins=> obj[ins].forEach(name=> list.push({name: name.name, insurance: ins, expiration: name.expiration, notes: name.notes})));
      setDoctors(list);
    }
  },[open]);

  const filtered = useMemo(()=>{
    const term = q.trim().toLowerCase();
    return doctors.filter(d=> d.name.toLowerCase().includes(term) || d.insurance.toLowerCase().includes(term));
  },[doctors,q]);

  if(!open) return null;
  return (
    <div className="ks-modal-overlay">
      <div className="ks-modal-full">
        <div className="ks-modal-header">
          <h2>Doctors Directory</h2>
          <button className="ks-close" onClick={onClose}>✕</button>
        </div>
        <div className="ks-modal-body">
          <div style={{display:'flex', gap:8, marginBottom:10}}>
            <input placeholder="Search by name or insurance..." value={q} onChange={e=>setQ(e.target.value)} />
          </div>
          <div className="ks-docs-list">
            {filtered.length===0 ? <div className="ks-empty">No doctors found</div> : (
              <table className="ks-docs-table" style={{width:'100%', borderCollapse:'collapse'}}>
                <thead><tr><th style={{textAlign:'left', padding:8}}>Name</th><th style={{textAlign:'left', padding:8}}>Insurance</th><th style={{textAlign:'left', padding:8}}>Expires</th></tr></thead>
                <tbody>
                  {filtered.map((d,i)=> <tr key={i}><td style={{padding:8}}>{d.name}</td><td style={{padding:8}}>{d.insurance}</td><td style={{padding:8}}>{d.expiration||'—'}</td></tr>)}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

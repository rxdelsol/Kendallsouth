import React, { useEffect, useState } from 'react'

export default function InsurancesModal({ open, onClose }){
  const defaults = ['Aetna','Florida Blue','Cigna','Ambetter','UnitedHealthcare','Molina Healthcare','AmeriHealth Caritas','Florida Health Care Plan','Oscar']
  const [insList, setInsList] = useState(defaults)
  const [doctorsByIns, setDoctorsByIns] = useState({})
  const [active, setActive] = useState(defaults[0])
  const [selectedDoc, setSelectedDoc] = useState('')
  const [expiration, setExpiration] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(()=>{
    const i = localStorage.getItem('insuranceList'); if(i) setInsList(JSON.parse(i))
    const d = localStorage.getItem('doctorsByInsurance'); if(d) setDoctorsByIns(JSON.parse(d))
  },[])

  useEffect(()=>{ localStorage.setItem('insuranceList', JSON.stringify(insList)) },[insList])
  useEffect(()=>{ localStorage.setItem('doctorsByInsurance', JSON.stringify(doctorsByIns)) },[doctorsByIns])

  const doctors = JSON.parse(localStorage.getItem('doctorsList')||'[]')

  if(!open) return null
  return (
    <div className="ks-modal-overlay">
      <div className="ks-modal-full">
        <div className="ks-modal-header"><h2>Manage Insurances</h2><button className="ks-close" onClick={onClose}>✕</button></div>
        <div className="ks-modal-body">
          <div className="ks-ins-panel">
            <div className="ks-ins-left">
              <h3>Insurances</h3>
              <ul className="ks-ins-list">{insList.map(i=> <li key={i} onClick={()=>setActive(i)} style={{cursor:'pointer', padding:'6px 4px', background: active===i? 'rgba(255,255,255,0.02)':'transparent'}}>{i}</li>)}</ul>
              <div style={{display:'flex', gap:8, marginTop:10}}>
                <input placeholder="New insurance..." onKeyDown={e=>{ if(e.key==='Enter'){ const v=e.target.value.trim(); if(v){ setInsList(prev=>[...prev,v]); e.target.value='' } } }} />
                <button onClick={()=>{ const el=document.querySelector('.ks-ins-left input'); const v=el&&el.value.trim(); if(v){ setInsList(prev=>[...prev,v]); if(el) el.value='' } }}>Add</button>
              </div>
            </div>
            <div className="ks-ins-right">
              <h3>Assign Doctor to {active}</h3>
              <div style={{display:'flex', gap:8, alignItems:'center'}}>
                <select value={selectedDoc} onChange={e=>setSelectedDoc(e.target.value)}>
                  <option value="">-- select doctor --</option>
                  {doctors.map(d=> <option key={d.id} value={d.id}>{d.name} — NPI: {d.npi}</option>)}
                </select>
                <input type="date" value={expiration} onChange={e=>setExpiration(e.target.value)} />
                <input placeholder="Notes" value={notes} onChange={e=>setNotes(e.target.value)} />
                <button onClick={()=>{
                  if(!selectedDoc) return alert('Select a doctor');
                  const doc = doctors.find(x=> x.id===selectedDoc); if(!doc) return;
                  const entry = { doctorId: selectedDoc, name: doc.name, expiration: expiration||null, notes: notes||'' }
                  setDoctorsByIns(prev=> ({ ...prev, [active]: [...(prev[active]||[]), entry ] }))
                  setSelectedDoc(''); setExpiration(''); setNotes('')
                }}>Add</button>
              </div>

              <h4 style={{marginTop:12}}>Doctors for {active}</h4>
              <ul>
                {(doctorsByIns[active]||[]).map((d,idx)=>(
                  <li key={idx} style={{display:'flex', justifyContent:'space-between', padding:'6px 4px'}}>
                    <div><strong>{d.name}</strong><div style={{fontSize:12, color:'#9aa4b2'}}>{d.expiration||'No expiration'}</div></div>
                    <button onClick={()=>{ const copy={...doctorsByIns}; copy[active].splice(idx,1); setDoctorsByIns(copy); }}>✕</button>
                  </li>
                ))}
              </ul>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

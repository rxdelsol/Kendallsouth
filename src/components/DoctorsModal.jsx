import React, { useEffect, useMemo, useState } from 'react'
export default function DoctorsModal({ open, onClose }){
  const [doctors, setDoctors] = useState([]); const [q,setQ]=useState('')
  useEffect(()=>{ const d = localStorage.getItem('doctorsList'); if(d) setDoctors(JSON.parse(d)) },[open])
  const filtered = useMemo(()=>{ const term=q.trim().toLowerCase(); return doctors.filter(d=> d.name.toLowerCase().includes(term) || (d.npi||'').toLowerCase().includes(term)) },[doctors,q])
  if(!open) return null
  return (<div className="ks-modal-overlay"><div className="ks-modal-full"><div className="ks-modal-header"><h2>Doctors Directory</h2><button className="ks-close" onClick={onClose}>✕</button></div><div className="ks-modal-body"><div style={{display:'flex',gap:8,marginBottom:10}}><input placeholder="Search by name or NPI..." value={q} onChange={e=>setQ(e.target.value)} /></div><div className="ks-docs-list">{filtered.length===0 ? <div className="ks-empty">No doctors found</div> : (<table className="ks-docs-table" style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={{textAlign:'left',padding:8}}>Name</th><th style={{textAlign:'left',padding:8}}>NPI</th><th style={{textAlign:'left',padding:8}}>License</th></tr></thead><tbody>{filtered.map((d,i)=> <tr key={i}><td style={{padding:8}}>{d.name}</td><td style={{padding:8}}>{d.npi}</td><td style={{padding:8}}>{d.license}</td></tr>)}</tbody></table>)}</div></div></div></div>)
}

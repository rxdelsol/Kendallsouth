import React, { useEffect, useMemo, useState } from 'react';
import ModalFull from './ModalFull.jsx';
import './styles/doctors.css';

export default function DoctorsModal({open, onClose}){
  const [doctors, setDoctors] = useState([]);
  const [q, setQ] = useState('');
  const [specialty, setSpecialty] = useState('');

  useEffect(()=>{
    const s = localStorage.getItem('doctorsByInsurance');
    if(s){
      const obj = JSON.parse(s);
      const list = [];
      Object.keys(obj).forEach(ins=> obj[ins].forEach(name=> list.push({name, insurance:ins})));
      setDoctors(list);
    }
  },[open]);

  useEffect(()=>{
    // keep doctors synced if user updates in Insurances modal
    const onStorage = ()=>{
      const s = localStorage.getItem('doctorsByInsurance') || '{}';
      const obj = JSON.parse(s);
      const list = [];
      Object.keys(obj).forEach(ins=> obj[ins].forEach(name=> list.push({name, insurance:ins})));
      setDoctors(list);
    };
    window.addEventListener('storage', onStorage);
    return ()=>window.removeEventListener('storage', onStorage);
  },[]);

  const filtered = useMemo(()=>{
    const term = q.trim().toLowerCase();
    return doctors.filter(d=> (d.name.toLowerCase().includes(term) || d.insurance.toLowerCase().includes(term)) && (specialty? (d.specialty||'').toLowerCase().includes(specialty.toLowerCase()): true));
  },[doctors,q,specialty]);

  return (
    <ModalFull open={open} onClose={onClose} title="Doctors Directory">
      <div className="docs-panel">
        <div className="docs-controls">
          <input placeholder="Search by name or insurance..." value={q} onChange={e=>setQ(e.target.value)} />
          <input placeholder="Filter by specialty (optional)..." value={specialty} onChange={e=>setSpecialty(e.target.value)} />
        </div>

        <div className="docs-list">
          {filtered.length===0 ? <div className="empty">No doctors found</div> : (
            <table className="docs-table">
              <thead><tr><th>Name</th><th>Insurance</th></tr></thead>
              <tbody>
                {filtered.map((d,i)=> <tr key={i}><td>{d.name}</td><td>{d.insurance}</td></tr>)}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </ModalFull>
  );
}
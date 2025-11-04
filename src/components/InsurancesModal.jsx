import React, { useEffect, useState } from 'react';
import ModalFull from './ModalFull.jsx';
import './styles/insurance.css';

const DEFAULT_INS = [
  "Aetna","Florida Blue","Cigna","Ambetter","UnitedHealthcare",
  "Molina Healthcare","AmeriHealth Caritas","Florida Health Care Plan","Oscar"
];

export default function InsurancesModal({open, onClose}){
  const [insurances, setInsurances] = useState(DEFAULT_INS);
  const [doctorsByIns, setDoctorsByIns] = useState({});
  const [newIns, setNewIns] = useState('');

  useEffect(()=>{
    const s = localStorage.getItem('doctorsByInsurance');
    if(s) setDoctorsByIns(JSON.parse(s));
    const i = localStorage.getItem('insuranceList');
    if(i) setInsurances(JSON.parse(i));
  },[]);

  useEffect(()=>{
    localStorage.setItem('doctorsByInsurance', JSON.stringify(doctorsByIns));
  },[doctorsByIns]);

  useEffect(()=>{
    localStorage.setItem('insuranceList', JSON.stringify(insurances));
  },[insurances]);

  const addInsurance = ()=>{
    const v = newIns.trim();
    if(!v) return;
    if(insurances.includes(v)) return setNewIns('');
    setInsurances(prev=>[...prev, v]);
    setNewIns('');
  };

  const addDoctor = (ins, name)=>{
    setDoctorsByIns(prev=>({...prev, [ins]: [...(prev[ins]||[]), name]}));
  };

  const removeDoctor = (ins, idx)=>{
    setDoctorsByIns(prev=>{ const copy={...prev}; copy[ins].splice(idx,1); return copy; });
  };

  return (
    <ModalFull open={open} onClose={onClose} title="Manage Insurances">
      <div className="ins-panel">
        <div className="ins-left">
          <h3>Insurances</h3>
          <ul className="ins-list">
            {insurances.map(i=> <li key={i}>{i}</li>)}
          </ul>
          <div className="ins-add">
            <input placeholder="New insurance..." value={newIns} onChange={e=>setNewIns(e.target.value)} />
            <button className="btn" onClick={addInsurance}>Add</button>
          </div>
        </div>

        <div className="ins-right">
          <h3>Doctors per Insurance</h3>
          <div className="ins-right-grid">
            {insurances.map(ins=> (
              <div className="ins-card" key={ins}>
                <div className="ins-card-title">{ins}</div>
                <div className="ins-card-body">
                  <ul>
                    {(doctorsByIns[ins]||[]).map((d,idx)=> (
                      <li key={idx}>
                        <span>{d}</span>
                        <button className="del" onClick={()=>removeDoctor(ins,idx)}>✕</button>
                      </li>
                    ))}
                  </ul>
                  <AddDoctorForm onAdd={(name)=>addDoctor(ins,name)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ModalFull>
  );
}

function AddDoctorForm({onAdd}){
  const [v,setV]=React.useState('');
  return (
    <div className="add-doctor-form">
      <input value={v} onChange={e=>setV(e.target.value)} placeholder="Doctor name..." />
      <button className="btn" onClick={()=>{ if(v.trim()){ onAdd(v.trim()); setV(''); } }}>Add</button>
    </div>
  );
}
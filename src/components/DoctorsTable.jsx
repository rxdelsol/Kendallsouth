import React, { useEffect, useState } from 'react'
import DoctorModal from './DoctorModal.jsx'
export default function DoctorsTable(){
  const emptyDoctor = ()=>({ id:null, name:'', npi:'', license:'', caqh:'', medicaid:'', medicare:'', dob:'', taxonomy:'' })
  const [doctors, setDoctors] = useState([])
  const [newDoc, setNewDoc] = useState(emptyDoctor())
  const [showModal, setShowModal] = useState(false)
  useEffect(()=> setDoctors(JSON.parse(localStorage.getItem('doctorsList')||'[]')), [])
  useEffect(()=> localStorage.setItem('doctorsList', JSON.stringify(doctors)), [doctors])
  const saveDoctor = (doc)=>{ const id=doc.id||Date.now().toString(); const item={...doc,id}; setDoctors(prev=> [...prev.filter(d=>d.id!==id), item]); setShowModal(false) }
  const remove = id=> setDoctors(prev=> prev.filter(d=> d.id!==id))
  return (
    <div className="bg-card rounded p-4">
      <h2 className="text-sky-200 font-semibold mb-2">Doctors</h2>
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="text-slate-300"><tr><th className="p-2">Name</th><th className="p-2">NPI</th><th className="p-2">License</th><th className="p-2">CAQH</th><th className="p-2">Medicaid</th><th className="p-2">Medicare</th><th className="p-2">DOB</th><th className="p-2">Taxonomy</th><th className="p-2">Actions</th></tr></thead>
          <tbody className="text-slate-200">
            {doctors.map(d=> (
              <tr key={d.id} className="border-t border-slate-800">
                <td className="p-2">{d.name}</td>
                <td className="p-2">{d.npi}</td>
                <td className="p-2">{d.license}</td>
                <td className="p-2">{d.caqh}</td>
                <td className="p-2">{d.medicaid}</td>
                <td className="p-2">{d.medicare}</td>
                <td className="p-2">{d.dob}</td>
                <td className="p-2">{d.taxonomy}</td>
                <td className="p-2"><button className="text-red-500 hover:underline" onClick={()=>remove(d.id)}>Delete Doctor</button></td>
              </tr>
            ))}
            {doctors.length===0 && <tr><td colSpan="9" className="p-4 text-slate-400">No doctors added yet</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-left"><button onClick={()=>setShowModal(true)} className="text-sky-300 hover:underline text-sm">+ Add Doctor</button></div>
      {showModal && <DoctorModal onClose={()=>setShowModal(false)} onSave={saveDoctor} />}
    </div>
  )
}

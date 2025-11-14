import React, { useState } from 'react'
export default function DoctorModal({ onClose, onSave, initial }){
  const init = initial || { name:'', npi:'', license:'', caqh:'', medicaid:'', medicare:'', dob:'', taxonomy:'' }
  const [doc, setDoc] = useState(init)
  const handleSave = ()=>{ if(!doc.name) return alert('Enter name'); onSave(doc) }
  return (
    <div className="modal-backdrop"><div className="modal"><h3>Add Doctor</h3>
      <div className="grid grid-cols-1 gap-2 mt-2">
        <input placeholder="Full Name" value={doc.name} onChange={e=>setDoc({...doc, name:e.target.value})} className="p-2 rounded bg-[#081424]" />
        <input placeholder="NPI" value={doc.npi} onChange={e=>setDoc({...doc, npi:e.target.value})} className="p-2 rounded bg-[#081424]" />
        <input placeholder="License Number" value={doc.license} onChange={e=>setDoc({...doc, license:e.target.value})} className="p-2 rounded bg-[#081424]" />
        <input placeholder="CAQH Number" value={doc.caqh} onChange={e=>setDoc({...doc, caqh:e.target.value})} className="p-2 rounded bg-[#081424]" />
        <input placeholder="Medicaid Number" value={doc.medicaid} onChange={e=>setDoc({...doc, medicaid:e.target.value})} className="p-2 rounded bg-[#081424]" />
        <input placeholder="Medicare Number" value={doc.medicare} onChange={e=>setDoc({...doc, medicare:e.target.value})} className="p-2 rounded bg-[#081424]" />
        <input type="date" placeholder="DOB" value={doc.dob} onChange={e=>setDoc({...doc, dob:e.target.value})} className="p-2 rounded bg-[#081424]" />
        <input placeholder="Taxonomy Code" value={doc.taxonomy} onChange={e=>setDoc({...doc, taxonomy:e.target.value})} className="p-2 rounded bg-[#081424]" />
      </div>
      <div className="mt-4 flex justify-end gap-2"><button className="btn-cancel" onClick={onClose}>Cancel</button><button className="btn-red" onClick={handleSave}>Save Doctor</button></div>
    </div></div>
  )
}

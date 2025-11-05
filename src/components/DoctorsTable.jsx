import React, { useEffect, useState } from 'react'
export default function DoctorsTable(){
  const emptyDoctor = ()=>({ id:null, name:'', npi:'', license:'', caqh:'', medicaid:'', medicare:'', dob:'', taxonomy:'' })
  const [doctors, setDoctors] = useState([])
  const [newDoc, setNewDoc] = useState(emptyDoctor())
  const [confirm, setConfirm] = useState({open:false, id:null})
  const [toast, setToast] = useState('')

  useEffect(()=> setDoctors(JSON.parse(localStorage.getItem('doctorsList')||'[]')), [])
  useEffect(()=> localStorage.setItem('doctorsList', JSON.stringify(doctors)), [doctors])

  const add = ()=>{ if(!newDoc.name.trim()) return alert('Enter name'); const id=Date.now().toString(); setDoctors(prev=> [...prev, {...newDoc,id}]); setNewDoc(emptyDoctor()); setToast('Doctor added'); setTimeout(()=>setToast(''),2500) }
  const update = (id, field, value)=> setDoctors(prev=> prev.map(d=> d.id===id? {...d, [field]: value}: d))
  const askDelete = (id)=> setConfirm({open:true, id})
  const doDelete = ()=>{ setDoctors(prev=> prev.filter(d=> d.id!==confirm.id)); setConfirm({open:false, id:null}); setToast('Doctor deleted'); setTimeout(()=>setToast(''),2500) }

  return (
    <div className="bg-card rounded p-4 relative">
      <h2 className="text-sky-200 font-semibold mb-2">Doctors</h2>
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="text-slate-300"><tr><th className="p-2">Name</th><th className="p-2">NPI</th><th className="p-2">License</th><th className="p-2">CAQH</th><th className="p-2">DOB</th><th className="p-2">Taxonomy</th><th className="p-2">Actions</th></tr></thead>
          <tbody className="text-slate-200">
            {doctors.map(d=> (
              <tr key={d.id} className="border-t border-slate-800">
                <td className="p-2"><input className="bg-transparent w-full" value={d.name} onChange={e=>update(d.id,'name',e.target.value)} /></td>
                <td className="p-2"><input className="bg-transparent w-full" value={d.npi} onChange={e=>update(d.id,'npi',e.target.value)} /></td>
                <td className="p-2"><input className="bg-transparent w-full" value={d.license} onChange={e=>update(d.id,'license',e.target.value)} /></td>
                <td className="p-2"><input className="bg-transparent w-full" value={d.caqh} onChange={e=>update(d.id,'caqh',e.target.value)} /></td>
                <td className="p-2"><input type="date" className="bg-transparent" value={d.dob||''} onChange={e=>update(d.id,'dob',e.target.value)} /></td>
                <td className="p-2"><input className="bg-transparent w-full" value={d.taxonomy} onChange={e=>update(d.id,'taxonomy',e.target.value)} /></td>
                <td className="p-2"><button className="px-3 py-1 rounded btn-red" onClick={()=>askDelete(d.id)}>Delete Doctor</button></td>
              </tr>
            ))}
            <tr className="border-t border-slate-800">
              <td className="p-2"><input value={newDoc.name} onChange={e=>setNewDoc({...newDoc, name:e.target.value})} placeholder="Full name" className="bg-transparent w-full" /></td>
              <td className="p-2"><input value={newDoc.npi} onChange={e=>setNewDoc({...newDoc, npi:e.target.value})} placeholder="NPI" className="bg-transparent w-full" /></td>
              <td className="p-2"><input value={newDoc.license} onChange={e=>setNewDoc({...newDoc, license:e.target.value})} placeholder="License" className="bg-transparent w-full" /></td>
              <td className="p-2"><input value={newDoc.caqh} onChange={e=>setNewDoc({...newDoc, caqh:e.target.value})} placeholder="CAQH" className="bg-transparent w-full" /></td>
              <td className="p-2"><input type="date" value={newDoc.dob||''} onChange={e=>setNewDoc({...newDoc, dob:e.target.value})} className="bg-transparent" /></td>
              <td className="p-2"><input value={newDoc.taxonomy} onChange={e=>setNewDoc({...newDoc, taxonomy:e.target.value})} placeholder="Taxonomy" className="bg-transparent w-full" /></td>
              <td className="p-2"><button className="px-3 py-1 rounded bg-sky-400 text-navy-900 font-semibold" onClick={add}>+ Add</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      {confirm.open && (<div className="modal-backdrop"><div className="modal"><h3>Confirm Delete</h3><p>Are you sure you want to delete this doctor?</p><div className="mt-4 flex justify-end gap-2"><button className="btn-cancel" onClick={()=>setConfirm({open:false,id:null})}>Cancel</button><button className="btn-red" onClick={doDelete}>Delete Doctor</button></div></div></div>)}
      {toast && (<div className="toast">{toast}</div>)}
    </div>
  )
}

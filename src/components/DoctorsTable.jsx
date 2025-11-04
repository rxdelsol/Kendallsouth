import React, { useEffect, useState } from 'react'

const emptyDoctor = ()=>({ id:null, name:'', npi:'', license:'', caqh:'', medicaid:'', medicare:'', dob:'', taxonomy:'' })

export default function DoctorsTable(){
  const [doctors, setDoctors] = useState([])
  const [newDoc, setNewDoc] = useState(emptyDoctor())

  useEffect(()=>{
    setDoctors(JSON.parse(localStorage.getItem('doctorsList')||'[]'))
  },[])

  useEffect(()=> localStorage.setItem('doctorsList', JSON.stringify(doctors)), [doctors])

  const add = ()=>{
    if(!newDoc.name.trim()) return alert('Enter name')
    const id = Date.now().toString()
    setDoctors(prev=> [...prev, {...newDoc, id}])
    setNewDoc(emptyDoctor())
  }

  const update = (id, field, value)=> setDoctors(prev=> prev.map(d=> d.id===id ? {...d, [field]: value} : d))

  const remove = id=>{ if(!confirm('Delete doctor?')) return; setDoctors(prev=> prev.filter(d=> d.id!==id)) }

  return (
    <div className="bg-card rounded p-4">
      <h2 className="text-sky-200 font-semibold mb-2">Doctors</h2>
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="text-slate-300"><tr><th className="p-2">Name</th><th className="p-2">NPI</th><th className="p-2">License</th><th className="p-2">CAQH</th><th className="p-2">Medicaid</th><th className="p-2">Medicare</th><th className="p-2">DOB</th><th className="p-2">Taxonomy</th><th className="p-2">Actions</th></tr></thead>
          <tbody className="text-slate-200">
            {doctors.map(d=> (
              <tr key={d.id} className="border-t border-slate-800">
                <td className="p-2"><input className="bg-transparent w-full" value={d.name} onChange={e=>update(d.id,'name',e.target.value)} /></td>
                <td className="p-2"><input className="bg-transparent w-full" value={d.npi} onChange={e=>update(d.id,'npi',e.target.value)} /></td>
                <td className="p-2"><input className="bg-transparent w-full" value={d.license} onChange={e=>update(d.id,'license',e.target.value)} /></td>
                <td className="p-2"><input className="bg-transparent w-full" value={d.caqh} onChange={e=>update(d.id,'caqh',e.target.value)} /></td>
                <td className="p-2"><input className="bg-transparent w-full" value={d.medicaid} onChange={e=>update(d.id,'medicaid',e.target.value)} /></td>
                <td className="p-2"><input className="bg-transparent w-full" value={d.medicare} onChange={e=>update(d.id,'medicare',e.target.value)} /></td>
                <td className="p-2"><input type="date" className="bg-transparent" value={d.dob||''} onChange={e=>update(d.id,'dob',e.target.value)} /></td>
                <td className="p-2"><input className="bg-transparent w-full" value={d.taxonomy} onChange={e=>update(d.id,'taxonomy',e.target.value)} /></td>
                <td className="p-2"><button className="px-2 py-1 rounded border" onClick={()=>remove(d.id)}>Delete</button></td>
              </tr>
            ))}
            <tr className="border-t border-slate-800">
              <td className="p-2"><input value={newDoc.name} onChange={e=>setNewDoc({...newDoc, name:e.target.value})} placeholder="Full name" className="bg-transparent w-full" /></td>
              <td className="p-2"><input value={newDoc.npi} onChange={e=>setNewDoc({...newDoc, npi:e.target.value})} placeholder="NPI" className="bg-transparent w-full" /></td>
              <td className="p-2"><input value={newDoc.license} onChange={e=>setNewDoc({...newDoc, license:e.target.value})} placeholder="License" className="bg-transparent w-full" /></td>
              <td className="p-2"><input value={newDoc.caqh} onChange={e=>setNewDoc({...newDoc, caqh:e.target.value})} placeholder="CAQH" className="bg-transparent w-full" /></td>
              <td className="p-2"><input value={newDoc.medicaid} onChange={e=>setNewDoc({...newDoc, medicaid:e.target.value})} placeholder="Medicaid" className="bg-transparent w-full" /></td>
              <td className="p-2"><input value={newDoc.medicare} onChange={e=>setNewDoc({...newDoc, medicare:e.target.value})} placeholder="Medicare" className="bg-transparent w-full" /></td>
              <td className="p-2"><input type="date" value={newDoc.dob||''} onChange={e=>setNewDoc({...newDoc, dob:e.target.value})} className="bg-transparent" /></td>
              <td className="p-2"><input value={newDoc.taxonomy} onChange={e=>setNewDoc({...newDoc, taxonomy:e.target.value})} placeholder="Taxonomy" className="bg-transparent w-full" /></td>
              <td className="p-2"><button className="px-3 py-1 rounded bg-sky-400 text-navy-900 font-semibold" onClick={add}>+ Add</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

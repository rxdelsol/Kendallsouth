import React, { useEffect, useState } from 'react'
export default function InsurancesTable(){
  const empty = ()=>({ id:null, name:'', type:'PPO', doctor:'', doctorName:'', network:'In Network', expiration:'', notes:'' })
  const [list, setList] = useState([])
  const [doctors, setDoctors] = useState([])
  const [newIns, setNewIns] = useState(empty())
  useEffect(()=>{ setList(JSON.parse(localStorage.getItem('insuranceList')||'[]')); setDoctors(JSON.parse(localStorage.getItem('doctorsList')||'[]')) },[])
  useEffect(()=> localStorage.setItem('insuranceList', JSON.stringify(list)), [list])
  const add = ()=>{
    if(!newIns.name.trim()) return alert('Enter insurance name')
    const id=Date.now().toString()
    const item={...newIns,id}
    // if doctor selected, store doctorName
    if(newIns.doctor){ const doc = (JSON.parse(localStorage.getItem('doctorsList')||'[]')||[]).find(d=>d.id===newIns.doctor); if(doc) item.doctorName = doc.name }
    setList(prev=> [...prev,item])
    // add to doctorsByInsurance
    const byIns = JSON.parse(localStorage.getItem('doctorsByInsurance')||'{}')
    if(item.doctor){ const entry = { doctorId: item.doctor, name: item.doctorName || '', expiration: item.expiration || null, notes: item.notes || '' }; byIns[item.name] = [...(byIns[item.name]||[]), entry]; localStorage.setItem('doctorsByInsurance', JSON.stringify(byIns)) }
    setNewIns(empty())
  }
  const update = (id, field, value)=> setList(prev=> prev.map(i=> i.id===id? {...i, [field]: value}: i))
  const remove = id=>{
    const toDel = list.find(i=> i.id===id)
    setList(prev=> prev.filter(i=> i.id!==id))
    if(toDel){ const byIns = JSON.parse(localStorage.getItem('doctorsByInsurance')||'{}'); if(byIns[toDel.name]){ delete byIns[toDel.name]; localStorage.setItem('doctorsByInsurance', JSON.stringify(byIns)) } }
  }
  const assignDoctor = (docId)=>{ setNewIns({...newIns, doctor: docId}) }
  return (
    <div className="bg-card rounded p-4">
      <h2 className="text-sky-200 font-semibold mb-2">Insurances</h2>
      <div className="overflow-auto mb-4">
        <table className="min-w-full text-sm">
          <thead className="text-slate-300"><tr><th className="p-2">Name</th><th className="p-2">Type</th><th className="p-2">Doctor</th><th className="p-2">Network</th><th className="p-2">Expiration</th><th className="p-2">Notes</th><th className="p-2">Actions</th></tr></thead>
          <tbody className="text-slate-200">
            {list.map(i=> (
              <tr key={i.id} className="border-t border-slate-800">
                <td className="p-2"><input className="bg-transparent w-full" value={i.name} onChange={e=>update(i.id,'name',e.target.value)} /></td>
                <td className="p-2"><select value={i.type} onChange={e=>update(i.id,'type',e.target.value)} className="bg-transparent"><option>HMO</option><option>PPO</option><option>Medicare</option><option>Medicaid</option><option>Other</option></select></td>
                <td className="p-2"><input className="bg-transparent w-full" value={i.doctorName||''} readOnly /></td>
                <td className="p-2"><select value={i.network||'In Network'} onChange={e=>update(i.id,'network',e.target.value)} className="bg-transparent"><option>In Network</option><option>Out of Network</option></select></td>
                <td className="p-2"><input type="date" className="bg-transparent" value={i.expiration||''} onChange={e=>update(i.id,'expiration',e.target.value)} /></td>
                <td className="p-2"><input className="bg-transparent w-full" value={i.notes||''} onChange={e=>update(i.id,'notes',e.target.value)} /></td>
                <td className="p-2"><button className="px-3 py-1 rounded btn-red" onClick={()=>remove(i.id)}>Delete Insurance</button></td>
              </tr>
            ))}
            {list.length===0 && <tr><td colSpan="7" className="p-4 text-slate-400">No insurances yet</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="border-t border-slate-800 pt-4">
        <h3 className="text-sky-200 mb-2">Add Insurance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input placeholder="Insurance name" value={newIns.name} onChange={e=>setNewIns({...newIns, name:e.target.value})} className="bg-transparent p-2" />
          <select value={newIns.type} onChange={e=>setNewIns({...newIns, type:e.target.value})} className="bg-transparent p-2"><option>HMO</option><option>PPO</option><option>Medicare</option><option>Medicaid</option><option>Other</option></select>
          <select value={newIns.doctor||''} onChange={e=>assignDoctor(e.target.value)} className="bg-transparent p-2">
            <option value="">Assign Doctor...</option>
            {doctors.map(d=> <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
          <select value={newIns.network} onChange={e=>setNewIns({...newIns, network:e.target.value})} className="bg-transparent p-2"><option>In Network</option><option>Out of Network</option></select>
          <input type="date" value={newIns.expiration} onChange={e=>setNewIns({...newIns, expiration:e.target.value})} className="bg-transparent p-2" />
          <input placeholder="Notes" value={newIns.notes} onChange={e=>setNewIns({...newIns, notes:e.target.value})} className="bg-transparent p-2" />
        </div>
        <div className="mt-4"><button className="px-3 py-2 rounded bg-sky-400 text-navy-900 font-semibold" onClick={add}>+ Add Insurance</button></div>
      </div>
    </div>
  )
}

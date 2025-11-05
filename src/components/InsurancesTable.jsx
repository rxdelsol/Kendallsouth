import React, { useEffect, useState } from 'react'
export default function InsurancesTable(){
  const empty = ()=>({ id:null, name:'', type:'PPO', notes:'', doctors: [] })
  const [list, setList] = useState([])
  const [doctors, setDoctors] = useState([])
  const [newIns, setNewIns] = useState(empty())
  useEffect(()=>{ setList(JSON.parse(localStorage.getItem('insuranceList')||'[]')); setDoctors(JSON.parse(localStorage.getItem('doctorsList')||'[]')) },[])
  useEffect(()=> localStorage.setItem('insuranceList', JSON.stringify(list)), [list])
  const add = ()=>{ if(!newIns.name.trim()) return alert('Enter insurance name'); const id=Date.now().toString(); const item={...newIns,id}; setList(prev=> [...prev,item]); const byIns=JSON.parse(localStorage.getItem('doctorsByInsurance')||'{}'); item.doctors.forEach(docId=>{ const doc = (JSON.parse(localStorage.getItem('doctorsList')||'[]')||[]).find(d=>d.id===docId); if(!doc) return; const entry={doctorId:docId, name:doc.name, expiration: null, notes: ''}; byIns[item.name]=[...(byIns[item.name]||[]), entry]; }); localStorage.setItem('doctorsByInsurance', JSON.stringify(byIns)); setNewIns(empty()) }
  const update = (id, field, value)=> setList(prev=> prev.map(i=> i.id===id? {...i, [field]: value}: i))
  const remove = id=> setList(prev=> prev.filter(i=> i.id!==id))
  const toggleDoctorInNew = (docId)=>{ const s = new Set(newIns.doctors||[]); if(s.has(docId)) s.delete(docId); else s.add(docId); setNewIns({...newIns, doctors: Array.from(s)}) }
  const countFor = (insName)=> (JSON.parse(localStorage.getItem('doctorsByInsurance')||'{}')[insName]||[]).length
  return (
    <div className="bg-card rounded p-4">
      <h2 className="text-sky-200 font-semibold mb-2">Insurances</h2>
      <div className="overflow-auto mb-4">
        <table className="min-w-full text-sm">
          <thead className="text-slate-300"><tr><th className="p-2">Name</th><th className="p-2">Type</th><th className="p-2">Notes</th><th className="p-2"># Doctors</th></tr></thead>
          <tbody className="text-slate-200">
            {list.map(i=> (
              <tr key={i.id} className="border-t border-slate-800">
                <td className="p-2"><input className="bg-transparent w-full" value={i.name} onChange={e=>update(i.id,'name',e.target.value)} /></td>
                <td className="p-2"><select value={i.type} onChange={e=>update(i.id,'type',e.target.value)} className="bg-transparent"> <option>HMO</option><option>PPO</option><option>Medicare</option><option>Medicaid</option><option>Other</option></select></td>
                <td className="p-2"><input className="bg-transparent w-full" value={i.notes} onChange={e=>update(i.id,'notes',e.target.value)} /></td>
                <td className="p-2">{countFor(i.name)}</td>
              </tr>
            ))}
            {list.length===0 && <tr><td colSpan="4" className="p-4 text-slate-400">No insurances yet</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="border-t border-slate-800 pt-4">
        <h3 className="text-sky-200 mb-2">Add Insurance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input placeholder="Insurance name" value={newIns.name} onChange={e=>setNewIns({...newIns, name:e.target.value})} className="bg-transparent p-2" />
          <select value={newIns.type} onChange={e=>setNewIns({...newIns, type:e.target.value})} className="bg-transparent p-2"><option>HMO</option><option>PPO</option><option>Medicare</option><option>Medicaid</option><option>Other</option></select>
          <input placeholder="Notes" value={newIns.notes} onChange={e=>setNewIns({...newIns, notes:e.target.value})} className="bg-transparent p-2" />
        </div>
        <div className="mt-3">
          <div className="text-slate-300 text-sm mb-1">Associate doctors (click to toggle)</div>
          <div className="flex flex-wrap gap-2">
            {doctors.map(d=> (
              <button key={d.id} onClick={()=>toggleDoctorInNew(d.id)} className={`px-2 py-1 rounded ${newIns.doctors&&newIns.doctors.includes(d.id)? 'bg-sky-500 text-white':'bg-slate-700 text-slate-200'}`}>{d.name}</button>
            ))}
            {doctors.length===0 && <div className="text-slate-500">No doctors yet</div>}
          </div>
        </div>
        <div className="mt-4"><button className="px-3 py-2 rounded bg-sky-400 text-navy-900 font-semibold" onClick={add}>+ Add Insurance</button></div>
      </div>
    </div>
  )
}

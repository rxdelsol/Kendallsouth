import React, { useEffect, useState } from 'react'
export default function InsurancesTable(){
  const empty = ()=>({ id:null, name:'', type:'PPO', doctor:'', doctorName:'', network:'In Network', expiration:'', notes:'' })
  const [list, setList] = useState([])
  const [doctors, setDoctors] = useState([])
  const [newIns, setNewIns] = useState(empty())
  const [showModal, setShowModal] = useState(false)
  useEffect(()=>{ setList(JSON.parse(localStorage.getItem('insuranceList')||'[]')); setDoctors(JSON.parse(localStorage.getItem('doctorsList')||'[]')) },[])
  useEffect(()=> localStorage.setItem('insuranceList', JSON.stringify(list)), [list])
  const add = ()=>{ if(!newIns.name.trim()) return alert('Enter insurance name'); const id=Date.now().toString(); const item={...newIns,id}; if(newIns.doctor){ const doc = (JSON.parse(localStorage.getItem('doctorsList')||'[]')||[]).find(d=>d.id===newIns.doctor); if(doc) item.doctorName = doc.name } setList(prev=> [...prev,item]); const byIns = JSON.parse(localStorage.getItem('doctorsByInsurance')||'{}'); if(item.doctor){ const entry = { doctorId: item.doctor, name: item.doctorName || '', expiration: item.expiration || null, notes: item.notes || '' }; byIns[item.name] = [...(byIns[item.name]||[]), entry]; localStorage.setItem('doctorsByInsurance', JSON.stringify(byIns)) } setNewIns(empty()); setShowModal(false) }
  const remove = id=>{
    const toDel = list.find(i=> i.id===id)
    setList(prev=> prev.filter(i=> i.id!==id))
    if(toDel){ const byIns = JSON.parse(localStorage.getItem('doctorsByInsurance')||'{}'); if(byIns[toDel.name]){ delete byIns[toDel.name]; localStorage.setItem('doctorsByInsurance', JSON.stringify(byIns)) } }
  }
  return (
    <div className="bg-card rounded p-4">
      <h2 className="text-sky-200 font-semibold mb-2">Insurances</h2>
      <div className="overflow-auto mb-4">
        <table className="min-w-full text-sm">
          <thead className="text-slate-300"><tr><th className="p-2">Name</th><th className="p-2">Type</th><th className="p-2">Doctor</th><th className="p-2">Network</th><th className="p-2">Expiration</th><th className="p-2">Notes</th><th className="p-2">Actions</th></tr></thead>
          <tbody className="text-slate-200">
            {list.map(i=> (
              <tr key={i.id} className="border-t border-slate-800">
                <td className="p-2">{i.name}</td>
                <td className="p-2">{i.type}</td>
                <td className="p-2">{i.doctorName||''}</td>
                <td className="p-2">{i.network==='In Network'? <span className="badge-in">In Network</span> : <span className="badge-out">Out of Network</span>}</td>
                <td className="p-2">{i.expiration? (new Date(i.expiration)).toLocaleDateString() : ''}</td>
                <td className="p-2">{i.notes}</td>
                <td className="p-2"><button className="text-red-500 hover:underline" onClick={()=>remove(i.id)}>Delete Insurance</button></td>
              </tr>
            ))}
            {list.length===0 && <tr><td colSpan="7" className="p-4 text-slate-400">No insurances yet</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-left"><button onClick={()=>setShowModal(true)} className="text-sky-300 hover:underline text-sm">+ Add Insurance</button></div>

      {showModal && (
        <div className="modal-backdrop"><div className="modal"><h3>Add Insurance</h3>
          <div className="grid grid-cols-1 gap-2 mt-2">
            <input placeholder="Insurance Name" value={newIns.name} onChange={e=>setNewIns({...newIns, name:e.target.value})} className="p-2 rounded bg-[#081424]" />
            <select value={newIns.type} onChange={e=>setNewIns({...newIns, type:e.target.value})} className="p-2 rounded bg-[#081424]"><option>HMO</option><option>PPO</option><option>Medicare</option><option>Medicaid</option><option>Other</option></select>
            <select value={newIns.doctor||''} onChange={e=>setNewIns({...newIns, doctor:e.target.value})} className="p-2 rounded bg-[#081424]"><option value="">Assign Doctor...</option>{doctors.map(d=> <option key={d.id} value={d.id}>{d.name}</option>)}</select>
            <select value={newIns.network} onChange={e=>setNewIns({...newIns, network:e.target.value})} className="p-2 rounded bg-[#081424]"><option>In Network</option><option>Out of Network</option></select>
            <input type="date" value={newIns.expiration||''} onChange={e=>setNewIns({...newIns, expiration:e.target.value})} className="p-2 rounded bg-[#081424]" />
            <textarea placeholder="Notes" value={newIns.notes} onChange={e=>setNewIns({...newIns, notes:e.target.value})} className="p-2 rounded bg-[#081424]" />
          </div>
          <div className="mt-4 flex justify-end gap-2"><button className="btn-cancel" onClick={()=>setShowModal(false)}>Cancel</button><button className="btn-red" onClick={add}>Save Insurance</button></div>
        </div></div>
      )}

    </div>
  )
}

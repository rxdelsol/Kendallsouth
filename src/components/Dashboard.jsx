import React, { useEffect, useState } from 'react'

function daysLeft(exp){ if(!exp) return null; const days=Math.ceil((new Date(exp)-new Date())/(1000*60*60*24)); return days }

export default function Dashboard(){
  const [doctors,setDoctors]=useState([])
  const [byIns,setByIns]=useState({})
  useEffect(()=>{ setDoctors(JSON.parse(localStorage.getItem('doctorsList')||'[]')); setByIns(JSON.parse(localStorage.getItem('doctorsByInsurance')||'{}')) },[])
  useEffect(()=>{ const onStorage=()=>{ setDoctors(JSON.parse(localStorage.getItem('doctorsList')||'[]')); setByIns(JSON.parse(localStorage.getItem('doctorsByInsurance')||'{}')) }; window.addEventListener('storage', onStorage); const id=setInterval(onStorage,60*1000); return ()=>{ window.removeEventListener('storage', onStorage); clearInterval(id) } },[])

  const ins = Object.keys(byIns)
  return (
    <div className="max-w-6xl mx-auto">
      <section className="mt-6">
        <h2 className="text-sky-200 text-lg font-semibold mb-2">Doctors Overview</h2>
        <div className="overflow-x-auto bg-card rounded p-4">
          <table className="min-w-full text-sm">
            <thead className="text-slate-300"><tr><th className="text-left p-2">Name</th><th className="p-2">NPI</th><th className="p-2">License</th><th className="p-2">CAQH</th><th className="p-2">DOB</th><th className="p-2">Taxonomy</th></tr></thead>
            <tbody className="text-slate-200">
              {doctors.map(d=> (
                <tr key={d.id} className="border-t border-slate-800"><td className="p-2">{d.name}</td><td className="p-2">{d.npi}</td><td className="p-2">{d.license}</td><td className="p-2">{d.caqh}</td><td className="p-2">{d.dob}</td><td className="p-2">{d.taxonomy}</td></tr>
              ))}
              {doctors.length===0 && <tr><td colSpan="6" className="p-4 text-slate-400">No doctors added yet</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sky-200 text-lg font-semibold mb-2">Expiration Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ins.length===0 && <div className="bg-card p-4 rounded text-slate-400">No insurance assignments yet</div>}
          {ins.map(k=> (
            <div key={k} className="bg-card p-4 rounded">
              <div className="flex justify-between items-center mb-2"><div className="font-semibold text-sky-200">{k}</div><div className="text-sm text-slate-400">{(byIns[k]||[]).length} doctors</div></div>
              <ul className="max-h-48 overflow-auto space-y-2">
                {(byIns[k]||[]).map((e,idx)=>{
                  const days = daysLeft(e.expiration)
                  const pct = days===null? 100 : (days>365?100: Math.max(0, Math.min(100, Math.round((days/365)*100))))
                  const color = days===null? 'bg-slate-600' : (days>90? 'bg-emerald-500' : (days>30? 'bg-amber-400' : (days>=0? 'bg-rose-500' : 'bg-rose-800')))
                  return (
                    <li key={idx} className="p-2 rounded flex flex-col">
                      <div className="flex justify-between items-start"><div><div className="font-semibold text-sky-100">{e.name}</div><div className="text-xs text-slate-400">{e.notes}</div></div><div className="text-right"><div className="text-sm text-slate-200">{e.expiration? (new Date(e.expiration)).toLocaleDateString('en-US') : 'No date'}</div><div className="text-xs text-sky-200">{days===null? 'No date' : (days<0? 'Expired' : `${days} days`)}</div></div></div>
                      <div className="mt-2 w-full bg-slate-700 h-2 rounded overflow-hidden"><div className={`${color} h-2`} style={{width: pct+'%'}} title={e.expiration? (new Date(e.expiration)).toLocaleDateString('en-US') : ''}></div></div>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

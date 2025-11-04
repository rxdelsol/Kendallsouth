import React, { useEffect, useState } from 'react'

export default function Dashboard(){
  const [doctorsByIns, setDoctorsByIns] = useState({})
  const [doctors, setDoctors] = useState([])

  useEffect(()=>{
    setDoctors(JSON.parse(localStorage.getItem('doctorsList')||'[]'))
    setDoctorsByIns(JSON.parse(localStorage.getItem('doctorsByInsurance')||'{}'))
  },[])

  useEffect(()=>{
    const onStorage = ()=>{
      setDoctors(JSON.parse(localStorage.getItem('doctorsList')||'[]'))
      setDoctorsByIns(JSON.parse(localStorage.getItem('doctorsByInsurance')||'{}'))
    }
    window.addEventListener('storage', onStorage)
    const id = setInterval(onStorage, 60*1000)
    return ()=>{ window.removeEventListener('storage', onStorage); clearInterval(id) }
  },[])

  // helper to compute days left
  function daysLeft(exp){
    if(!exp) return null
    const days = Math.ceil((new Date(exp) - new Date())/(1000*60*60*24))
    return days
  }

  const insurances = Object.keys(doctorsByIns)
  return (
    <div className="max-w-6xl mx-auto">
      <section className="mt-6">
        <h2 className="text-sky-200 text-lg font-semibold mb-2">Doctors Overview</h2>
        <div className="overflow-x-auto bg-card rounded p-4">
          <table className="min-w-full text-sm">
            <thead className="text-slate-300">
              <tr><th className="text-left p-2">Name</th><th className="p-2">NPI</th><th className="p-2">License</th><th className="p-2">CAQH</th><th className="p-2">DOB</th><th className="p-2">Taxonomy</th></tr>
            </thead>
            <tbody className="text-slate-200">
              {doctors.map(d=> (
                <tr key={d.id} className="border-t border-slate-800">
                  <td className="p-2">{d.name}</td>
                  <td className="p-2">{d.npi}</td>
                  <td className="p-2">{d.license}</td>
                  <td className="p-2">{d.caqh}</td>
                  <td className="p-2">{d.dob}</td>
                  <td className="p-2">{d.taxonomy}</td>
                </tr>
              ))}
              {doctors.length===0 && <tr><td colSpan="6" className="p-4 text-slate-400">No doctors added yet</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sky-200 text-lg font-semibold mb-2">Expiration Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insurances.length===0 && <div className="bg-card p-4 rounded text-slate-400">No insurance assignments yet</div>}
          {insurances.map(ins=> (
            <div key={ins} className="bg-card p-4 rounded">
              <div className="flex justify-between items-center mb-2">
                <div className="font-semibold text-sky-200">{ins}</div>
                <div className="text-sm text-slate-400">{(doctorsByIns[ins]||[]).length} doctors</div>
              </div>
              <ul className="max-h-48 overflow-auto space-y-2">
                {(doctorsByIns[ins]||[]).map((entry,idx)=>{
                  const days = daysLeft(entry.expiration)
                  const status = days===null? 'none' : (days<0? 'expired' : (days<=30? 'danger' : (days<=90? 'warn' : 'ok')))
                  return (
                    <li key={idx} className={`p-2 rounded flex justify-between items-start ${status==='warn' ? 'bg-amber-800/10 border-l-4 border-amber-400' : ''} ${status==='danger' ? 'bg-red-800/10 border-l-4 border-red-400' : ''} ${status==='expired' ? 'bg-red-900/10 border-l-4 border-red-600' : ''}`}>
                      <div>
                        <div className="font-semibold text-sky-100">{entry.name}</div>
                        <div className="text-xs text-slate-400">{entry.notes}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-200">{entry.expiration||'No date'}</div>
                        <div className="text-xs text-sky-200">{days===null? 'No date' : (days<0? 'Expired' : `${days} days`)}</div>
                      </div>
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

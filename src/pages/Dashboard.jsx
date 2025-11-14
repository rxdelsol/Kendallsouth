import React, { useEffect, useState } from 'react'

export default function Dashboard(){
  const [doctors, setDoctors] = useState([])
  const [insurances, setInsurances] = useState([])
  const [filterDoctor, setFilterDoctor] = useState('All')
  const [filterInsurance, setFilterInsurance] = useState('All')
  const [filterType, setFilterType] = useState('All')
  const [filterNetwork, setFilterNetwork] = useState('All')

  useEffect(() => { 
    setDoctors(JSON.parse(localStorage.getItem('doctorsList') || '[]')) 
    setInsurances(JSON.parse(localStorage.getItem('insuranceList') || '[]')) 
  }, [])

  useEffect(() => { 
    const onStorage = () => { 
      setDoctors(JSON.parse(localStorage.getItem('doctorsList') || '[]')) 
      setInsurances(JSON.parse(localStorage.getItem('insuranceList') || '[]')) 
    } 
    window.addEventListener('storage', onStorage) 
    return () => window.removeEventListener('storage', onStorage) 
  }, [])

  const getDaysLeft = (date) => { 
    if (!date) return null 
    const diff = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24)) 
    return diff 
  }

  const allDoctors = ['All', ...doctors.map(d => d.name)]
  const allInsurances = ['All', ...insurances.map(i => i.name)]
  const allTypes = ['All', ...Array.from(new Set(insurances.map(i => i.type).filter(Boolean)))]
  const allNetworks = ['All', 'In Network', 'Out of Network']

  const rows = insurances.map(i => {
    const docName = i.doctorName || ((doctors.find(d => d.id === i.doctor) || {}).name || '')
    const days = getDaysLeft(i.expiration)
    return { 
      doctor: docName, 
      insurance: i.name, 
      type: i.type, 
      network: i.network, 
      expiration: i.expiration, 
      days 
    }
  }).filter(r => 
    (filterDoctor === 'All' || r.doctor === filterDoctor) && 
    (filterInsurance === 'All' || r.insurance === filterInsurance) && 
    (filterType === 'All' || r.type === filterType) &&
    (filterNetwork === 'All' || r.network === filterNetwork)
  )

  rows.sort((a, b) => { 
    if (a.days === null) return 1 
    if (b.days === null) return -1 
    return a.days - b.days 
  })

  const inNetworkCount = insurances.filter(i => i.network === 'In Network').length
  const outNetworkCount = insurances.filter(i => i.network === 'Out of Network').length

  return (
    <div className="max-w-6xl mx-auto">
      <section className="mt-6">
        <h2 className="text-sky-200 text-lg font-semibold mb-2">
          Insurance Expiration Summary
        </h2>

        <div className="bg-card rounded p-4 mb-4">

          <div className="flex gap-6 mb-4">
            <div className="flex-1">
              <p className="text-xs text-slate-200 mb-1">In Network</p>
              <p className="text-2xl font-bold text-emerald-300">
                {inNetworkCount}
              </p>
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-200 mb-1">Out of Network</p>
              <p className="text-2xl font-bold text-red-300">
                {outNetworkCount}
              </p>
            </div>
          </div>

          <div className="flex gap-3 mb-4 text-sm">
            <select 
              value={filterDoctor} 
              onChange={e => setFilterDoctor(e.target.value)} 
              className="p-2 rounded bg-[#1e3d66] text-slate-100 border border-slate-600"
            >
              {allDoctors.map((d, idx) => (
                <option key={idx} value={d}>{d}</option>
              ))}
            </select>

            <select 
              value={filterInsurance} 
              onChange={e => setFilterInsurance(e.target.value)} 
              className="p-2 rounded bg-[#1e3d66] text-slate-100 border border-slate-600"
            >
              {allInsurances.map((i, idx) => (
                <option key={idx} value={i}>{i}</option>
              ))}
            </select>

            <select 
              value={filterType} 
              onChange={e => setFilterType(e.target.value)} 
              className="p-2 rounded bg-[#1e3d66] text-slate-100 border border-slate-600"
            >
              {allTypes.map((t, idx) => (
                <option key={idx} value={t}>{t}</option>
              ))}
            </select>

            <select
              value={filterNetwork}
              onChange={e => setFilterNetwork(e.target.value)}
              className="p-2 rounded bg-[#1e3d66] text-slate-100 border border-slate-600"
            >
              {allNetworks.map((n, idx) => (
                <option key={idx} value={n}>{n}</option>
              ))}
            </select>

            <div style={{ flex: 1 }} />
            <div className="text-sm text-slate-200">
              Showing {rows.length} records
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-slate-100 bg-[#1b355a]">
                <tr>
                  <th className="p-2 text-left">Doctor Name</th>
                  <th className="p-2 text-left">Insurance Name</th>
                  <th className="p-2 text-left">Type</th>
                  <th className="p-2 text-left">Network</th>
                  <th className="p-2 text-left">Expiration Date</th>
                  <th className="p-2 text-left">Days Left</th>
                </tr>
              </thead>
              <tbody className="text-slate-100">
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-slate-200">
                      No records found
                    </td>
                  </tr>
                )}

                {rows.map((r, idx) => {
                  const cls = r.days === null
                    ? ''
                    : (r.days < 0
                      ? 'highlight-red'
                      : (r.days <= 30
                        ? 'highlight-red'
                        : (r.days <= 90
                          ? 'highlight-yellow'
                          : ''
                        )))

                  return (
                    <tr key={idx} className={`border-t border-slate-600 ${cls}`}>
                      <td className="p-2">{r.doctor || 'Unassigned'}</td>
                      <td className="p-2">{r.insurance}</td>
                      <td className="p-2">{r.type}</td>

                      <td className="p-2">
                        {r.network === 'In Network' ? (
                          <span className="badge-in">In Network</span>
                        ) : r.network === 'Out of Network' ? (
                          <span className="badge-out">Out of Network</span>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="p-2">
                        {r.expiration
                          ? (new Date(r.expiration)).toLocaleDateString()
                          : 'No date'}
                      </td>
                      <td className="p-2">
                        {r.days === null
                          ? 'No date'
                          : (r.days < 0 ? 'Expired' : `${r.days} days`)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}

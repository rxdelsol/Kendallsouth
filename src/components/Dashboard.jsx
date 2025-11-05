import React, { useEffect, useState } from 'react'
import { exportDashboardPDF } from '../utils/pdfExport'

export default function Dashboard(){
  const [doctors, setDoctors] = useState([])
  const [insurances, setInsurances] = useState([])
  const [filterDoctor, setFilterDoctor] = useState('All')
  const [filterInsurance, setFilterInsurance] = useState('All')
  const [filterType, setFilterType] = useState('All')
  const [lastUpdated, setLastUpdated] = useState('')

  useEffect(()=>{ setDoctors(JSON.parse(localStorage.getItem('doctorsList')||'[]')); setInsurances(JSON.parse(localStorage.getItem('insuranceList')||'[]')); setLastUpdated(new Date().toLocaleString('en-US',{ month:'long', day:'numeric', year:'numeric', hour:'numeric', minute:'2-digit' })); },[])

  const getDaysLeft = (date)=>{ if(!date) return null; const diff = Math.ceil((new Date(date) - new Date())/(1000*60*60*24)); return diff }

  const allDoctors = ['All', ...doctors.map(d=>d.name)]
  const allInsurances = ['All', ...insurances.map(i=>i.name)]
  const allTypes = ['All', ...Array.from(new Set(insurances.map(i=>i.type).filter(Boolean)))]

  const rows = insurances.map(i=>{
    const docName = i.doctorName || ((doctors.find(d=>d.id===i.doctor)||{}).name||'')
    const days = getDaysLeft(i.expiration)
    return { doctor: docName, insurance: i.name, type: i.type, expiration: i.expiration, days, notes: i.notes }
  }).filter(r=> (filterDoctor==='All' || r.doctor===filterDoctor) && (filterInsurance==='All' || r.insurance===filterInsurance) && (filterType==='All' || r.type===filterType))

  rows.sort((a,b)=>{ if(a.days===null) return 1; if(b.days===null) return -1; return a.days - b.days })

  const exportVisible = ()=> exportDashboardPDF(rows)

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
        <h2 style={{color:'#93c5fd'}}>Insurance Expiration Summary</h2>
        <div style={{textAlign:'right'}}>
          <div className="last-updated"><strong>Last updated:</strong> {lastUpdated}</div>
          <div style={{marginTop:8}}><button className="btn" onClick={exportVisible}>Export PDF</button></div>
        </div>
      </div>

      <div style={{background:'#0d1626', padding:12, borderRadius:8}}>
        <div style={{display:'flex', gap:8, marginBottom:12}}>
          <select value={filterDoctor} onChange={e=>setFilterDoctor(e.target.value)} style={{padding:8}}>
            {allDoctors.map((d,idx)=>(<option key={idx} value={d}>{d}</option>))}
          </select>
          <select value={filterInsurance} onChange={e=>setFilterInsurance(e.target.value)} style={{padding:8}}>
            {allInsurances.map((i,idx)=>(<option key={idx} value={i}>{i}</option>))}
          </select>
          <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={{padding:8}}>
            {allTypes.map((t,idx)=>(<option key={idx} value={t}>{t}</option>))}
          </select>
          <div style={{flex:1}} />
          <div style={{color:'#9ca3af'}}>Showing {rows.length} records</div>
        </div>

        <div style={{overflowX:'auto'}}>
          <table className="table">
            <thead>
              <tr><th>Doctor Name</th><th>Insurance Name</th><th>Type</th><th>Expiration Date</th><th>Days Left</th><th>Notes</th></tr>
            </thead>
            <tbody>
              {rows.length===0 && (<tr><td colSpan={6} style={{padding:12,color:'#9ca3af'}}>No records found</td></tr>)}
              {rows.map((r,idx)=>{
                return (
                  <tr key={idx} style={{borderTop:'1px solid rgba(255,255,255,0.04)'}}>
                    <td>{r.doctor||'Unassigned'}</td>
                    <td>{r.insurance}</td>
                    <td>{r.type}</td>
                    <td>{r.expiration? (new Date(r.expiration)).toLocaleDateString() : 'No date'}</td>
                    <td>{r.days===null? 'No date' : (r.days<0? 'Expired' : `${r.days} days`)}</td>
                    <td>{r.notes}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

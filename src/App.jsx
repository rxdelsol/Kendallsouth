import React, { useEffect, useState, useRef } from 'react'
import Header from './components/Header.jsx'
import InsurancesModal from './components/InsurancesModal.jsx'
import DoctorsModal from './components/DoctorsModal.jsx'

export default function App(){
  const [showIns, setShowIns] = useState(false)
  const [showDocs, setShowDocs] = useState(false)
  const [version, setVersion] = useState(0)
  const fileRef = useRef()

  const handleApply = ()=>{ setVersion(v=>v+1); alert('Applied and dashboard updated.') }
  const handleClear = ()=>{
    if(!confirm('Clear all data?')) return
    localStorage.removeItem('doctorsByInsurance')
    localStorage.removeItem('insuranceList')
    setVersion(v=>v+1)
    alert('Data cleared.')
  }
  const handleReload = ()=>{ setVersion(v=>v+1); alert('Reloaded from storage.') }
  const handleCSV = ()=>{
    const raw = JSON.parse(localStorage.getItem('doctorsByInsurance')||'{}')
    const rows = [['Insurance','Doctor','Expiration','Notes']]
    Object.keys(raw).forEach(ins=> raw[ins].forEach(d=> rows.push([ins, d.name, d.expiration||'', d.notes||''])))
    const csv = rows.map(r=> r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n')
    const blob = new Blob([csv], {type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='export.csv'; a.click(); URL.revokeObjectURL(url)
  }
  const handleBackup = ()=>{
    const obj = { doctorsByInsurance: JSON.parse(localStorage.getItem('doctorsByInsurance')||'{}'), insuranceList: JSON.parse(localStorage.getItem('insuranceList')||'[]') }
    const blob = new Blob([JSON.stringify(obj,null,2)], {type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='backup.json'; a.click(); URL.revokeObjectURL(url)
  }
  const handleRestoreClick = ()=> fileRef.current && fileRef.current.click()
  const handleRestore = e => {
    const f = e.target.files && e.target.files[0]; if(!f) return; const reader = new FileReader(); reader.onload = ()=>{ try{ const obj=JSON.parse(reader.result); if(obj.doctorsByInsurance) localStorage.setItem('doctorsByInsurance', JSON.stringify(obj.doctorsByInsurance)); if(obj.insuranceList) localStorage.setItem('insuranceList', JSON.stringify(obj.insuranceList)); setVersion(v=>v+1); alert('Restore completed.') }catch(err){ alert('Invalid file.') } }; reader.readAsText(f)
  }

  return (
    <div>
      <Header />
      <div className="actions-bar" role="toolbar" aria-label="Actions">
        <button className="action-btn" onClick={handleApply}>Apply</button>
        <button className="action-btn" onClick={handleClear}>Clear</button>
        <button className="action-btn primary" onClick={()=>setShowIns(true)}>+ Add</button>
        <button className="action-btn" onClick={handleReload}>Reload</button>
        <button className="action-btn" onClick={handleCSV}>CSV</button>
        <button className="action-btn" onClick={handleBackup}>Backup</button>
        <button className="action-btn" onClick={handleRestoreClick}>Restore</button>
        <div style={{flex:1}} />
        <button className="action-btn" onClick={()=>setShowIns(true)}>Insurances</button>
        <button className="action-btn" onClick={()=>setShowDocs(true)}>Doctors</button>
      </div>

      <main style={{padding:20}}>
        <div className="table-placeholder">
          This is your main table (keep your existing content). Use the Doctors modal to manage doctors and the Insurances modal to manage insurers.
        </div>
        <section style={{marginTop:20}}>
          <h3 style={{margin:'8px 24px', color:'#cfe9ff'}}>Expiration Dashboard</h3>
          <ExpirationDashboard key={version} />
        </section>
      </main>

      <input ref={fileRef} type="file" style={{display:'none'}} accept="application/json" onChange={handleRestore} />

      <InsurancesModal open={showIns} onClose={()=>{ setShowIns(false); setVersion(v=>v+1) }} />
      <DoctorsModal open={showDocs} onClose={()=>{ setShowDocs(false); setVersion(v=>v+1) }} />
    </div>
  )
}

// ExpirationDashboard component
function ExpirationDashboard(){
  const [data, setData] = useState({})
  useEffect(()=>{ setData(JSON.parse(localStorage.getItem('doctorsByInsurance')||'{}')) }, [])
  useEffect(()=>{
    const onStorage = ()=> setData(JSON.parse(localStorage.getItem('doctorsByInsurance')||'{}'))
    window.addEventListener('storage', onStorage)
    const id = setInterval(()=> setData(JSON.parse(localStorage.getItem('doctorsByInsurance')||'{}')), 60*1000)
    return ()=>{ window.removeEventListener('storage', onStorage); clearInterval(id) }
  },[])

  const ins = Object.keys(data)
  if(ins.length===0) return <div className="empty-card" style={{margin:'8px 24px'}}>No doctors/insurances yet</div>
  return (
    <div className="expiration-grid">
      {ins.map(k=> (
        <div key={k} className="exp-card">
          <div className="exp-card-header">
            <strong>{k}</strong>
            <div className="exp-meta">{(data[k]||[]).length} doctors</div>
          </div>
          <ul className="exp-list">
            {(data[k]||[]).map((d,idx)=>{
              const exp = d.expiration; let days = null; if(exp) days = Math.ceil((new Date(exp) - new Date())/(1000*60*60*24));
              const status = days===null ? 'none' : (days<0 ? 'expired' : (days<=30 ? 'danger' : (days<=90 ? 'warn' : 'ok')))
              return (
                <li key={idx} className={`exp-item ${status}`}>
                  <div className="exp-name">{d.name}</div>
                  <div className="exp-info">
                    <div className="exp-days">{exp ? (days<0 ? 'Expired' : `${days} days`) : 'No date'}</div>
                    <div className="exp-notes">{d.notes || ''}</div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}

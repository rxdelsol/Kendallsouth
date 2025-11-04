import React, { useEffect, useState, useRef } from 'react'
import Header from './components/Header.jsx'
import InsurancesModal from './components/InsurancesModal.jsx'
import DoctorsTable from './components/DoctorsTable.jsx'
import DoctorsModal from './components/DoctorsModal.jsx'

export default function App(){
  const [showIns, setShowIns] = useState(false)
  const [showDocsModal, setShowDocsModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const fileRef = useRef()

  const reload = ()=> setRefreshKey(k=>k+1)

  const handleApply = ()=>{ reload(); alert('Applied - dashboard updated.') }
  const handleClear = ()=>{
    if(!confirm('Clear all data? This will remove doctors and insurance assignments.')) return
    localStorage.removeItem('doctorsList'); localStorage.removeItem('doctorsByInsurance'); localStorage.removeItem('insuranceList')
    reload(); alert('Data cleared.')
  }
  const handleReload = ()=>{ reload(); alert('Reloaded from storage.') }

  const exportCSV = ()=>{
    const doctors = JSON.parse(localStorage.getItem('doctorsList')||'[]')
    const byIns = JSON.parse(localStorage.getItem('doctorsByInsurance')||'{}')
    const rows = [['Doctor Name','NPI','License','CAQH','Medicaid','Medicare','DOB','Taxonomy','Insurance','Expiration','Notes','Days Left']]
    Object.keys(byIns).forEach(ins=> byIns[ins].forEach(dRef=>{
      const doc = doctors.find(x=> x.id===dRef.doctorId)
      const exp = dRef.expiration||''; const notes = dRef.notes||''
      const days = exp ? Math.ceil((new Date(exp)-new Date())/(1000*60*60*24)) : ''
      rows.push([doc?.name||'', doc?.npi||'', doc?.license||'', doc?.caqh||'', doc?.medicaid||'', doc?.medicare||'', doc?.dob||'', doc?.taxonomy||'', ins, exp, notes, days])
    }))
    const csv = rows.map(r=> r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n')
    const blob = new Blob([csv], {type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='kendall_export.csv'; a.click(); URL.revokeObjectURL(url)
  }

  const handleBackup = ()=>{
    const obj = { doctorsList: JSON.parse(localStorage.getItem('doctorsList')||'[]'), doctorsByInsurance: JSON.parse(localStorage.getItem('doctorsByInsurance')||'{}'), insuranceList: JSON.parse(localStorage.getItem('insuranceList')||'[]') }
    const blob = new Blob([JSON.stringify(obj,null,2)], {type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='kendall_backup.json'; a.click(); URL.revokeObjectURL(url)
  }
  const handleRestoreClick = ()=> fileRef.current && fileRef.current.click()
  const handleRestore = e=>{
    const f = e.target.files && e.target.files[0]; if(!f) return; const reader=new FileReader(); reader.onload = ()=>{ try{ const obj = JSON.parse(reader.result); if(obj.doctorsList) localStorage.setItem('doctorsList', JSON.stringify(obj.doctorsList)); if(obj.doctorsByInsurance) localStorage.setItem('doctorsByInsurance', JSON.stringify(obj.doctorsByInsurance)); if(obj.insuranceList) localStorage.setItem('insuranceList', JSON.stringify(obj.insuranceList)); reload(); alert('Restore completed.') }catch(err){ alert('Invalid file') } }; reader.readAsText(f)
  }

  return (
    <div>
      <Header />
      <div className="actions-bar" role="toolbar" aria-label="Actions">
        <button className="action-btn" onClick={handleApply}>Apply</button>
        <button className="action-btn" onClick={handleClear}>Clear</button>
        <button className="action-btn primary" onClick={()=>setShowDocsModal(true)}>+ Add Doctor</button>
        <button className="action-btn" onClick={handleReload}>Reload</button>
        <button className="action-btn" onClick={exportCSV}>CSV</button>
        <button className="action-btn" onClick={handleBackup}>Backup</button>
        <button className="action-btn" onClick={handleRestoreClick}>Restore</button>
        <div style={{flex:1}} />
        <button className="action-btn" onClick={()=>setShowIns(true)}>Insurances</button>
        <button className="action-btn" onClick={()=>setShowDocsModal(true)}>Doctors</button>
      </div>

      <main style={{padding:20}}>
        <DoctorsTable key={refreshKey} onChange={()=>reload()} />
        <section style={{marginTop:20}}>
          <h3 style={{margin:'8px 24px', color:'#cfe9ff'}}>Expiration Dashboard</h3>
          <ExpirationDashboard />
        </section>
      </main>

      <input ref={fileRef} type="file" style={{display:'none'}} accept="application/json" onChange={handleRestore} />

      <InsurancesModal open={showIns} onClose={()=>{ setShowIns(false); reload(); }} />
      <DoctorsModal open={showDocsModal} onClose={()=>{ setShowDocsModal(false); reload(); }} />
    </div>
  )
}

// ExpirationDashboard component
function ExpirationDashboard(){
  const [data, setData] = useState({})
  useEffect(()=>{ setData(JSON.parse(localStorage.getItem('doctorsByInsurance')||'{}')) }, [])
  useEffect(()=>{
    const onStorage = ()=> setData(JSON.parse(localStorage.getItem('doctorsByInsurance')||'{}'))
    window.addEventListener('storage', onStorage); const id=setInterval(()=> setData(JSON.parse(localStorage.getItem('doctorsByInsurance')||'{}')), 60*1000)
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

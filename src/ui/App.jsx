import React, { useEffect, useRef, useState } from 'react'
import { listCreds, addCred, updateCred, deleteCred, exportCSV } from '../store/db'
import { requestPermission, startScheduler, openMailtoDraft } from '../utils/notifications'
import { lookupNPI } from '../utils/npi'
import { exportJSON, importJSON } from '../utils/backup'
import './styles.css'

const LOGO = '/icons/logo.png'
function daysClass(days){ if(days===null||days===undefined) return 'muted'; if(days<0) return 'danger'; if(days<=30) return 'warn'; return 'good' }

export default function App(){
  const [rows, setRows] = useState([])
  const [filter, setFilter] = useState('')
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState(null)
  const [loadingNPI, setLoadingNPI] = useState(false)
  const fileRef = useRef(null)

  const empty = {provider:'', credential_type:'', issue_date:'', expiry_date:'', notify_email:'', npi:'', notes:''}
  const [form, setForm] = useState(empty)

  async function refresh(){ setRows(await listCreds(filter)) }
  useEffect(()=>{ requestPermission(); startScheduler(); refresh() }, [filter])

  async function doImport(file){
    try{
      const count = await importJSON(file)
      alert(`Imported ${count} items`)
      await refresh()
    }catch(e){ alert('Import failed: '+e.message) }
  }

  return (<>
    <header>
      <div className="brand">
        <img src={LOGO} alt="Kendall South Medical Center logo"/>
        <div>
          <h1>Kendall South Medical Center — Provider Credential Tracker</h1>
          <div className="muted" style={{fontSize:12}}>Installable PWA — Website only (no backend)</div>
        </div>
      </div>
      <div className="toolbar">
        <button className="secondary" onClick={()=>window.location.reload()}>🔄 Refresh</button>
      </div>
    </header>

    <div className="container">
      <div className="toolbar" style={{marginBottom:12}}>
        <input placeholder="Filter..." value={filter} onChange={e=>setFilter(e.target.value)} />
        <button onClick={()=>setFilter(filter)}>Apply</button>
        <button className="secondary" onClick={()=>setFilter('')}>Clear</button>
        <button onClick={()=>{ setEdit(null); setForm(empty); setOpen(true) }}>➕ Add</button>
        <button className="secondary" onClick={refresh}>🔄 Reload</button>
        <button className="secondary" onClick={async()=>exportCSV(await listCreds(filter))}>⬇️ CSV</button>
        <button className="secondary" onClick={()=>exportJSON()}>💾 Backup</button>
        <input ref={fileRef} type="file" accept="application/json" style={{display:'none'}} onChange={e=>{ const f=e.target.files?.[0]; if(f) doImport(f); e.target.value=''; }} />
        <button className="secondary" onClick={()=>fileRef.current?.click()}>📥 Restore</button>
      </div>

      <table>
        <thead>
          <tr><th>ID</th><th>Provider</th><th>Type</th><th>Issued</th><th>Expires</th><th>Days</th><th>Notify Email</th><th>NPI</th><th></th></tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.id}</td><td>{r.provider}</td><td>{r.credential_type}</td>
              <td className="muted">{r.issue_date||''}</td><td>{r.expiry_date||''}</td>
              <td className={daysClass(r.days_left)}>{r.days_left ?? ''}</td><td>{r.notify_email||''}</td>
              <td className="muted">{r.npi||''}</td>
              <td className="row-actions">
                <button onClick={()=>{ setEdit(r); setForm(r); setOpen(true) }}>✏️</button>
                <button onClick={async()=>{ if(confirm('Delete?')){ await deleteCred(r.id); await refresh(); }}}>🗑️</button>
                {r.notify_email && r.expiry_date && (<button className="secondary" onClick={()=>openMailtoDraft({ to:r.notify_email, provider:r.provider, credential_type:r.credential_type, expiry_date:r.expiry_date, days_left:r.days_left })}>✉️ Email draft</button>)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {open && (
      <div className="modal-backdrop" style={{display:'flex'}}>
        <div className="modal">
          <h2>{edit ? 'Edit' : 'Add'} credential</h2>
          <div className="grid">
            <div><label>Provider</label><input value={form.provider} onChange={e=>setForm({...form, provider:e.target.value})}/></div>
            <div><label>Type</label><input value={form.credential_type} onChange={e=>setForm({...form, credential_type:e.target.value})}/></div>
            <div><label>Issued (YYYY-MM-DD)</label><input value={form.issue_date} onChange={e=>setForm({...form, issue_date:e.target.value})}/></div>
            <div><label>Expires (YYYY-MM-DD)</label><input value={form.expiry_date} onChange={e=>setForm({...form, expiry_date:e.target.value})}/></div>
            <div><label>Notify Email (optional)</label><input value={form.notify_email||''} onChange={e=>setForm({...form, notify_email:e.target.value})}/></div>
            <div><label>NPI (10 digits)</label>
              <div style={{display:'flex', gap:8}}>
                <input value={form.npi||''} onChange={e=>setForm({...form, npi:e.target.value})}/>
                <button className="secondary" disabled={loadingNPI} onClick={async()=>{
                  if(!form.npi) return alert('Enter an NPI (10 digits)')
                  setLoadingNPI(true)
                  try{
                    const data = await lookupNPI(form.npi)
                    setForm({...form, provider: data.name || form.provider, npi: data.npi})
                    alert(`NPI found: ${data.name} (${data.taxonomy})`)
                  }catch(e){ alert('NPI lookup failed: '+e.message) }
                  finally{ setLoadingNPI(false) }
                }}>🔎 NPI Lookup</button>
              </div>
            </div>
            <div style={{gridColumn:'1/-1'}}><label>Notes</label><textarea rows={3} value={form.notes||''} onChange={e=>setForm({...form, notes:e.target.value})}/></div>
          </div>
          <footer style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:12}}>
            <button onClick={async()=>{
              if(!form.provider || !form.credential_type || !form.expiry_date){ alert('Provider, Type and Expires are required.'); return; }
              const re=/^\d{4}-\d{2}-\d{2}$/; if(form.issue_date && !re.test(form.issue_date)) return alert('Invalid Issued date'); if(!re.test(form.expiry_date)) return alert('Invalid Expires date');
              if(edit){ await updateCred(form.id, form) } else { await addCred(form) }
              setOpen(false); setEdit(null); await refresh()
            }}>Save</button>
            <button className="secondary" onClick={()=>{ setOpen(false); setEdit(null) }}>Cancel</button>
          </footer>
        </div>
      </div>
    )}
  </>)
}

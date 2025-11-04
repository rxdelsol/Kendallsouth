import React, { useEffect, useState } from 'react'
import './doctors.css'

const emptyDoctor = ()=>({ id: null, name:'', npi:'', license:'', caqh:'', medicaid:'', medicare:'', dob:'', taxonomy:'' })

export default function DoctorsTable({ onChange }){
  const [doctors, setDoctors] = useState([])
  const [editing, setEditing] = useState(null)
  const [newRow, setNewRow] = useState(emptyDoctor())

  useEffect(()=>{
    const raw = localStorage.getItem('doctorsList')||'[]'; setDoctors(JSON.parse(raw))
  },[])

  useEffect(()=> localStorage.setItem('doctorsList', JSON.stringify(doctors)), [doctors])

  const addDoctor = ()=>{
    if(!newRow.name.trim()) return alert('Enter doctor name')
    const id = Date.now().toString()
    const d = {...newRow, id}; setDoctors(prev=>[...prev,d]); setNewRow(emptyDoctor()); onChange && onChange()
  }

  const saveEdit = (id, field, value)=>{
    setDoctors(prev=> prev.map(d=> d.id===id? {...d, [field]: value}: d)); onChange && onChange()
  }

  const remove = id=>{ if(!confirm('Delete this doctor?')) return; setDoctors(prev=> prev.filter(d=> d.id!==id)); onChange && onChange() }

  return (
    <div style={{padding:'0 24px'}}>
      <h3 style={{color:'#cfe9ff'}}>Doctors</h3>
      <table className="doctors-table">
        <thead><tr><th>Name</th><th>NPI</th><th>License</th><th>CAQH</th><th>Medicaid</th><th>Medicare</th><th>DOB</th><th>Taxonomy</th><th>Actions</th></tr></thead>
        <tbody>
          {doctors.map(d=> (
            <tr key={d.id}>
              <td contentEditable suppressContentEditableWarning onBlur={e=>saveEdit(d.id,'name',e.target.innerText)}>{d.name}</td>
              <td contentEditable suppressContentEditableWarning onBlur={e=>saveEdit(d.id,'npi',e.target.innerText)}>{d.npi}</td>
              <td contentEditable suppressContentEditableWarning onBlur={e=>saveEdit(d.id,'license',e.target.innerText)}>{d.license}</td>
              <td contentEditable suppressContentEditableWarning onBlur={e=>saveEdit(d.id,'caqh',e.target.innerText)}>{d.caqh}</td>
              <td contentEditable suppressContentEditableWarning onBlur={e=>saveEdit(d.id,'medicaid',e.target.innerText)}>{d.medicaid}</td>
              <td contentEditable suppressContentEditableWarning onBlur={e=>saveEdit(d.id,'medicare',e.target.innerText)}>{d.medicare}</td>
              <td><input type="date" value={d.dob||''} onChange={e=>saveEdit(d.id,'dob',e.target.value)} /></td>
              <td contentEditable suppressContentEditableWarning onBlur={e=>saveEdit(d.id,'taxonomy',e.target.innerText)}>{d.taxonomy}</td>
              <td><button className="small-btn" onClick={()=>remove(d.id)}>Delete</button></td>
            </tr>
          ))}
          <tr>
            <td><input placeholder="Full name" value={newRow.name} onChange={e=>setNewRow({...newRow, name:e.target.value})} /></td>
            <td><input placeholder="NPI" value={newRow.npi} onChange={e=>setNewRow({...newRow, npi:e.target.value})} /></td>
            <td><input placeholder="License" value={newRow.license} onChange={e=>setNewRow({...newRow, license:e.target.value})} /></td>
            <td><input placeholder="CAQH" value={newRow.caqh} onChange={e=>setNewRow({...newRow, caqh:e.target.value})} /></td>
            <td><input placeholder="Medicaid" value={newRow.medicaid} onChange={e=>setNewRow({...newRow, medicaid:e.target.value})} /></td>
            <td><input placeholder="Medicare" value={newRow.medicare} onChange={e=>setNewRow({...newRow, medicare:e.target.value})} /></td>
            <td><input type="date" value={newRow.dob||''} onChange={e=>setNewRow({...newRow, dob:e.target.value})} /></td>
            <td><input placeholder="Taxonomy" value={newRow.taxonomy} onChange={e=>setNewRow({...newRow, taxonomy:e.target.value})} /></td>
            <td><button className="small-btn" onClick={addDoctor}>+ Add Doctor</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

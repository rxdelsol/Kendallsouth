import React, { useEffect, useState } from 'react'
export default function DoctorsTable(){
  const [doctors, setDoctors] = useState([])
  useEffect(()=> setDoctors(JSON.parse(localStorage.getItem('doctorsList')||'[]')), [])
  useEffect(()=> localStorage.setItem('doctorsList', JSON.stringify(doctors)), [doctors])
  const addDummy = ()=> setDoctors(prev=> [...prev, { id:Date.now().toString(), name:'New Doctor' }])
  const remove = id=> setDoctors(prev=> prev.filter(d=> d.id!==id))
  return (<div style={{background:'#0d1626',padding:12,borderRadius:8}}><h3>Doctors</h3><button className='btn' onClick={addDummy}>+ Add Doctor</button><div style={{marginTop:12}}><table className='table'><thead><tr><th>Name</th><th>Actions</th></tr></thead><tbody>{doctors.map(d=>(<tr key={d.id}><td>{d.name}</td><td><button onClick={()=>remove(d.id)} style={{color:'#f87171'}}>Delete</button></td></tr>))}{doctors.length===0 && <tr><td colSpan={2} style={{color:'#9ca3af'}}>No doctors yet</td></tr>}</tbody></table></div></div>)
}

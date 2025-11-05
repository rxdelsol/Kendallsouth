import React, { useEffect, useState } from 'react'
import { exportDashboardPDF } from '../utils/pdfExport'
export default function Dashboard(){
  const [doctors,setDoctors]=useState([]); const [insurances,setInsurances]=useState([]);
  const [filterDoctor,setFilterDoctor]=useState('All'); const [filterInsurance,setFilterInsurance]=useState('All'); const [filterType,setFilterType]=useState('All');
  useEffect(()=>{ setDoctors(JSON.parse(localStorage.getItem('doctorsList')||'[]')); setInsurances(JSON.parse(localStorage.getItem('insuranceList')||'[]')); },[]);
  useEffect(()=>{ localStorage.setItem('doctorsList', JSON.stringify(doctors)); },[doctors]);
  useEffect(()=>{ localStorage.setItem('insuranceList', JSON.stringify(insurances)); },[insurances]);
  const getDays=(d)=>{ if(!d) return null; return Math.ceil((new Date(d)-new Date())/(1000*60*60*24)); }
  const rows = insurances.map(i=>{ const docName = i.doctorName || ((doctors.find(d=>d.id===i.doctor)||{}).name||''); return { doctor:docName, insurance:i.name, type:i.type, expiration:i.expiration, days:getDays(i.expiration), notes:i.notes||'' } }).filter(r=> (filterDoctor==='All'||r.doctor===filterDoctor)&&(filterInsurance==='All'||r.insurance===filterInsurance)&&(filterType==='All'||r.type===filterType));
  const exportVisible=()=> exportDashboardPDF(rows);
  return (<div><div className='flex justify-between items-center'><h2>Insurance Expiration Summary</h2><button onClick={exportVisible}>Export PDF</button></div><div className='mt-4'><table><thead><tr><th>Doctor</th><th>Insurance</th><th>Type</th><th>Expiration</th><th>Days</th><th>Notes</th></tr></thead><tbody>{rows.length===0&&<tr><td colSpan=6>No records</td></tr>}{rows.map((r,i)=>(<tr key={i}><td>{r.doctor}</td><td>{r.insurance}</td><td>{r.type}</td><td>{r.expiration? new Date(r.expiration).toLocaleDateString(): 'No date'}</td><td>{r.days===null? 'No date': r.days+' days'}</td><td>{r.notes}</td></tr>))}</tbody></table></div></div>);
}

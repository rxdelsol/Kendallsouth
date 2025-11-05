import React, { useState } from 'react'
import Header from './components/Header.jsx'
import Dashboard from './components/Dashboard.jsx'
import DoctorsTable from './components/DoctorsTable.jsx'
import InsurancesTable from './components/InsurancesTable.jsx'
import FileManager from './components/FileManager.jsx'
export default function App(){ const [route,setRoute]=useState('dashboard'); return (<div className='container'><Header onNav={setRoute} /><div style={{display:'flex', justifyContent:'flex-end', gap:12}}><FileManager /></div><main style={{marginTop:16}}>{route==='dashboard'?<Dashboard/>:route==='doctors'?<DoctorsTable/>:<InsurancesTable/>}</main></div>)}

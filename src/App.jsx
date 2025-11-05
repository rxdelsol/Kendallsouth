import React, { useState } from 'react'
import Header from './components/Header.jsx'
import Dashboard from './components/Dashboard.jsx'
import FileManager from './components/FileManager.jsx'
export default function App(){ const [route,setRoute]=useState('dashboard'); return (<div><Header onNav={setRoute} /><div className='container mx-auto p-4'><FileManager />{route==='dashboard'&&<Dashboard />}</div></div>)}

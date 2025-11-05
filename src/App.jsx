import React, { useState } from 'react'
import Header from './components/Header.jsx'
import Dashboard from './components/Dashboard.jsx'
import DoctorsTable from './components/DoctorsTable.jsx'
import InsurancesModal from './components/InsurancesModal.jsx'
import DoctorsModal from './components/DoctorsModal.jsx'
import FileManager from './components/FileManager.jsx'

export default function App(){
  const [route, setRoute] = useState('dashboard')
  const [showIns, setShowIns] = useState(false)
  const [showDocsModal, setShowDocsModal] = useState(false)

  return (
    <div className="min-h-screen">
      <Header onNav={setRoute} />
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex gap-3 mt-4 items-center">
          <button className="px-3 py-2 rounded bg-card text-sky-300" onClick={()=>setShowIns(true)}>Insurances</button>
          <button className="px-3 py-2 rounded bg-card text-sky-300" onClick={()=>setShowDocsModal(true)}>Doctors</button>
          <div style={{flex:1}} />
          <FileManager />
        </div>
        <main className="mt-6">
          {route==='dashboard' && <Dashboard />}
          {route==='doctors' && <DoctorsTable />}
          {route==='insurances' && <div className="bg-card p-4 rounded text-slate-300">Manage insurances using the Insurances modal.</div>}
        </main>
      </div>

      <InsurancesModal open={showIns} onClose={()=>setShowIns(false)} />
      <DoctorsModal open={showDocsModal} onClose={()=>setShowDocsModal(false)} />
    </div>
  )
}

import React, { useState } from 'react'
import Header from './components/Header.jsx'
import Dashboard from './components/Dashboard.jsx'
import DoctorsTable from './components/DoctorsTable.jsx'
import InsurancesModal from './components/InsurancesModal.jsx'
import DoctorsModal from './components/DoctorsModal.jsx'

export default function App(){
  const [route, setRoute] = useState('dashboard') // dashboard | doctors | insurances
  const [showIns, setShowIns] = useState(false)
  const [showDocsModal, setShowDocsModal] = useState(false)
  const handleNav = r => setRoute(r)

  return (
    <div className="min-h-screen">
      <Header onNav={handleNav} />
      <div className="px-6">
        <div className="flex gap-3 mt-4">
          <button className="px-3 py-2 rounded bg-card text-sky-300" onClick={()=>setShowIns(true)}>Insurances</button>
          <button className="px-3 py-2 rounded bg-card text-sky-300" onClick={()=>setShowDocsModal(true)}>Doctors</button>
        </div>
        <main className="mt-6">
          {route==='dashboard' && <Dashboard />}
          {route==='doctors' && <DoctorsTable />}
          {route==='insurances' && <div><p className="text-slate-300">Manage insurances here or use the Insurances modal.</p></div>}
        </main>
      </div>

      <InsurancesModal open={showIns} onClose={()=>setShowIns(false)} />
      <DoctorsModal open={showDocsModal} onClose={()=>setShowDocsModal(false)} />
    </div>
  )
}

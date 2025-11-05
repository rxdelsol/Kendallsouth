import React, { useState } from 'react'
import Header from './components/Header.jsx'
import Dashboard from './components/Dashboard.jsx'
import DoctorsTable from './components/DoctorsTable.jsx'
import InsurancesTable from './components/InsurancesTable.jsx'
import FileManager from './components/FileManager.jsx'

export default function App(){
  const [route, setRoute] = useState('dashboard')
  return (
    <div className="min-h-screen">
      <Header onNav={setRoute} />
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex gap-3 mt-4 items-center">
          <div style={{flex:1}} />
          <FileManager />
        </div>
        <main className="mt-6">
          {route==='dashboard' && <Dashboard />}
          {route==='doctors' && <DoctorsTable />}
          {route==='insurances' && <InsurancesTable />}
        </main>
      </div>
    </div>
  )
}

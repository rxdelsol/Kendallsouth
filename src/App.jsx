import React, { useState } from 'react'
import Shell from './components/Shell.jsx'
import Dashboard from './components/Dashboard.jsx'
import DoctorsTable from './components/DoctorsTable.jsx'
import InsurancePayers from './components/InsurancePayers.jsx'
import ProviderLookup from './components/ProviderLookup.jsx'
import EligibilityCheck from './components/EligibilityCheck.jsx'

export default function App(){
  const [route, setRoute] = useState('dashboard')
  return (
    <Shell route={route} onNav={setRoute}>
      {route==='dashboard' && <Dashboard />}
      {route==='doctors' && <DoctorsTable />}
      {route==='insurances' && <InsurancePayers />}
      {route==='provider' && <ProviderLookup />}
      {route==='eligibility' && <EligibilityCheck />}
    </Shell>
  )
}

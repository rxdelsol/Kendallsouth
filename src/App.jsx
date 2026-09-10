import React, { useState } from 'react'
import Shell from './components/Shell.jsx'
import Dashboard from './components/Dashboard.jsx'
import DoctorsTable from './components/DoctorsTable.jsx'
import InsurancePayers from './components/InsurancePayers.jsx'
import ProviderLookup from './components/ProviderLookup.jsx'
import EligibilityCheck from './components/EligibilityCheck.jsx'
import Research from './components/Research.jsx'
import StudyFiles from './components/StudyFiles.jsx'
import Opportunities from './components/Opportunities.jsx'
import Reports from './components/Reports.jsx'
import DataManagement from './components/DataManagement.jsx'
import Settings from './components/Settings.jsx'

export default function App(){
  const [route, setRoute] = useState('dashboard')
  return (
    <Shell route={route} onNav={setRoute}>
      {route==='dashboard' && <Dashboard onNav={setRoute} />}
      {route==='doctors' && <DoctorsTable />}
      {route==='insurances' && <InsurancePayers />}
      {route==='provider' && <ProviderLookup />}
      {route==='matrix' && <EligibilityCheck />}
      {route==='research' && <Research />}
      {route==='files' && <StudyFiles />}
      {route==='opps' && <Opportunities />}
      {route==='reports' && <Reports />}
      {route==='data' && <DataManagement />}
      {route==='settings' && <Settings />}
    </Shell>
  )
}

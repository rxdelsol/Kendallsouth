import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

export default function App() {
  const [doctors, setDoctors] = useState([])
  const [insurances, setInsurances] = useState([])

  const addDoctor = () => {
    const name = prompt('Doctor name:')
    const npi = prompt('NPI number:')
    if (name && npi) setDoctors([...doctors, { name, npi }])
  }

  const addInsurance = () => {
    const insurance = prompt('Insurance name:')
    const type = prompt('Type:')
    const doctor = prompt('Assign Doctor:')
    const expiration = prompt('Expiration Date:')
    const notes = prompt('Notes:')
    if (insurance && type)
      setInsurances([...insurances, { insurance, type, doctor, expiration, notes }])
  }

  const deleteDoctor = (i) => {
    if (confirm('Delete this doctor?')) setDoctors(doctors.filter((_, idx) => idx !== i))
  }

  const deleteInsurance = (i) => {
    if (confirm('Delete this insurance?')) setInsurances(insurances.filter((_, idx) => idx !== i))
  }

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <header className="flex justify-between items-center mb-6">
        <img src="/logo.png" alt="Logo" className="h-12" />
        <div className="flex gap-4">
          <button onClick={addDoctor} className="bg-navy text-white px-4 py-2 rounded">Doctors</button>
          <button onClick={addInsurance} className="bg-navy text-white px-4 py-2 rounded">Insurances</button>
          <button className="bg-gray-300 px-4 py-2 rounded">Upload DB</button>
          <button className="bg-gray-300 px-4 py-2 rounded">Download DB</button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4 text-navy">Doctors</h2>
          {doctors.map((d, i) => (
            <div key={i} className="flex justify-between items-center border-b py-2">
              <span>{d.name} — NPI: {d.npi}</span>
              <Trash2 className="text-red-600 cursor-pointer" onClick={() => deleteDoctor(i)} />
            </div>
          ))}
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4 text-navy">Insurances</h2>
          {insurances.map((ins, i) => (
            <div key={i} className="flex justify-between items-center border-b py-2">
              <span>{ins.insurance} ({ins.type}) — Exp: {ins.expiration}</span>
              <Trash2 className="text-red-600 cursor-pointer" onClick={() => deleteInsurance(i)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
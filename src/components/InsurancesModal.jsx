import React, { useEffect, useState } from 'react'

export default function InsurancesModal({ open, onClose }) {
  const defaults = [
    'Aetna',
    'Florida Blue',
    'Cigna',
    'Ambetter',
    'UnitedHealthcare',
    'Molina Healthcare',
    'AmeriHealth Caritas',
    'Florida Health Care Plan',
    'Oscar'
  ]

  const [insList, setInsList] = useState(defaults)
  const [doctorsByIns, setDoctorsByIns] = useState({})
  const [active, setActive] = useState(defaults[0])
  const [selectedDoc, setSelectedDoc] = useState('')
  const [expiration, setExpiration] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const i = localStorage.getItem('insuranceList')
    if (i) setInsList(JSON.parse(i))

    const d = localStorage.getItem('doctorsByInsurance')
    if (d) setDoctorsByIns(JSON.parse(d))
  }, [])

  useEffect(() => {
    localStorage.setItem('insuranceList', JSON.stringify(insList))
  }, [insList])

  useEffect(() => {
    localStorage.setItem('doctorsByInsurance', JSON.stringify(doctorsByIns))
  }, [doctorsByIns])

  const doctors = JSON.parse(localStorage.getItem('doctorsList') || '[]')

  if (!open) return null

  const handleAddInsurance = value => {
    const v = value.trim()
    if (!v) return
    setInsList(prev => (prev.includes(v) ? prev : [...prev, v]))
  }

  const handleAddAssignment = () => {
    if (!selectedDoc) {
      alert('Select a doctor')
      return
    }
    const doc = doctors.find(x => x.id === selectedDoc)
    if (!doc) return

    const entry = {
      doctorId: selectedDoc,
      name: doc.name,
      expiration: expiration || null,
      notes: notes || ''
    }

    setDoctorsByIns(prev => ({
      ...prev,
      [active]: [...(prev[active] || []), entry]
    }))

    setSelectedDoc('')
    setExpiration('')
    setNotes('')
  }

  const handleRemoveAssignment = idx => {
    const copy = { ...doctorsByIns }
    copy[active].splice(idx, 1)
    setDoctorsByIns(copy)
  }

  return (
    <div className="ks-modal-overlay">
      <div className="ks-modal-full">
        <div className="ks-modal-header">
          <h2>Manage Insurances</h2>
          <button className="ks-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="ks-modal-body">
          <div className="ks-ins-panel">
            {/* Lista de insurances */}
            <div className="ks-ins-left">
              <h3>Insurances</h3>
              <ul className="ks-ins-list">
                {insList.map(i => (
                  <li
                    key={i}
                    className={
                      active === i
                        ? 'ks-ins-item ks-ins-item--active'
                        : 'ks-ins-item'
                    }
                    onClick={() => setActive(i)}
                  >
                    {i}
                  </li>
                ))}
              </ul>

              <div className="ks-ins-add-row">
                <input
                  className="ks-input"
                  placeholder="New insurance..."
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleAddInsurance(e.target.value)
                      e.target.value = ''
                    }
                  }}
                />
                <button
                  className="btn-primary"
                  type="button"
                  onClick={() => {
                    const el = document.querySelector(
                      '.ks-ins-add-row .ks-input'
                    )
                    if (el) {
                      handleAddInsurance(el.value)
                      el.value = ''
                    }
                  }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Asignar doctores */}
            <div className="ks-ins-right">
              <h3>Assign Doctor to {active}</h3>

              <div className="ks-ins-form-row">
                <select
                  className="ks-select"
                  value={selectedDoc}
                  onChange={e => setSelectedDoc(e.target.value)}
                >
                  <option value="">-- select doctor --</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} — NPI: {d.npi}
                    </option>
                  ))}
                </select>

                <input
                  className="ks-input"
                  type="date"
                  value={expiration}
                  onChange={e => setExpiration(e.target.value)}
                />

                <input
                  className="ks-input"
                  placeholder="Notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />

                <button
                  className="btn-primary"
                  type="button"
                  onClick={handleAddAssignment}
                >
                  Add
                </button>
              </div>

              <h4 className="ks-ins-subtitle">Doctors for {active}</h4>

              <ul className="ks-assigned-list">
                {(doctorsByIns[active] || []).map((d, idx) => (
                  <li key={idx} className="ks-assigned-item">
                    <div>
                      <strong>{d.name}</strong>
                      <div className="ks-assigned-meta">
                        {d.expiration || 'No expiration'}
                        {d.notes ? ` · ${d.notes}` : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="ks-remove"
                      onClick={() => handleRemoveAssignment(idx)}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

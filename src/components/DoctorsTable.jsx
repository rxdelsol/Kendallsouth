import React from 'react'

export default function DoctorsTable() {
  const doctors = JSON.parse(localStorage.getItem('doctorsList') || '[]')

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Doctor</th>
            <th>NPI</th>
            <th>Specialty</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {doctors.length === 0 && (
            <tr>
              <td colSpan={4}>No doctors found</td>
            </tr>
          )}
          {doctors.map(doc => (
            <tr key={doc.id}>
              <td>{doc.name}</td>
              <td>{doc.npi}</td>
              <td>{doc.specialty}</td>
              <td>
                {doc.active ? (
                  <span className="badge-in">Active</span>
                ) : (
                  <span className="badge-out">Inactive</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

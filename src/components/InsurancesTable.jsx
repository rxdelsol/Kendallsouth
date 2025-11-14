import React from 'react'

export default function InsurancesTable() {
  const insurances = JSON.parse(localStorage.getItem('insuranceList') || '[]')

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Payer</th>
            <th>Type</th>
            <th>Network</th>
          </tr>
        </thead>
        <tbody>
          {insurances.length === 0 && (
            <tr>
              <td colSpan={3}>No insurances found</td>
            </tr>
          )}
          {insurances.map((ins, idx) => (
            <tr key={idx}>
              <td>{ins.name}</td>
              <td>{ins.type || '—'}</td>
              <td>
                {ins.network === 'In Network' ? (
                  <span className="badge-in">In Network</span>
                ) : ins.network === 'Out of Network' ? (
                  <span className="badge-out">Out of Network</span>
                ) : (
                  '—'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

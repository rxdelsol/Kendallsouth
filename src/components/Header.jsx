import React from 'react'
export default function Header({ onNav }){
  return (
    <header className="w-full ks-page/80 border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src="https://kendallsouthcredentialing.vercel.app/Picture1.png" alt="logo" className="h-10" />
          <div>
            <div className="text-xl font-bold">Kendall South Medical Center</div>
          </div>
        </div>
        <nav className="flex gap-3">
          <button onClick={()=>onNav('dashboard')} className="px-3 py-2 rounded hover:bg-[var(--alt)]">Dashboard</button>
          <button onClick={()=>onNav('doctors')} className="px-3 py-2 rounded hover:bg-[var(--alt)]">Doctors</button>
          <button onClick={()=>onNav('insurances')} className="px-3 py-2 rounded hover:bg-[var(--alt)]">Insurances</button>
          <button onClick={()=>onNav('provider')} className="px-3 py-2 rounded hover:bg-[var(--alt)]">NPI Lookup</button>
          <button onClick={()=>onNav('eligibility')} className="px-3 py-2 rounded hover:bg-[var(--alt)]">Provider × Payer</button>
        </nav>
      </div>
    </header>
  )
}

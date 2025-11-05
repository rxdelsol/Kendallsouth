import React from 'react'

export default function Header({ onNav }){
  return (
    <header className="w-full bg-navy/80 border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src="https://kendallsouthcredentialing.vercel.app/Picture1.png" alt="logo" className="h-10" />
          <div>
            <div className="text-xl font-bold">Kendall South Medical Center</div>
            <div className="text-sm text-slate-300">— Provider Credential Tracker</div>
          </div>
        </div>
        <nav className="flex gap-3">
          <button onClick={()=>onNav('dashboard')} className="px-3 py-2 rounded hover:bg-slate-800">Dashboard</button>
          <button onClick={()=>onNav('doctors')} className="px-3 py-2 rounded hover:bg-slate-800">Doctors</button>
          <button onClick={()=>onNav('insurances')} className="px-3 py-2 rounded hover:bg-slate-800">Insurances</button>
        </nav>
      </div>
    </header>
  )
}

import React from 'react'

export default function Header({ onNav }) {

  return (
    <header className="app-header">
      <div className="app-header-inner">
        {/* Logo + Títulos */}
        <div className="flex items-center gap-4">
          <img
            src="https://kendallsouthcredentialing.vercel.app/Picture1.png"
            alt="logo"
            className="h-10"
          />
          <div>
            <div className="text-xl font-bold text-gray-900">
              Kendall South Medical Center
            </div>
            <div className="text-sm text-gray-500">
              Provider Credential Tracker
            </div>
          </div>
        </div>

        {/* Navegación */}
        <nav className="app-nav">
          <button
            onClick={() => onNav('dashboard')}
            className="app-nav-button"
          >
            Dashboard
          </button>
          <button
            onClick={() => onNav('doctors')}
            className="app-nav-button"
          >
            Doctors
          </button>
          <button
            onClick={() => onNav('insurances')}
            className="app-nav-button"
          >
            Insurances
          </button>
        </nav>
      </div>
    </header>
  )
}

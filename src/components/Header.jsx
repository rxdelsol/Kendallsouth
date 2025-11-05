import React from 'react'
export default function Header({ onNav }){
  return (
    <header className="header">
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <img className="logo" src="https://kendallsouthcredentialing.vercel.app/Picture1.png" alt="logo" />
        <div>
          <div style={{fontWeight:700}}>Kendall South Medical Center</div>
          <div style={{fontSize:12,color:'#cfeff0'}}>— Provider Credential Tracker</div>
        </div>
      </div>
      <nav>
        <button className="btn" onClick={()=>onNav('dashboard')} style={{marginRight:8}}>Dashboard</button>
        <button className="btn" onClick={()=>onNav('doctors')} style={{marginRight:8}}>Doctors</button>
        <button className="btn" onClick={()=>onNav('insurances')}>Insurances</button>
      </nav>
    </header>
  )
}

import React, { useState } from "react";
import InsurancesModal from "./components/InsurancesModal.jsx";
import DoctorsModal from "./components/DoctorsModal.jsx";

export default function App(){
  const [openIns, setOpenIns] = useState(false);
  const [openDocs, setOpenDocs] = useState(false);

  return (
    <div>
      <header className="header">
        <div className="brand">Kendall South Medical Center — Provider Credential Tracker</div>
      </header>

      <div className="action-bar">
        <button className="btn">Apply</button>
        <button className="btn">Clear</button>
        <button className="btn primary">+ Add</button>
        <button className="btn">Reload</button>
        <button className="btn">CSV</button>
        <button className="btn">Backup</button>
        <button className="btn">Restore</button>

        <div className="toolbar-spacer" />

        <button className="btn" onClick={()=>setOpenIns(true)}>Insurances</button>
        <button className="btn" onClick={()=>setOpenDocs(true)}>Doctors</button>
      </div>

      <main className="container">
        <div className="table-placeholder">Aquí va tu tabla principal (mantén tu contenido existente). Use the Doctors modal to manage doctors and the Insurances modal to manage insurers.</div>
      </main>

      <InsurancesModal open={openIns} onClose={()=>setOpenIns(false)} />
      <DoctorsModal open={openDocs} onClose={()=>setOpenDocs(false)} />
    </div>
  );
}
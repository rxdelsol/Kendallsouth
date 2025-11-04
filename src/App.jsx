import React, { useState } from "react";
import Header from "./components/Header";
import InsurancesModal from "./components/InsurancesModal";
import DoctorsModal from "./components/DoctorsModal";
import "./styles/header.css";

export default function App(){
  const [showIns, setShowIns] = useState(false);
  const [showDocs, setShowDocs] = useState(false);

  return (
    <div>
      <Header onOpenIns={() => setShowIns(true)} onOpenDocs={() => setShowDocs(true)} />
      
      <div className="actions-bar" role="toolbar" aria-label="Actions">
        <button className="action-btn">Apply</button>
        <button className="action-btn">Clear</button>
        <button className="action-btn primary">+ Add</button>
        <button className="action-btn">Reload</button>
        <button className="action-btn">CSV</button>
        <button className="action-btn">Backup</button>
        <button className="action-btn">Restore</button>
        <div style={{flex:1}} />
        <button className="action-btn" onClick={() => setShowIns(true)}>Insurances</button>
        <button className="action-btn" onClick={() => setShowDocs(true)}>Doctors</button>
      </div>

      <main style={{padding: "20px"}}>
        <div className="table-placeholder">
          This is your main table (keep your existing content). Use the Doctors modal to manage doctors and the Insurances modal to manage insurers.
        </div>
      </main>

      <InsurancesModal open={showIns} onClose={() => setShowIns(false)} />
      <DoctorsModal open={showDocs} onClose={() => setShowDocs(false)} />
    </div>
  );
}

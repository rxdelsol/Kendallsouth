import React from "react";
import FileManager from "./FileManager.jsx";
import "./styles/shell.css";

// Marco de la app: barra lateral con la navegación y barra superior con
// búsqueda e identidad. La navegación vertical aguanta más secciones que una
// horizontal y deja siempre visible dónde estás parada.

const ICONOS = {
  dashboard: "M3 12l9-8 9 8v8a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  doctors: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9a8 8 0 0 1 16 0z",
  insurances: "M12 2l8 4v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6z",
  provider: "M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm10 17l-5.2-5.2",
  eligibility: "M4 6h7v5H4zm9 0h7v5h-7zM4 13h7v5H4zm9 0h7v5h-7z",
};

const SECCIONES = [
  { id: "dashboard", label: "Dashboard" },
  { id: "doctors", label: "Providers" },
  { id: "insurances", label: "Insurances" },
  { id: "provider", label: "NPI Lookup" },
  { id: "eligibility", label: "Provider × Payer" },
];

const TITULOS = {
  dashboard: "Dashboard",
  doctors: "Providers",
  insurances: "Insurances",
  provider: "NPI Lookup",
  eligibility: "Provider × Payer",
};

export default function Shell({ route, onNav, children }) {
  return (
    <div className="sh">
      <aside className="sh-side">
        <div className="sh-brand">
          <img src="/Picture1.png" alt="Kendall South Medical Center" />
        </div>

        <nav className="sh-nav">
          {SECCIONES.map((s) => (
            <button
              key={s.id}
              type="button"
              className="sh-navitem"
              aria-current={route === s.id}
              onClick={() => onNav(s.id)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d={ICONOS[s.id]} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" />
              </svg>
              <span>{s.label}</span>
            </button>
          ))}
        </nav>

        <div className="sh-foot">
          <p className="sh-quote">“Better providers.<br />Healthier communities.”</p>
          <p className="sh-place">Kendall · Miami, FL</p>
        </div>
      </aside>

      <div className="sh-main">
        <header className="sh-top">
          <div className="sh-titles">
            <h1>{TITULOS[route] || "Kendall South"}</h1>
            <p>Kendall South Medical Center · Provider Credential Tracker</p>
          </div>
          <div className="sh-tools">
            <FileManager />
            <span className="sh-user" title="Signed in">
              <span className="sh-avatar">KS</span>
              <span className="sh-uname">Kendall South<small>Administrator</small></span>
            </span>
          </div>
        </header>

        <main className="sh-body">{children}</main>
      </div>
    </div>
  );
}

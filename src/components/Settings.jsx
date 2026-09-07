import React, { useEffect, useState } from "react";
import { PageHead } from "./Shell.jsx";
import { CAQH_ATTEST_DAYS } from "../utils/credStatus";
import "./styles/reports.css";

// Esta pantalla solo dice lo que el navegador puede saber. Las claves
// (contraseña, secreto de firma, credenciales de las aseguradoras, destino de
// los avisos) viven en las variables de entorno de Vercel y no se exponen al
// cliente — mostrarlas acá, aunque fuera "solo para ver", las publicaría.
export default function Settings() {
  const [conteo, setConteo] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/get-doctors").then((r) => r.json()).catch(() => ({})),
      fetch("/api/get-insurances").then((r) => r.json()).catch(() => ({})),
    ]).then(([d, s]) =>
      setConteo({
        doctores: d && d.ok ? (d.data || []).length : null,
        seguros: s && s.ok ? (s.data || []).length : null,
      })
    );
  }, []);

  return (
    <div>
      <PageHead icono="settings" titulo="Settings" sub="How this tracker is wired up" />

      <div className="dash-grid">
        <section className="panel">
          <h3>Session</h3>
          <div className="panel-body">
            <p className="set-p">
              The site is behind a shared password. A sign-in lasts 7 days on this device, then asks again.
            </p>
            <p className="set-p">
              Signing out clears it everywhere on this browser. Use it on a shared or public computer.
            </p>
            <a className="btn-pri" href="/logout">Sign out</a>
          </div>
        </section>

        <section className="panel">
          <h3>Expiration alerts</h3>
          <div className="panel-body">
            <p className="set-p">
              A scheduled job checks every credential and contract and emails you before anything lapses.
              It runs on Vercel, not in this browser, so it works whether or not the site is open.
            </p>
            <table className="lk-def set-def">
              <tbody>
                <tr><th>Warning windows</th><td>90, 60, 30 days &mdash; then daily once expired</td></tr>
                <tr><th>CAQH re-attestation</th><td>every {CAQH_ATTEST_DAYS} days from the last attestation</td></tr>
                <tr><th>Florida license</th><td>looked up automatically against the state MQA board</td></tr>
                <tr><th>Medicare revalidation</th><td>from the CMS Revalidation Due Date List</td></tr>
                <tr><th>Recipient</th><td className="q">set in Vercel &rarr; Environment Variables</td></tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="dash-grid">
        <section className="panel">
          <h3>Data</h3>
          <table className="lk-def set-def">
            <tbody>
              <tr><th>Providers on file</th><td className="mono">{conteo ? (conteo.doctores ?? "—") : "…"}</td></tr>
              <tr><th>Contracts on file</th><td className="mono">{conteo ? (conteo.seguros ?? "—") : "…"}</td></tr>
              <tr><th>Storage</th><td>Supabase (Postgres)</td></tr>
              <tr><th>Backups</th><td>Data Management &rarr; Full backup (.json)</td></tr>
            </tbody>
          </table>
        </section>

        <section className="panel">
          <h3>Where the data comes from</h3>
          <table className="lk-def set-def">
            <tbody>
              <tr><th>NPI details</th><td>NPPES national registry &mdash; live</td></tr>
              <tr><th>Medicare enrollment</th><td>CMS / PECOS public data &mdash; live</td></tr>
              <tr><th>Network participation</th><td>each payer&rsquo;s FHIR Provider Directory, where configured; otherwise what you record here</td></tr>
              <tr><th>Florida licenses</th><td>Florida MQA license verification</td></tr>
            </tbody>
          </table>
          <p className="rep-note">
            Keys and passwords are set in Vercel&rsquo;s environment variables and are never sent to the browser,
            so they are not shown on this page.
          </p>
        </section>
      </div>
    </div>
  );
}

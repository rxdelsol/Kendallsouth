import React, { useEffect, useMemo, useRef, useState } from "react";
import { daysUntil, statusOf } from "../utils/credStatus";
import "./styles/shell.css";

// Marco de la app: barra lateral con la navegación y barra superior con
// búsqueda global, avisos e identidad. La navegación vertical aguanta las ocho
// secciones y deja siempre visible dónde estás parada.
//
// Ni la búsqueda ni la campana son decorativas: las dos leen los mismos datos
// que las pantallas. Un buscador que no busca o un contador de avisos siempre
// en cero enseñan a ignorar la barra, y después el aviso que sí importa pasa
// desapercibido.

const ICONOS = {
  dashboard: "M3 12l9-8 9 8v8a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  doctors: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9a8 8 0 0 1 16 0z",
  insurances: "M12 2l8 4v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6z",
  provider: "M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm10 17l-5.2-5.2",
  matrix: "M4 6h7v5H4zm9 0h7v5h-7zM4 13h7v5H4zm9 0h7v5h-7z",
  // Matraz: la sección de investigación clínica, no la de credenciales.
  research: "M9 3h6M10 3v6.2L4.8 18a2 2 0 0 0 1.7 3h11a2 2 0 0 0 1.7-3L14 9.2V3M7.6 14h8.8",
  // Carpeta con una flecha hacia abajo: el binder del que se descarga.
  files: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM12 10v5m0 0l-2-2m2 2l2-2",
  // Diana: las oportunidades a las que el sitio apunta.
  opps: "M12 3a9 9 0 1 0 9 9M12 7.5a4.5 4.5 0 1 0 4.5 4.5M12 12l8-8m0 0V2.6m0 1.4h1.4",
  reports: "M7 3h7l4 4v14H7zM14 3v4h4M10 13h6M10 17h6",
  data: "M4 7c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zm0 0v10c0 1.7 3.6 3 8 3s8-1.3 8-3V7",
  settings: "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm8.5 3l1.6 1.2-1.6 3-1.9-.6-1.7 1-.4 2h-3.4l-.4-2-1.7-1-1.9.6-1.6-3L7.1 12l-1.6-1.2 1.6-3 1.9.6 1.7-1 .4-2h3.4l.4 2 1.7 1 1.9-.6 1.6 3z",
};

const SECCIONES = [
  { id: "dashboard", label: "Dashboard" },
  { id: "doctors", label: "Providers" },
  { id: "insurances", label: "Insurances" },
  { id: "provider", label: "NPI Lookup" },
  { id: "matrix", label: "Provider × Payer" },
  { id: "research", label: "Research" },
  { id: "files", label: "Study Files" },
  { id: "opps", label: "Opportunities" },
  { id: "reports", label: "Reports" },
  { id: "data", label: "Data Management" },
  { id: "settings", label: "Settings" },
];

export function Icono({ id, ...rest }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...rest}>
      <path d={ICONOS[id]} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// Encabezado de cada pantalla: cuadro con el ícono, título, una línea que dice
// qué se hace acá, y a la derecha la acción principal. Va dentro del cuerpo,
// no en la barra superior, porque cambia con la pantalla y la barra no.
export function PageHead({ icono, titulo, sub, children }) {
  return (
    <div className="pghd">
      <span className="pghd-ic"><Icono id={icono} /></span>
      <div className="pghd-tx">
        <h2>{titulo}</h2>
        <p>{sub}</p>
      </div>
      {children ? <div className="pghd-act">{children}</div> : null}
    </div>
  );
}

const iniciales = (n) =>
  String(n || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

export default function Shell({ route, onNav, children }) {
  const [doctores, setDoctores] = useState([]);
  const [seguros, setSeguros] = useState([]);
  const [q, setQ] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [avisos, setAvisos] = useState(false);
  const caja = useRef(null);

  useEffect(() => {
    let vivo = true;
    Promise.all([
      fetch("/api/get-doctors").then((r) => r.json()).catch(() => ({})),
      fetch("/api/get-insurances").then((r) => r.json()).catch(() => ({})),
    ]).then(([d, s]) => {
      if (!vivo) return;
      setDoctores(d && d.ok ? d.data || [] : []);
      setSeguros(s && s.ok ? s.data || [] : []);
    });
    return () => { vivo = false; };
  }, []);

  // Cerrar los desplegables al hacer clic afuera o con Escape.
  useEffect(() => {
    const fuera = (e) => { if (caja.current && !caja.current.contains(e.target)) { setAbierto(false); setAvisos(false); } };
    const esc = (e) => { if (e.key === "Escape") { setAbierto(false); setAvisos(false); } };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", fuera); document.removeEventListener("keydown", esc); };
  }, []);

  // Búsqueda global: proveedores por nombre o NPI, aseguradoras por nombre.
  const hallazgos = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t.length < 2) return [];
    const r = [];
    doctores.forEach((d) => {
      if ((d.name || "").toLowerCase().includes(t) || String(d.npi || "").includes(t))
        r.push({ tipo: "Provider", ruta: "doctors", clave: "d" + d.id, texto: d.name, sub: d.npi ? "NPI " + d.npi : d.taxonomy });
    });
    const vistos = new Set();
    seguros.forEach((s) => {
      const n = s.name || "";
      if (!n || vistos.has(n.toLowerCase())) return;
      if (n.toLowerCase().includes(t)) { vistos.add(n.toLowerCase()); r.push({ tipo: "Insurance", ruta: "insurances", clave: "s" + s.id, texto: n, sub: s.type }); }
    });
    return r.slice(0, 8);
  }, [q, doctores, seguros]);

  // Avisos: lo que de verdad vence pronto. El número del globo es la cuenta
  // real, no un adorno — si dice 3, hay tres cosas que atender.
  const pendientes = useMemo(() => {
    const r = [];
    // Los mismos cortes que el resto del sistema: vencido, ≤30, ≤60, ≤90.
    const urge = (st) => st === "expired" || st === "d30" || st === "d60" || st === "d90";
    const fecha = (v) => new Date(String(v).slice(0, 10) + "T00:00:00").toLocaleDateString();
    doctores.forEach((d) => {
      const st = statusOf(d.licenseExp);
      if (urge(st)) r.push({ clave: "l" + d.id, ruta: "doctors", st, dias: daysUntil(d.licenseExp),
        que: d.name, det: (st === "expired" ? "License expired " : "License expires ") + fecha(d.licenseExp) });
      const stDea = statusOf(d.deaExp);
      if (urge(stDea)) r.push({ clave: "e" + d.id, ruta: "doctors", st: stDea, dias: daysUntil(d.deaExp),
        que: d.name, det: (stDea === "expired" ? "DEA expired " : "DEA expires ") + fecha(d.deaExp) });
    });
    seguros.forEach((s) => {
      const st = statusOf(s.expiration);
      if (urge(st)) r.push({ clave: "i" + s.id, ruta: "insurances", st, dias: daysUntil(s.expiration),
        que: (s.doctorName || "Contract") + " \u00b7 " + s.name,
        det: (st === "expired" ? "Contract expired " : "Contract expires ") + fecha(s.expiration) });
    });
    return r.sort((a, b) => (a.dias ?? 0) - (b.dias ?? 0));
  }, [doctores, seguros]);

  const ir = (r) => { onNav(r); setAbierto(false); setAvisos(false); setQ(""); };

  return (
    <div className="sh">
      <aside className="sh-side">
        <div className="sh-brand">
          <img src="/Picture1.png" alt="Kendall South Medical Center" />
        </div>

        <nav className="sh-nav">
          {SECCIONES.map((s) => (
            <button key={s.id} type="button" className="sh-navitem" aria-current={route === s.id} onClick={() => onNav(s.id)}>
              <Icono id={s.id} />
              <span>{s.label}</span>
            </button>
          ))}
        </nav>

        <div className="sh-foot">
          <p className="sh-quote">&ldquo;Better providers.<br />Healthier communities.&rdquo;</p>
          <p className="sh-place">Kendall &middot; Miami, FL</p>
        </div>
      </aside>

      <div className="sh-main">
        <header className="sh-top" ref={caja}>
          <div className="sh-org">
            <strong>Kendall South Medical Center</strong>
            <span>Provider Credential Tracker</span>
          </div>

          <div className="sh-search">
            <Icono id="provider" />
            <input
              type="search"
              placeholder="Search providers, insurances, NPI…"
              value={q}
              onChange={(e) => { setQ(e.target.value); setAbierto(true); setAvisos(false); }}
              onFocus={() => setAbierto(true)}
              aria-label="Search providers, insurances or NPI"
            />
            {abierto && q.trim().length >= 2 && (
              <ul className="sh-res" role="listbox">
                {hallazgos.length === 0 && <li className="sh-res-none">No matches for &ldquo;{q.trim()}&rdquo;</li>}
                {hallazgos.map((h) => (
                  <li key={h.clave}>
                    <button type="button" onClick={() => ir(h.ruta)}>
                      <em>{h.tipo}</em>
                      <span>{h.texto}</span>
                      <small>{h.sub}</small>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="button"
            className="sh-bell"
            aria-label={`${pendientes.length} credentials expiring soon`}
            aria-expanded={avisos}
            onClick={() => { setAvisos((v) => !v); setAbierto(false); }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9zm3.5 8.5a2.5 2.5 0 0 0 5 0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {pendientes.length > 0 && <i className="sh-badge">{pendientes.length > 9 ? "9+" : pendientes.length}</i>}
          </button>

          {avisos && (
            <div className="sh-drop" role="dialog" aria-label="Expiring credentials">
              <h4>Expiring within 90 days</h4>
              {pendientes.length === 0 ? (
                <p className="sh-drop-none">Nothing expires in the next 90 days.</p>
              ) : (
                <ul>
                  {pendientes.slice(0, 8).map((p) => (
                    <li key={p.clave}>
                      <button type="button" onClick={() => ir(p.ruta)}>
                        <i className={"dot " + (p.st === "expired" || p.st === "d30" ? "b-hot" : "b-mid")} />
                        <span>{p.que}<small>{p.det}</small></span>
                        <b className={p.st === "expired" || p.st === "d30" ? "d-hot" : "d-mid"}>
                          {p.dias < 0 ? "past due" : p.dias + "d"}
                        </b>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <span className="sh-user" title="Signed in">
            <span className="sh-avatar">KS</span>
            <span className="sh-uname">Kendall South<small>Administrator</small></span>
          </span>
        </header>

        <main className="sh-body">{children}</main>
      </div>
    </div>
  );
}

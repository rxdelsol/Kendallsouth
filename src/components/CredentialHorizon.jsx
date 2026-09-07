import React, { useMemo } from "react";
import { daysUntil, statusOf } from "../utils/credStatus";
import "./styles/horizon.css";

// Horizonte de vencimientos: 24 meses por delante, con cada licencia puesta
// donde vence. Es la pieza que cambia cómo se lee la pantalla — una lista
// ordenada por nombre nunca te dice que en enero se te juntan tres médicos.
// Un clic en cualquier punto abre el expediente de ese proveedor.

const MES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// Usa la MISMA escala que el semáforo del resto de la app (statusOf). Tener
// dos escalas distintas hacía que el horizonte pintara en rojo lo que la tabla
// de al lado pintaba en verde, para la misma fecha.
const tier = (iso) => {
  const s = statusOf(iso);
  if (s === "expired" || s === "d30") return "hot";
  if (s === "d60" || s === "d90") return "mid";
  if (s === "ok") return "ok";
  return "none";
};

// Inicial + apellido: en esta clínica hay cuatro Fernandez y el apellido solo
// no distingue a nadie.
function corto(nombre) {
  const p = String(nombre || "").trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "";
  return p.length > 1 ? `${p[0][0]}. ${p[p.length - 1]}` : p[0];
}

export default function CredentialHorizon({ doctors, onPick, selectedId }) {
  const hoy = new Date();
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const fin = new Date(hoy.getFullYear() + 2, hoy.getMonth(), 1);
  const span = fin - inicio;
  const pos = (f) => ((new Date(f) - inicio) / span) * 100;

  const { conFecha, sinFecha, meses } = useMemo(() => {
    const con = [], sin = [];
    (doctors || []).forEach((d) => {
      const iso = d.licenseExp ? String(d.licenseExp).slice(0, 10) : null;
      if (!iso) { sin.push(d); return; }
      const f = new Date(iso + "T00:00:00");
      if (f < inicio || f >= fin) { sin.push(d); return; }
      con.push({ d, iso, f, dias: daysUntil(iso) });
    });
    con.sort((a, b) => a.f - b.f);

    const ms = [];
    const c = new Date(inicio);
    while (c < fin) {
      ms.push(new Date(c));
      c.setMonth(c.getMonth() + 1);
    }
    return { conFecha: con, sinFecha: sin, meses: ms };
  }, [doctors, inicio.getTime(), fin.getTime()]);

  // Apila los que caen cerca para que las etiquetas no se pisen.
  const filas = [];
  const marcas = conFecha.map((x) => {
    const left = pos(x.f);
    let fila = 0;
    while (filas[fila] !== undefined && left - filas[fila] < 7) fila++;
    filas[fila] = left;
    return { ...x, left, fila };
  });
  const alto = Math.max(1, filas.length) * 30 + 14;

  if (!doctors || !doctors.length) return null;

  return (
    <section className="hz">
      <div className="hz-cap">
        <h3>The next 24 months</h3>
        <p>Each dot is a license coming due. Click one to open the record.</p>
      </div>

      <div className="hz-band">
        <div className="hz-grid" aria-hidden="true">
          {meses.map((m, i) => {
            const left = pos(m);
            const enero = m.getMonth() === 0;
            return (
              <React.Fragment key={i}>
                <span className={`hz-line${enero ? " year" : ""}`} style={{ left: left + "%" }} />
                {(enero || i === 0) && (
                  <span
                    className="hz-label"
                    style={{ left: left < 4 ? "9px" : left + "%", transform: left < 4 ? "none" : "translateX(-50%)" }}
                  >
                    {MES[m.getMonth()]} {m.getFullYear()}
                  </span>
                )}
              </React.Fragment>
            );
          })}
          <span className="hz-now" style={{ left: pos(hoy) + "%" }} />
        </div>

        <div className="hz-ticks" style={{ height: alto }}>
          {marcas.map(({ d, left, fila, dias, iso }) => (
            <button
              key={d.id}
              type="button"
              className={`hz-tick c-${tier(iso)}`}
              style={{ left: left + "%", top: fila * 30 }}
              aria-current={String(d.id) === String(selectedId)}
              title={`${d.name} · ${new Date(iso + "T00:00:00").toLocaleDateString()} · ${dias} days`}
              onClick={() => onPick && onPick(d)}
            >
              <span className="hz-bead" />
              <span className="hz-who">{corto(d.name)}</span>
            </button>
          ))}
        </div>
      </div>

      {sinFecha.length > 0 && (
        <div className="hz-nodate">
          <b>No license date:</b>
          {sinFecha.map((d) => (
            <button key={d.id} type="button" onClick={() => onPick && onPick(d)}>{d.name}</button>
          ))}
          <span>— they are not on the horizon because there is nothing to count down.</span>
        </div>
      )}
    </section>
  );
}

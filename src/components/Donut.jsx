import React from "react";

// Dona de parte-sobre-total. Pocas categorías, valores que suman un total que
// importa. La leyenda va SIEMPRE al lado con el número y el porcentaje: el
// color identifica, pero nadie tiene que deducir un valor de un color.
//
// Paleta categórica validada (separación para daltonismo, contraste sobre
// blanco y piso de croma comprobados): azul, verde azulado, naranja, fucsia.
// Los colores de estado —verde/ámbar/rojo del semáforo— NO se usan acá: están
// reservados para vencimientos y red, y reutilizarlos les quitaría significado.
export const CATEGORICA = ["#2563EB", "#0D9488", "#EA580C", "#C026D3"];

export default function Donut({ datos, total, etiquetaCentro, colores = CATEGORICA, size = 150 }) {
  const suma = total ?? datos.reduce((a, d) => a + d.valor, 0);
  const r = size / 2 - 12;
  const circ = 2 * Math.PI * r;
  let acumulado = 0;

  return (
    <div className="dn">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img"
        aria-label={`${etiquetaCentro}: ${datos.map((d) => `${d.nombre} ${d.valor}`).join(", ")}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line2)" strokeWidth="16" />
        {datos.map((d, i) => {
          const frac = suma ? d.valor / suma : 0;
          // 2px de separación entre segmentos: sin el hueco, dos colores
          // contiguos se leen como uno solo.
          const largo = Math.max(0, frac * circ - 2);
          const el = (
            <circle
              key={d.nombre}
              cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={d.color || colores[i % colores.length]}
              strokeWidth="16" strokeLinecap="butt"
              strokeDasharray={`${largo} ${circ - largo}`}
              strokeDashoffset={-acumulado * circ}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            >
              <title>{`${d.nombre}: ${d.valor} (${Math.round(frac * 100)}%)`}</title>
            </circle>
          );
          acumulado += frac;
          return el;
        })}
        <text x="50%" y="47%" textAnchor="middle" className="dn-num">{suma}</text>
        <text x="50%" y="62%" textAnchor="middle" className="dn-lbl">{etiquetaCentro}</text>
      </svg>

      <ul className="dn-leg">
        {datos.map((d, i) => (
          <li key={d.nombre}>
            <i style={{ background: d.color || colores[i % colores.length] }} />
            <span className="dn-name">{d.nombre}</span>
            <b>{d.valor}</b>
            <small>{suma ? Math.round((d.valor / suma) * 100) : 0}%</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

// src/utils/coverage.js
// Resumen de seguros aceptados por LÍNEA DE NEGOCIO, no por aseguradora.
// Es como se factura, y es donde se ve el hueco: doce filas ordenadas por
// aseguradora esconden que faltan tres de las cinco líneas de Medicare.

export const LINEAS = ["Medicaid", "Medicare", "Comercial y marketplace"];

export function lineaDe(tipo, plan) {
  const t = String(tipo || "").toLowerCase();
  const n = String(plan || "").toLowerCase();
  if (t.includes("medicaid") || n.includes("medicaid")) return "Medicaid";
  if (t.includes("medicare") || n.includes("medicare")) return "Medicare";
  return "Comercial y marketplace";
}

const esOut = (red) => String(red || "").toLowerCase().includes("out");

// Etiqueta del plan sin repetir el tipo: "Simply Medicaid", no
// "Simply Medicaid · Medicaid".
export function etiquetaPlan(plan, tipo) {
  const p = String(plan || "").trim();
  const t = String(tipo || "").trim();
  if (!t || p.toLowerCase().includes(t.toLowerCase())) return p;
  return p + " · " + t;
}

export function resumenCobertura(insurances, doctorName) {
  const norm = (s) => String(s || "").trim().toLowerCase();
  const mios = (insurances || []).filter((i) => norm(i.doctorName) === norm(doctorName));

  const grupos = {};
  LINEAS.forEach((k) => (grupos[k] = { dentro: [], fuera: [] }));

  mios.forEach((i) => {
    const g = grupos[lineaDe(i.type, i.name)];
    const item = { etiqueta: etiquetaPlan(i.name, i.type), expiration: i.expiration || null, nombre: i.name };
    (esOut(i.network) ? g.fuera : g.dentro).push(item);
  });

  const activos = mios.filter((i) => !esOut(i.network)).length;
  return { grupos, activos, total: mios.length };
}

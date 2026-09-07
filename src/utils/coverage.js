// src/utils/coverage.js
// Resumen de seguros aceptados por LÍNEA DE NEGOCIO, no por aseguradora.
// Es como se factura, y es donde se ve el hueco: doce filas ordenadas por
// aseguradora esconden que faltan tres de las cinco líneas de Medicare.

export const LINEAS = ["Medicaid", "Medicare", "Commercial & Marketplace"];

export function lineaDe(tipo, plan) {
  const t = String(tipo || "").toLowerCase();
  const n = String(plan || "").toLowerCase();
  if (t.includes("medicaid") || n.includes("medicaid")) return "Medicaid";
  if (t.includes("medicare") || n.includes("medicare")) return "Medicare";
  return "Commercial & Marketplace";
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

// Familia de la aseguradora. "Aetna", "Aetna Medicare", "Aetna Medicaid" y
// "Aetna Comercial" son cuatro contratos de la MISMA aseguradora, y verlos
// como cuatro filas sueltas esconde el panorama. Reutilizamos el catálogo de
// alta (payerApply) porque ya resuelve las variantes y el orden de
// especificidad: "Aetna Better Health" antes que "Aetna", y las marcas antes
// que los genéricos "Medicaid"/"Medicare".
import { applyLinkFor } from "../data/payerApply.js";

export function familiaDe(nombre) {
  const hit = applyLinkFor(nombre);
  if (hit) return hit.label;
  const n = String(nombre || "").trim();
  return n || "Sin nombre";
}

// Agrupa los contratos por aseguradora y ordena los grupos por RIESGO:
// primero los que tienen contratos fuera de red, después por el vencimiento
// más cercano. Alfabético no le sirve a nadie.
export function agruparPorAseguradora(items) {
  const mapa = new Map();
  (items || []).forEach((i) => {
    const k = familiaDe(i.name);
    if (!mapa.has(k)) mapa.set(k, { nombre: k, filas: [], dentro: 0, fuera: 0 });
    const g = mapa.get(k);
    g.filas.push(i);
    if (String(i.network || "").toLowerCase().includes("out")) g.fuera += 1;
    else g.dentro += 1;
  });

  const grupos = [...mapa.values()].map((g) => {
    const dias = g.filas
      .map((f) => f._daysLeft)
      .filter((d) => typeof d === "number" && !isNaN(d));
    return { ...g, total: g.filas.length, proximo: dias.length ? Math.min(...dias) : null };
  });

  grupos.sort((a, b) => {
    if ((b.fuera > 0) !== (a.fuera > 0)) return b.fuera > 0 ? 1 : -1;
    if (b.fuera !== a.fuera) return b.fuera - a.fuera;
    const A = a.proximo === null ? Infinity : a.proximo;
    const B = b.proximo === null ? Infinity : b.proximo;
    if (A !== B) return A - B;
    return a.nombre.localeCompare(b.nombre);
  });
  return grupos;
}

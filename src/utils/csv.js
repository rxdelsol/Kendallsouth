// src/utils/csv.js — CSV de ida y vuelta, sin librería.

// Escapa un valor. Coma, comilla o salto de línea obligan a entrecomillar;
// si no, un nombre con coma parte la fila en dos y el archivo queda corrido.
function esc(v) {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export function toCsv(columnas, filas) {
  const cab = columnas.map((c) => esc(c.label)).join(",");
  const cuerpo = filas.map((f) => columnas.map((c) => esc(c.get(f))).join(",")).join("\r\n");
  // BOM para que Excel abra los acentos bien en vez de "Ã¡".
  return "﻿" + cab + "\r\n" + cuerpo + "\r\n";
}

export function descargar(nombre, contenido, tipo = "text/csv;charset=utf-8") {
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Parser que respeta comillas dobles y "" escapadas, y acepta saltos \n y \r\n.
export function parseCsv(texto) {
  const t = String(texto).replace(/^﻿/, "");
  const filas = [];
  let campo = "";
  let fila = [];
  let enComillas = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (enComillas) {
      if (c === '"') {
        if (t[i + 1] === '"') { campo += '"'; i++; }
        else enComillas = false;
      } else campo += c;
    } else if (c === '"') enComillas = true;
    else if (c === ",") { fila.push(campo); campo = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && t[i + 1] === "\n") i++;
      fila.push(campo); campo = "";
      if (fila.some((x) => x !== "")) filas.push(fila);
      fila = [];
    } else campo += c;
  }
  fila.push(campo);
  if (fila.some((x) => x !== "")) filas.push(fila);
  if (!filas.length) return { cabeceras: [], registros: [] };
  const cabeceras = filas[0].map((h) => h.trim());
  const registros = filas.slice(1).map((f) => {
    const o = {};
    cabeceras.forEach((h, i) => { o[h] = (f[i] ?? "").trim(); });
    return o;
  });
  return { cabeceras, registros };
}

// Busca una columna por varios nombres posibles, sin distinguir may/min ni
// espacios. Un CSV exportado de Excel casi nunca trae la cabecera exacta.
export function campo(reg, ...nombres) {
  const claves = Object.keys(reg);
  for (const n of nombres) {
    const k = claves.find((c) => c.toLowerCase().replace(/[\s_]+/g, "") === n.toLowerCase().replace(/[\s_]+/g, ""));
    if (k && reg[k] !== "") return reg[k];
  }
  return "";
}

// Normaliza una fecha a 'YYYY-MM-DD'. Acepta 'M/D/YYYY' y 'YYYY-MM-DD'.
// Si no la entiende devuelve null en vez de adivinar: una fecha de
// vencimiento mal leída es peor que una vacía.
export function fechaIso(v) {
  const s = String(v || "").trim();
  if (!s) return null;
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[1]}-${String(m[2]).padStart(2, "0")}-${String(m[3]).padStart(2, "0")}`;
  m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) return `${m[3]}-${String(m[1]).padStart(2, "0")}-${String(m[2]).padStart(2, "0")}`;
  return null;
}

// src/lib/supabase.js
// Cliente de Supabase para el navegador.
//
// Usa la clave ANON, no la de servicio. La anon está pensada para viajar en el
// bundle: no da acceso a nada por sí sola, lo que decide qué ve cada persona
// son las políticas RLS de supabase-study-files.sql. La clave de servicio,
// que sí salta RLS, se queda donde está — en las variables de las funciones de
// /api, nunca en el front.
//
// Variables en Vercel (tipo Config, no Secret — la anon no es secreta):
//   VITE_SUPABASE_URL       https://<ref>.supabase.co
//   VITE_SUPABASE_ANON_KEY  la clave anon/public del proyecto
//
// Vite las incrusta en tiempo de compilación, así que después de crearlas hay
// que volver a desplegar para que existan.

import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseReady = Boolean(url && key);

// Si faltan las variables no reventamos el bundle entero: la sección de
// archivos enseña qué falta y el resto de la app sigue funcionando.
export const supabase = supabaseReady
  ? createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: "ks-files-auth" },
    })
  : null;

export const BUCKET = "study-docs";

// Categorías del binder regulatorio. Es una lista cerrada a propósito: si cada
// quien escribe su propia categoría, a los tres meses hay "IRB", "irb",
// "I.R.B." y "Etica" y el filtro deja de servir.
export const CATEGORIES = [
  "Protocol & amendments",
  "Investigator's Brochure",
  "IRB / ethics",
  "Informed consent",
  "Delegation log",
  "Training certificates",
  "CDA & contracts",
  "Lab & equipment",
  "Monitoring visits",
  "Safety reports",
  "Other",
];

// Nombre de archivo seguro para storage: sin acentos, sin espacios, sin barras.
// Un nombre con "/" crea carpetas fantasma dentro del bucket.
export function safeName(name) {
  return String(name || "file")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 120) || "file";
}

export function slug(s) {
  return String(s || "misc").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "misc";
}

export const humanSize = (n) => {
  if (!n && n !== 0) return "—";
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(0) + " KB";
  return (n / 1024 / 1024).toFixed(1) + " MB";
};

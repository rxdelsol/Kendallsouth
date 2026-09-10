// src/utils/credStatus.js
// Lógica compartida de semáforo de vencimientos para seguros y credenciales de doctores.

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const t = new Date(String(dateStr).slice(0, 10) + "T00:00:00");
  if (isNaN(t)) return null;
  const now = new Date();
  return Math.floor((t - now) / (1000 * 60 * 60 * 24));
}

// Suma días a una fecha 'YYYY-MM-DD' y devuelve 'YYYY-MM-DD'.
export function addDays(dateStr, days) {
  if (!dateStr) return null;
  const t = new Date(String(dateStr).slice(0, 10) + "T00:00:00");
  if (isNaN(t)) return null;
  t.setDate(t.getDate() + days);
  return t.toISOString().slice(0, 10);
}

// Devuelve el "bucket" de estado a partir de una fecha de vencimiento.
export function statusOf(dateStr) {
  if (!dateStr) return "nodate";
  const d = daysUntil(dateStr);
  if (d === null) return "nodate";
  if (d < 0) return "expired";
  if (d <= 30) return "d30";
  if (d <= 60) return "d60";
  if (d <= 90) return "d90";
  return "ok";
}

export const STATUS_META = {
  expired: { cls: "sem-expired", label: "Expired" },
  d30: { cls: "sem-30", label: "≤ 30 days" },
  d60: { cls: "sem-60", label: "≤ 60 days" },
  d90: { cls: "sem-90", label: "≤ 90 days" },
  ok: { cls: "sem-ok", label: "Current" },
  nodate: { cls: "sem-nodate", label: "No date" },
};

// Orden de severidad (para elegir el estado "peor" de un doctor).
const SEVERITY = { expired: 0, d30: 1, d60: 2, d90: 3, ok: 4, nodate: 5 };
export function worseStatus(a, b) {
  return SEVERITY[a] <= SEVERITY[b] ? a : b;
}

export const CAQH_ATTEST_DAYS = 120; // CAQH exige re-atestar cada 120 días

// Credenciales que no son del clínico sino de la operación: permisos del local,
// entrenamientos anuales, mantenimiento de equipos. Son sugerencias para llenar
// el formulario de un clic; el usuario puede escribir cualquier otra.
export const EXTRA_CRED_PRESETS = [
  { label: "Permiso de residuos biomédicos", action: "Pagar en MyFloridaEHPermit.com y enviar la solicitud de renovación y el reporte anual al DOH del condado. El pago por sí solo no renueva el permiso." },
  { label: "Calibración y mantenimiento de equipos", action: "Agendar la visita anual del proveedor de servicio y archivar el reporte firmado." },
  { label: "Capacitación OSHA", action: "Repetir el curso anual: patógenos sanguíneos, HazCom y 64E-16 FAC." },
  { label: "Capacitación HIPAA / HITECH", action: "Repetir el curso anual y actualizar el Security Risk Analysis." },
  { label: "CLIA", action: "Renovar el certificado con CMS antes del vencimiento." },
  { label: "Licencia AHCA de la clínica", action: "Renovar con AHCA. Empieza 90 días antes." },
  { label: "Business tax receipt", action: "Renovar con el condado y con el municipio. En Florida vence el 30 de septiembre." },
  { label: "Certificate of Use", action: "Renovar con el municipio." },
  { label: "Inspección de bomberos", action: "Agendar la inspección anual." },
  { label: "Revalidación de Medicaid", action: "Revalidar con AHCA (cada 5 años)." },
  { label: "Registro de equipos de rayos X", action: "Renovar con el DOH Bureau of Radiation Control." },
];

// Normaliza la lista de credenciales adicionales guardada en el registro.
// Descarta las que no tienen etiqueta: una fila sin nombre no se puede leer
// en la ficha ni explicar en el correo de aviso.
export function extraCredentials(d = {}) {
  const xs = Array.isArray(d.extraCreds) ? d.extraCreds : [];
  return xs
    .filter((c) => c && String(c.label || "").trim())
    .map((c, i) => ({
      key: "x" + i + "-" + String(c.label).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40),
      label: String(c.label).trim(),
      date: c.date ? String(c.date).slice(0, 10) : null,
      action: String(c.action || "").trim(),
      extra: true,
    }));
}

// Construye la lista de credenciales con fecha de un doctor.
// CAQH usa fecha de última atestación → vence a los 120 días.
// Las adicionales van al final y se pintan igual que las fijas: mismo
// semáforo, misma barra, mismos días, y entran en el correo de aviso.
export function doctorCredentials(d = {}) {
  const caqhDue = d.caqhAttested ? addDays(d.caqhAttested, CAQH_ATTEST_DAYS) : null;
  const fijas = [
    { key: "license", label: "Florida license", date: d.licenseExp || null, action: "Renew with the Florida MQA board and upload to CAQH." },
    { key: "dea", label: "DEA registration", date: d.deaExp || null, action: "Renew at deadiversion.usdoj.gov before it expires." },
    { key: "caqh", label: "CAQH re-attestation", date: caqhDue, action: "Re-attest at proview.caqh.org (every 120 days).", base: d.caqhAttested || null },
    { key: "malpractice", label: "Malpractice / COI", date: d.malpracticeExp || null, action: "Renew the policy and upload the declarations page to CAQH and payers." },
    { key: "medicare", label: "Medicare revalidation", date: d.medicareRevalidation || null, action: "Revalidate in PECOS (pecos.cms.hhs.gov) before the deadline (every 5 years)." },
  ];
  return fijas.concat(extraCredentials(d));
}

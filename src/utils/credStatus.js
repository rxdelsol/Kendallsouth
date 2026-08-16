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
  expired: { cls: "sem-expired", label: "Vencido" },
  d30: { cls: "sem-30", label: "≤ 30 días" },
  d60: { cls: "sem-60", label: "≤ 60 días" },
  d90: { cls: "sem-90", label: "≤ 90 días" },
  ok: { cls: "sem-ok", label: "Vigente" },
  nodate: { cls: "sem-nodate", label: "Sin fecha" },
};

// Orden de severidad (para elegir el estado "peor" de un doctor).
const SEVERITY = { expired: 0, d30: 1, d60: 2, d90: 3, ok: 4, nodate: 5 };
export function worseStatus(a, b) {
  return SEVERITY[a] <= SEVERITY[b] ? a : b;
}

export const CAQH_ATTEST_DAYS = 120; // CAQH exige re-atestar cada 120 días

// Construye la lista de credenciales con fecha de un doctor.
// CAQH usa fecha de última atestación → vence a los 120 días.
export function doctorCredentials(d = {}) {
  const caqhDue = d.caqhAttested ? addDays(d.caqhAttested, CAQH_ATTEST_DAYS) : null;
  return [
    { key: "license", label: "Licencia FL", date: d.licenseExp || null, action: "Renovar en el portal de la junta médica de FL (MQA) y subir a CAQH." },
    { key: "dea", label: "DEA", date: d.deaExp || null, action: "Renovar en deadiversion.usdoj.gov antes de vencer." },
    { key: "caqh", label: "CAQH (re-atestar)", date: caqhDue, action: "Re-atestar en proview.caqh.org (cada 120 días).", base: d.caqhAttested || null },
    { key: "malpractice", label: "Malpractice/COI", date: d.malpracticeExp || null, action: "Renovar póliza y subir la declarations page a CAQH y pagadores." },
    { key: "medicare", label: "Medicare (revalidación)", date: d.medicareRevalidation || null, action: "Revalidar en PECOS (pecos.cms.hhs.gov) antes del deadline (cada 5 años)." },
  ];
}

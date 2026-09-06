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

// Construye la lista de credenciales con fecha de un doctor.
// CAQH usa fecha de última atestación → vence a los 120 días.
export function doctorCredentials(d = {}) {
  const caqhDue = d.caqhAttested ? addDays(d.caqhAttested, CAQH_ATTEST_DAYS) : null;
  return [
    { key: "license", label: "Florida license", date: d.licenseExp || null, action: "Renew with the Florida MQA board and upload to CAQH." },
    { key: "dea", label: "DEA registration", date: d.deaExp || null, action: "Renew at deadiversion.usdoj.gov before it expires." },
    { key: "caqh", label: "CAQH re-attestation", date: caqhDue, action: "Re-attest at proview.caqh.org (every 120 days).", base: d.caqhAttested || null },
    { key: "malpractice", label: "Malpractice / COI", date: d.malpracticeExp || null, action: "Renew the policy and upload the declarations page to CAQH and payers." },
    { key: "medicare", label: "Medicare revalidation", date: d.medicareRevalidation || null, action: "Revalidate in PECOS (pecos.cms.hhs.gov) before the deadline (every 5 years)." },
  ];
}

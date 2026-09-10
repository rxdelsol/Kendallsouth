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

// Only http(s) links are allowed through. A credential row renders its URL as a
// clickable link, so a javascript: or data: value here would be an XSS hole.
export function safeUrl(u) {
  const s = String(u || "").trim();
  if (!s) return "";
  try {
    const parsed = new URL(s.includes("://") ? s : "https://" + s);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : "";
  } catch {
    return "";
  }
}

// Credentials that belong to the practice rather than to the clinician: site
// permits, annual training, equipment service. These are one-click starters for
// the form — any other label can be typed by hand.
// Only URLs printed on the actual renewal notice or already named by the app are
// filled in. The rest are left blank on purpose: a wrong renewal link is worse
// than no link.
export const EXTRA_CRED_PRESETS = [
  { label: "Biomedical waste permit", action: "Pay the fee, then email the renewal application and the annual report to the county DOH. Paying alone does not renew the permit.", url: "https://www.myfloridaehpermit.com/" },
  { label: "Equipment calibration and service", action: "Book the annual vendor visit and file the signed report.", url: "" },
  { label: "OSHA training", action: "Repeat the annual course: bloodborne pathogens, HazCom and 64E-16 FAC.", url: "" },
  { label: "HIPAA / HITECH training", action: "Repeat the annual course and update the Security Risk Analysis.", url: "" },
  { label: "CLIA certificate", action: "Renew the certificate with CMS before it expires.", url: "" },
  { label: "AHCA clinic license", action: "Renew with AHCA. Start 90 days out.", url: "https://ahca.myflorida.com/provider/licensure.html" },
  { label: "Business tax receipt", action: "Renew with the county and the city. In Florida it lapses September 30.", url: "" },
  { label: "Certificate of Use", action: "Renew with the city.", url: "" },
  { label: "Fire inspection", action: "Book the annual inspection.", url: "" },
  { label: "Medicaid revalidation", action: "Revalidate with AHCA (every 5 years).", url: "" },
  { label: "X-ray equipment registration", action: "Renew with the DOH Bureau of Radiation Control.", url: "" },
];

// Normalizes the extra credentials stored on a record. Rows without a label are
// dropped: a nameless row can't be read in the record or explained in the alert
// email.
export function extraCredentials(d = {}) {
  const xs = Array.isArray(d.extraCreds) ? d.extraCreds : [];
  return xs
    .filter((c) => c && String(c.label || "").trim())
    .map((c, i) => ({
      key: "x" + i + "-" + String(c.label).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40),
      label: String(c.label).trim(),
      date: c.date ? String(c.date).slice(0, 10) : null,
      action: String(c.action || "").trim(),
      url: safeUrl(c.url),
      extra: true,
    }));
}

// Builds the dated credential list for a provider.
// CAQH is stored as the last attestation date → it comes due 120 days later.
// Extras go last and render exactly like the fixed five: same traffic light,
// same bar, same day count, and they reach the alert email.
export function doctorCredentials(d = {}) {
  const caqhDue = d.caqhAttested ? addDays(d.caqhAttested, CAQH_ATTEST_DAYS) : null;
  const fixed = [
    { key: "license", label: "Florida license", date: d.licenseExp || null, action: "Renew with the Florida MQA board and upload to CAQH.", url: "https://www.flhealthsource.gov/" },
    { key: "dea", label: "DEA registration", date: d.deaExp || null, action: "Renew at deadiversion.usdoj.gov before it expires.", url: "https://www.deadiversion.usdoj.gov/drugreg/index.html" },
    { key: "caqh", label: "CAQH re-attestation", date: caqhDue, action: "Re-attest at proview.caqh.org (every 120 days).", base: d.caqhAttested || null, url: "https://proview.caqh.org/" },
    { key: "malpractice", label: "Malpractice / COI", date: d.malpracticeExp || null, action: "Renew the policy and upload the declarations page to CAQH and payers.", url: "" },
    { key: "medicare", label: "Medicare revalidation", date: d.medicareRevalidation || null, action: "Revalidate in PECOS (pecos.cms.hhs.gov) before the deadline (every 5 years).", url: "https://pecos.cms.hhs.gov/" },
  ];
  // No DEA number on file means this record doesn't prescribe controlled
  // substances — a physical therapist, a counselor, the clinic entity itself.
  // Showing them a DEA line that will never carry a date is noise, and it makes
  // the "missing dates" filter accuse them of a gap they can't close.
  return fixed
    .filter((c) => (c.key === "dea" ? Boolean(d.dea || d.deaExp) : true))
    .concat(extraCredentials(d));
}

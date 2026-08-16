// api/availity-eligibility.js
// Verifica la ELEGIBILIDAD/cobertura de un PACIENTE con un pagador vía Availity
// (transacciones 270/271 a través de la Coverages API).
//
// ⚠️ Esto NO dice "el proveedor está en la red"; dice si ESE paciente tiene
// cobertura activa con ESE plan a la fecha. Availity no ofrece API de red.
//
// Requiere variables de entorno (Vercel → Settings → Environment Variables):
//   AVAILITY_CLIENT_ID
//   AVAILITY_CLIENT_SECRET
//   AVAILITY_SCOPE            (opcional, por defecto "hipaa")
//   AVAILITY_BASE            (opcional, por defecto "https://api.availity.com")
//   AVAILITY_COVERAGES_PATH  (opcional, por defecto "/availity/v1/coverages")
//
// Las credenciales las pega el usuario en Vercel; nunca viajan al navegador.
//
// POST body (JSON): { payerId, memberId, dateOfBirth, providerNpi, asOfDate?, serviceType? }

const BASE = process.env.AVAILITY_BASE || 'https://api.availity.com';
const COVERAGES_PATH = process.env.AVAILITY_COVERAGES_PATH || '/availity/v1/coverages';
const SCOPE = process.env.AVAILITY_SCOPE || 'hipaa';

async function getToken() {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.AVAILITY_CLIENT_ID,
    client_secret: process.env.AVAILITY_CLIENT_SECRET,
    scope: SCOPE,
  });
  const r = await fetch(`${BASE}/v1/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!r.ok) throw new Error(`token ${r.status}: ${await r.text()}`);
  const j = await r.json();
  return j.access_token;
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  if (!process.env.AVAILITY_CLIENT_ID || !process.env.AVAILITY_CLIENT_SECRET) {
    return res.status(200).json({
      ok: true,
      configured: false,
      reason: 'Faltan AVAILITY_CLIENT_ID / AVAILITY_CLIENT_SECRET en Vercel.',
    });
  }

  const { payerId, memberId, dateOfBirth, providerNpi, asOfDate, serviceType } = req.body || {};
  if (!payerId || !memberId || !providerNpi) {
    return res.status(400).json({ ok: false, error: 'Se requieren payerId, memberId y providerNpi.' });
  }

  try {
    const token = await getToken();
    const authHeaders = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    // Cuerpo del 270. La forma exacta puede variar según tu cuenta/pagador;
    // ajusta estos campos con la referencia de Coverages de tu portal si hace falta.
    const payload = {
      payerId,
      asOfDate: asOfDate || new Date().toISOString().slice(0, 10),
      providers: [{ npi: providerNpi, providerType: 'BillingProvider' }],
      subscriber: { memberId, dateOfBirth: dateOfBirth || undefined },
      serviceType: serviceType || '30', // 30 = Health Benefit Plan Coverage (general)
    };

    let r = await fetch(`${BASE}${COVERAGES_PATH}`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(payload),
    });
    let data = await r.json().catch(() => ({}));

    // La Coverages API es asíncrona: si devuelve un id y status en proceso, se hace polling.
    let id = data.id;
    let status = (data.status || '').toLowerCase();
    let tries = 0;
    while (id && status && status !== 'complete' && tries < 5) {
      await sleep(1200);
      const pr = await fetch(`${BASE}${COVERAGES_PATH}/${id}`, { headers: authHeaders });
      data = await pr.json().catch(() => ({}));
      status = (data.status || '').toLowerCase();
      tries++;
    }

    if (!r.ok && !id) {
      return res.status(502).json({ ok: false, error: 'Availity error', detail: data });
    }

    // Interpretación best-effort del 271. Se devuelve raw para poder ajustar el mapping.
    const plans = data.plans || data.benefits || [];
    const activeText = JSON.stringify(data).toLowerCase();
    const active =
      activeText.includes('"active"') ||
      activeText.includes('active coverage') ||
      plans.some?.((p) => (p.status || p.coverageStatus || '').toLowerCase().includes('active'));

    return res.status(200).json({
      ok: true,
      configured: true,
      active: !!active,
      status: data.status || null,
      raw: data, // útil para mapear los campos exactos de tu pagador la primera vez
    });
  } catch (err) {
    console.error('availity-eligibility error:', String(err.message || err));
    return res.status(502).json({ ok: false, error: 'No se pudo consultar Availity.', detail: String(err.message || err) });
  }
}

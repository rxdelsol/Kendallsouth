// api/cron-check-expirations.js
// Revisa vencimientos de CONTRATOS de seguros y de CREDENCIALES de doctores en
// Supabase y envía un email de alerta vía Resend.
// Se dispara con Vercel Cron (ver vercel.json) o manualmente:
//   GET /api/cron-check-expirations?secret=TU_CRON_SECRET
//
// Variables de entorno (Vercel → Settings → Environment Variables):
//   SUPABASE_URL            (ya existe)
//   SUPABASE_SERVICE_ROLE   (ya existe)
//   RESEND_API_KEY          (de resend.com)
//   ALERT_EMAIL_TO          (destinatario/s, separados por coma)
//   ALERT_EMAIL_FROM        (remitente verificado en Resend)
//   CRON_SECRET             (clave inventada para proteger el endpoint)

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

const WARN_WITHIN_DAYS = 90;     // avisar de lo vencido o que vence dentro de N días
const CAQH_ATTEST_DAYS = 120;    // CAQH vence 120 días después de la atestación

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const t = new Date(String(dateStr).slice(0, 10) + 'T00:00:00');
  if (isNaN(t)) return null;
  const now = new Date();
  return Math.ceil((t - now) / (1000 * 60 * 60 * 24));
}
function addDays(dateStr, days) {
  if (!dateStr) return null;
  const t = new Date(String(dateStr).slice(0, 10) + 'T00:00:00');
  if (isNaN(t)) return null;
  t.setDate(t.getDate() + days);
  return t.toISOString().slice(0, 10);
}

function isAuthorized(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = req.headers['authorization'] || '';
  if (auth === `Bearer ${secret}`) return true;
  const q = (req.query && (req.query.secret || req.query.key)) || '';
  return q === secret;
}

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  try {
    // ---- 1) Contratos de seguros ----
    const { data: insRows, error: insErr } = await supabase
      .from('insurances').select('*').not('expiration', 'is', null);
    if (insErr) throw insErr;

    const insItems = (insRows || [])
      .map((r) => ({
        name: r.name,
        detail: r.doctor_name || '—',
        type: r.type || '',
        date: r.expiration,
        days: daysUntil(r.expiration),
      }))
      .filter((r) => r.days !== null && r.days <= WARN_WITHIN_DAYS)
      .sort((a, b) => a.days - b.days);

    // ---- 2) Credenciales de doctores ----
    const { data: docRows, error: docErr } = await supabase
      .from('doctors').select('*');
    if (docErr) throw docErr;

    const credItems = [];
    (docRows || []).forEach((d) => {
      const creds = [
        { label: 'Licencia FL', date: d.license_exp },
        { label: 'DEA', date: d.dea_exp },
        { label: 'CAQH (re-atestar)', date: d.caqh_attested ? addDays(d.caqh_attested, CAQH_ATTEST_DAYS) : null },
        { label: 'Malpractice', date: d.malpractice_exp },
        { label: 'Medicare (revalidación)', date: d.medicare_revalidation },
      ];
      creds.forEach((c) => {
        const days = daysUntil(c.date);
        if (days !== null && days <= WARN_WITHIN_DAYS) {
          credItems.push({ name: d.name, detail: c.label, type: '', date: c.date, days });
        }
      });
    });
    credItems.sort((a, b) => a.days - b.days);

    const totalItems = insItems.length + credItems.length;
    if (totalItems === 0) {
      return res.status(200).json({ ok: true, sent: false, message: 'Nada por vencer.' });
    }

    const bucket = (arr, lo, hi) => arr.filter((i) => i.days >= lo && i.days <= hi);
    const bExpired = (arr) => arr.filter((i) => i.days < 0);

    const html = buildEmailHtml({
      ins: {
        expired: bExpired(insItems), d30: bucket(insItems, 0, 30),
        d60: bucket(insItems, 31, 60), d90: bucket(insItems, 61, 90),
      },
      cred: {
        expired: bExpired(credItems), d30: bucket(credItems, 0, 30),
        d60: bucket(credItems, 31, 60), d90: bucket(credItems, 61, 90),
      },
    });

    const insExpired = bExpired(insItems).length;
    const credExpired = bExpired(credItems).length;

    if (!process.env.RESEND_API_KEY || !process.env.ALERT_EMAIL_TO || !process.env.ALERT_EMAIL_FROM) {
      return res.status(200).json({
        ok: true, sent: false,
        reason: 'Faltan RESEND_API_KEY / ALERT_EMAIL_TO / ALERT_EMAIL_FROM',
        counts: { insurances: insItems.length, credentials: credItems.length, expired: insExpired + credExpired },
      });
    }

    const to = process.env.ALERT_EMAIL_TO.split(',').map((s) => s.trim()).filter(Boolean);
    const subject = `[Credentialing] ${insExpired + credExpired} vencido(s) · ${totalItems} por revisar`;

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: process.env.ALERT_EMAIL_FROM, to, subject, html }),
    });

    if (!emailRes.ok) {
      const txt = await emailRes.text();
      console.error('Resend error:', txt);
      return res.status(502).json({ ok: false, error: 'Resend failed', detail: txt });
    }

    return res.status(200).json({
      ok: true, sent: true,
      counts: { insurances: insItems.length, credentials: credItems.length, expired: insExpired + credExpired },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: 'Unexpected error' });
  }
}

function row(i) {
  const d = i.days < 0 ? `vencido hace ${Math.abs(i.days)}d` : `en ${i.days}d`;
  const fecha = new Date(i.date).toLocaleDateString('es-US');
  return `<tr>
    <td style="padding:6px 10px;border-bottom:1px solid #eee">${escapeHtml(i.name)}</td>
    <td style="padding:6px 10px;border-bottom:1px solid #eee">${escapeHtml(i.detail)}</td>
    <td style="padding:6px 10px;border-bottom:1px solid #eee">${fecha}</td>
    <td style="padding:6px 10px;border-bottom:1px solid #eee;font-weight:600">${d}</td>
  </tr>`;
}

function section(title, color, items, col2) {
  if (!items.length) return '';
  return `
    <h3 style="margin:16px 0 6px;color:${color}">${title} (${items.length})</h3>
    <table style="border-collapse:collapse;width:100%;font-size:14px">
      <thead><tr style="text-align:left;color:#555">
        <th style="padding:6px 10px">${col2 === 'doctor' ? 'Doctor' : 'Aseguradora'}</th>
        <th style="padding:6px 10px">${col2 === 'doctor' ? 'Credencial' : 'Doctor'}</th>
        <th style="padding:6px 10px">Vence</th>
        <th style="padding:6px 10px">Plazo</th>
      </tr></thead>
      <tbody>${items.map(row).join('')}</tbody>
    </table>`;
}

function block(title, groups, col2) {
  const inner =
    section('🔴 Vencidos', '#b91c1c', groups.expired, col2) +
    section('🟠 ≤ 30 días', '#c2410c', groups.d30, col2) +
    section('🟡 31–60 días', '#a16207', groups.d60, col2) +
    section('🔵 61–90 días', '#0e7490', groups.d90, col2);
  if (!inner) return '';
  return `<h2 style="color:#0d1b33;margin-top:24px;border-bottom:2px solid #e5e7eb;padding-bottom:4px">${title}</h2>${inner}`;
}

function buildEmailHtml({ ins, cred }) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:720px;margin:0 auto">
    <h1 style="color:#0d1b33;font-size:20px">Kendall South — Alerta de Credentialing</h1>
    <p style="color:#444">Contratos de seguros y credenciales de doctores vencidos o próximos a vencer.</p>
    ${block('Contratos de seguros', ins, 'insurance')}
    ${block('Credenciales de doctores', cred, 'doctor')}
    <p style="margin-top:22px;color:#666;font-size:12px">Aviso automático. Abre el tracker para gestionar cada punto.</p>
  </div>`;
}

function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// api/refresh-doctors.js
// Actualiza TODOS los doctores a la vez desde el registro nacional NPPES:
// refresca taxonomía (autoritativa), y rellena licencia/nombre si están vacíos.
// No sobreescribe la licencia ni el nombre que ya tengas (solo rellena huecos).
// GET o POST /api/refresh-doctors

import { createClient } from '@supabase/supabase-js';
import { lookupFloridaLicense } from './_lib/licenseFlorida.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

async function fetchNppes(npi) {
  try {
    const r = await fetch(`https://npiregistry.cms.hhs.gov/api/?version=2.1&number=${npi}`);
    const data = await r.json();
    if (!data.result_count) return null;
    const rec = data.results[0];
    const b = rec.basic || {};
    const tax = (rec.taxonomies || []).find((t) => t.primary) || (rec.taxonomies || [])[0] || {};
    const name = rec.enumeration_type === 'NPI-2'
      ? (b.organization_name || '')
      : `${b.first_name || ''} ${b.last_name || ''}`.trim();
    return {
      found: true,
      active: (b.status || '').toUpperCase() === 'A',
      name,
      taxonomy: tax.desc || null,
      license: tax.license || null,
      licenseState: tax.state || null,
    };
  } catch (e) {
    return null;
  }
}

// Fecha de revalidación de Medicare (CMS "Revalidation Due Date List").
//
// OJO: CMS publica una VERSIÓN NUEVA CADA MES, con un UUID distinto, y la
// vieja sigue respondiendo. Un UUID fijo en el código no falla: sirve datos
// viejos para siempre, en silencio — justo el modo de fallo que hace perder
// una revalidación. Por eso se resuelve en caliente desde el catálogo de
// CMS y el UUID fijo queda solo como último recurso.
const REVAL_FALLBACK =
  'https://data.cms.gov/data-api/v1/dataset/3746498e-874d-45d8-9c69-68603cafea60/data?filter[National%20Provider%20Identifier]={npi}';
const REVAL_API = process.env.CMS_REVALIDATION_API || null;

let revalBaseCache = null;
async function resolveRevalidationBase() {
  if (REVAL_API) return REVAL_API;
  if (revalBaseCache) return revalBaseCache;
  try {
    const r = await fetch('https://data.cms.gov/data.json', { headers: { Accept: 'application/json' } });
    if (r.ok) {
      const cat = await r.json();
      const ds = (cat.dataset || []).filter((d) => /^Revalidation Due Date List$/i.test((d.title || '').trim()));
      // El más reciente por fecha de modificación.
      ds.sort((a, b) => String(b.modified || '').localeCompare(String(a.modified || '')));
      const url = (ds[0]?.distribution || [])
        .map((d) => d.accessURL || d.downloadURL)
        .find((u) => u && /data-api\/v1\/dataset\/[0-9a-f-]+\/data/i.test(u));
      if (url) {
        revalBaseCache = `${url.split('?')[0]}?filter[National%20Provider%20Identifier]={npi}`;
        return revalBaseCache;
      }
    }
  } catch (e) { /* se usa el respaldo */ }
  revalBaseCache = REVAL_FALLBACK;
  return revalBaseCache;
}

function normalizeDate(s) {
  if (!s) return null;
  s = String(s).trim();
  if (!s || /tbd/i.test(s)) return null;
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); // MM/DD/YYYY
  if (m) return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);   // YYYY-MM-DD
  return null;
}

async function fetchRevalidation(npi) {
  try {
    const base = await resolveRevalidationBase();
    const r = await fetch(base.replace('{npi}', encodeURIComponent(npi)), { headers: { Accept: 'application/json' } });
    if (!r.ok) return null;
    const rows = await r.json();
    for (const row of Array.isArray(rows) ? rows : []) {
      const raw = (row['Revalidation Due Date'] || '').trim() || (row['Adjusted Due Date'] || '').trim();
      const d = normalizeDate(raw);
      if (d) return d;
    }
    return null;
  } catch (e) {
    return null;
  }
}

export default async function handler(req, res) {
  try {
    const { data: doctors, error } = await supabase.from('doctors').select('*');
    if (error) throw error;

    const results = await Promise.all(
      (doctors || []).map(async (d) => {
        const npi = (d.npi || '').toString().trim();
        if (!/^\d{10}$/.test(npi)) return { id: d.id, name: d.name, status: 'sin-npi' };

        const [n, reval] = await Promise.all([fetchNppes(npi), fetchRevalidation(npi)]);
        if (!n || !n.found) return { id: d.id, name: d.name, npi, status: 'no-encontrado' };

        // Refresca taxonomía y rellena huecos de licencia/nombre.
        // Medicare revalidación: si CMS publica una fecha, la carga automáticamente.
        const update = {
          taxonomy: n.taxonomy || d.taxonomy || null,
          license: d.license || n.license || null,
          name: d.name || n.name || null,
          medicare_revalidation: reval || d.medicare_revalidation || null,
        };
        // Si aún no corrieron la migración, medicare_revalidation no existe: reintenta sin esa columna.
        let upErr = (await supabase.from('doctors').update(update).eq('id', d.id)).error;
        if (upErr && /column|schema cache|does not exist|could not find/i.test(upErr.message || '')) {
          const { medicare_revalidation, ...baseUpdate } = update;
          upErr = (await supabase.from('doctors').update(baseUpdate).eq('id', d.id)).error;
        }
        if (upErr) return { id: d.id, name: d.name, npi, status: 'error', detail: upErr.message };

        return {
          id: d.id, name: d.name || n.name, npi, status: 'actualizado',
          active: n.active, taxonomy: update.taxonomy, licenseState: n.licenseState,
          medicareRevalidation: reval || null,
        };
      })
    );

    // Vencimiento de licencia de Florida. Va DESPUÉS y en serie, no dentro
    // del Promise.all: son dos peticiones por doctor a un sitio del estado y
    // no corresponde dispararle 28 a la vez. Solo se consulta a quien le
    // falta la fecha; nunca se pisa una que ya cargaste a mano.
    const FL_BUDGET_MS = 40000;
    const flDeadline = Date.now() + FL_BUDGET_MS;
    const licencias = { consultadas: 0, cargadas: 0, sinDato: 0, motivos: [] };

    for (const r of results) {
      if (r.status !== 'actualizado') continue;
      if (Date.now() > flDeadline) { licencias.motivos.push('se agotó el tiempo; quedaron doctores sin consultar'); break; }
      const d = (doctors || []).find((x) => x.id === r.id);
      if (!d || d.license_exp) continue;
      const lic = (d.license || '').trim();
      if (!lic) continue;

      licencias.consultadas += 1;
      const fl = await lookupFloridaLicense(lic, d.name || r.name || '');
      if (!fl.ok || !fl.expiration) {
        licencias.sinDato += 1;
        licencias.motivos.push(`${d.name || lic}: ${fl.reason || 'sin dato'}`);
        continue;
      }
      const { error: licErr } = await supabase
        .from('doctors')
        .update({ license_exp: fl.expiration })
        .eq('id', d.id);
      if (licErr) {
        licencias.sinDato += 1;
        licencias.motivos.push(`${d.name || lic}: no se pudo guardar (${licErr.message})`);
      } else {
        licencias.cargadas += 1;
        r.licenseExp = fl.expiration;
        r.licenseStatus = fl.status || null;
      }
    }

    const summary = {
      total: results.length,
      actualizado: results.filter((r) => r.status === 'actualizado').length,
      noEncontrado: results.filter((r) => r.status === 'no-encontrado').length,
      sinNpi: results.filter((r) => r.status === 'sin-npi').length,
      error: results.filter((r) => r.status === 'error').length,
      revalidacion: results.filter((r) => r.medicareRevalidation).length,
      licencias,
    };

    return res.status(200).json({ ok: true, summary, results });
  } catch (err) {
    console.error('refresh-doctors error:', err);
    return res.status(500).json({ ok: false, error: 'No se pudo actualizar desde NPPES.' });
  }
}

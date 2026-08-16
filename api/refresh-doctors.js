// api/refresh-doctors.js
// Actualiza TODOS los doctores a la vez desde el registro nacional NPPES:
// refresca taxonomía (autoritativa), y rellena licencia/nombre si están vacíos.
// No sobreescribe la licencia ni el nombre que ya tengas (solo rellena huecos).
// GET o POST /api/refresh-doctors

import { createClient } from '@supabase/supabase-js';

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
// El UUID del dataset cambia cada mes; se puede sobreescribir con CMS_REVALIDATION_API.
const REVAL_API = process.env.CMS_REVALIDATION_API ||
  'https://data.cms.gov/data-api/v1/dataset/7f218c9f-be04-4bde-9503-33ce89c87424/data?filter[National%20Provider%20Identifier]={npi}';

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
    const r = await fetch(REVAL_API.replace('{npi}', encodeURIComponent(npi)), { headers: { Accept: 'application/json' } });
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

    const summary = {
      total: results.length,
      actualizado: results.filter((r) => r.status === 'actualizado').length,
      noEncontrado: results.filter((r) => r.status === 'no-encontrado').length,
      sinNpi: results.filter((r) => r.status === 'sin-npi').length,
      error: results.filter((r) => r.status === 'error').length,
      revalidacion: results.filter((r) => r.medicareRevalidation).length,
    };

    return res.status(200).json({ ok: true, summary, results });
  } catch (err) {
    console.error('refresh-doctors error:', err);
    return res.status(500).json({ ok: false, error: 'No se pudo actualizar desde NPPES.' });
  }
}

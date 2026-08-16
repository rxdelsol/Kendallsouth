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

export default async function handler(req, res) {
  try {
    const { data: doctors, error } = await supabase.from('doctors').select('*');
    if (error) throw error;

    const results = await Promise.all(
      (doctors || []).map(async (d) => {
        const npi = (d.npi || '').toString().trim();
        if (!/^\d{10}$/.test(npi)) return { id: d.id, name: d.name, status: 'sin-npi' };

        const n = await fetchNppes(npi);
        if (!n || !n.found) return { id: d.id, name: d.name, npi, status: 'no-encontrado' };

        // Refresca taxonomía (autoritativa) y rellena huecos de licencia/nombre.
        const update = {
          taxonomy: n.taxonomy || d.taxonomy || null,
          license: d.license || n.license || null,
          name: d.name || n.name || null,
        };
        const { error: upErr } = await supabase.from('doctors').update(update).eq('id', d.id);
        if (upErr) return { id: d.id, name: d.name, npi, status: 'error', detail: upErr.message };

        return {
          id: d.id, name: d.name || n.name, npi, status: 'actualizado',
          active: n.active, taxonomy: update.taxonomy, licenseState: n.licenseState,
        };
      })
    );

    const summary = {
      total: results.length,
      actualizado: results.filter((r) => r.status === 'actualizado').length,
      noEncontrado: results.filter((r) => r.status === 'no-encontrado').length,
      sinNpi: results.filter((r) => r.status === 'sin-npi').length,
      error: results.filter((r) => r.status === 'error').length,
    };

    return res.status(200).json({ ok: true, summary, results });
  } catch (err) {
    console.error('refresh-doctors error:', err);
    return res.status(500).json({ ok: false, error: 'No se pudo actualizar desde NPPES.' });
  }
}

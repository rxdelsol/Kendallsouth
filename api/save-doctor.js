// api/save-doctor.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const body = req.body || {};
  const {
    id,
    name,
    npi,
    license,
    caqh,
    medicaid,
    medicare,
    dob,
    taxonomy,
  } = body;

  if (!name || !name.trim()) {
    return res.status(400).json({ ok: false, error: 'Name is required' });
  }

  // Campos base (siempre existen)
  const base = {
    external_id: body.external_id || body.id || null,
    name: name.trim(),
    npi: npi || null,
    license: license || null,
    caqh: caqh || null,
    medicaid: medicaid || null,
    medicare: medicare || null,
    dob: dob || null,        // 'YYYY-MM-DD' o null
    taxonomy: taxonomy || null,
  };
  // Fechas de vencimiento (requieren la migración supabase-migration.sql).
  const dateFields = {
    license_exp: body.licenseExp || null,
    dea: body.dea || null,
    dea_exp: body.deaExp || null,
    caqh_attested: body.caqhAttested || null,
    malpractice_exp: body.malpracticeExp || null,
    medicare_revalidation: body.medicareRevalidation || null,
  };

  async function upsert(payload) {
    if (id) {
      return supabase.from('doctors').update(payload).eq('id', id).select().single();
    }
    return supabase.from('doctors').insert(payload).select().single();
  }

  // ¿El error es porque faltan las columnas de fecha (migración no corrida)?
  const missingColumns = (error) =>
    error && /column|schema cache|does not exist|could not find/i.test(error.message || String(error));

  try {
    let datesSaved = true;
    let { data, error } = await upsert({ ...base, ...dateFields });

    if (error && missingColumns(error)) {
      // Reintenta solo con los campos base para que agregar/guardar nunca falle.
      datesSaved = false;
      ({ data, error } = await upsert(base));
    }
    if (error) throw error;

    return res.status(200).json({ ok: true, data, datesSaved });
  } catch (err) {
    console.error('save-doctor error:', err);
    return res
      .status(500)
      .json({ ok: false, error: 'Database error while saving doctor' });
  }
}

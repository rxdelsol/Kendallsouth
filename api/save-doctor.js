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

  const payload = {
    // external_id lo usamos para mantener tu ID original del JSON
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

  try {
    let result;

    if (id) {
      // UPDATE por id
      const { data, error } = await supabase
        .from('doctors')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // INSERT nuevo doctor
      const { data, error } = await supabase
        .from('doctors')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return res.status(200).json({ ok: true, data: result });
  } catch (err) {
    console.error('save-doctor error:', err);
    return res
      .status(500)
      .json({ ok: false, error: 'Database error while saving doctor' });
  }
}

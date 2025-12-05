// api/save-insurance.js
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
    type,
    doctorName,
    network,
    expiration,
    notes,
  } = body;

  if (!name || !name.trim()) {
    return res.status(400).json({ ok: false, error: 'Name is required' });
  }

  const payload = {
    name: name.trim(),
    type: type || null,
    doctor_name: doctorName || null,
    network: network || null,
    expiration: expiration || null, // 'YYYY-MM-DD' o null
    notes: notes || null,
  };

  try {
    let result;

    if (id) {
      // UPDATE
      const { data, error } = await supabase
        .from('insurances')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // INSERT
      const { data, error } = await supabase
        .from('insurances')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return res.status(200).json({ ok: true, data: result });
  } catch (err) {
    console.error('save-insurance error:', err);
    return res
      .status(500)
      .json({ ok: false, error: 'Database error while saving insurance' });
  }
}

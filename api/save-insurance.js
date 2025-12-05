// api/save-insurance.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Invalid method' });
  }

  const ins = req.body;

  const payload = {
    name: ins.name,
    type: ins.type,
    doctor_name: ins.doctorName || null,
    network: ins.network,
    expiration: ins.expiration || null,
    notes: ins.notes || null,
  };

  try {
    let response;

    if (ins.id) {
      response = await supabase
        .from('insurances')
        .update(payload)
        .eq('id', ins.id)
        .select();
    } else {
      response = await supabase
        .from('insurances')
        .insert(payload)
        .select();
    }

    if (response.error) throw response.error;

    const row = response.data[0];

    return res.status(200).json({
      ok: true,
      data: {
        id: row.id,
        name: row.name,
        type: row.type,
        doctorName: row.doctor_name,
        network: row.network,
        expiration: row.expiration,
        notes: row.notes,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: 'DB save error' });
  }
}

// api/get-insurances.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export default async function handler(req, res) {
  try {
    const { data, error } = await supabase
      .from('insurances')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error(error);
      return res.status(500).json({ ok: false, error: 'Error fetching insurances' });
    }

    const mapped = data.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      doctorName: row.doctor_name,
      network: row.network,
      expiration: row.expiration,
      notes: row.notes,
    }));

    return res.status(200).json({ ok: true, data: mapped });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: 'Unexpected error' });
  }
}

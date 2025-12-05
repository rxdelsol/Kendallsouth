// api/get-doctors.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export default async function handler(req, res) {
  try {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error(error);
      return res.status(500).json({ ok: false, error: 'Error fetching doctors' });
    }

    const mapped = data.map((row) => ({
      id: row.id,
      externalId: row.external_id,
      name: row.name,
      npi: row.npi,
      license: row.license,
      caqh: row.caqh,
      medicaid: row.medicaid,
      medicare: row.medicare,
      dob: row.dob,
      taxonomy: row.taxonomy,
    }));

    return res.status(200).json({ ok: true, data: mapped });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: 'Unexpected error' });
  }
}

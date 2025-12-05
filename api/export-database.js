// api/export-database.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export default async function handler(req, res) {
  try {
    const [docRes, insRes] = await Promise.all([
      supabase.from('doctors').select('*'),
      supabase.from('insurances').select('*'),
    ]);

    if (docRes.error) throw docRes.error;
    if (insRes.error) throw insRes.error;

    const doctorsList = (docRes.data || []).map((row) => ({
      id: row.external_id || String(row.id),
      name: row.name,
      npi: row.npi,
      license: row.license,
      caqh: row.caqh,
      medicaid: row.medicaid,
      medicare: row.medicare,
      dob: row.dob,
      taxonomy: row.taxonomy,
    }));

    const insuranceList = (insRes.data || []).map((row) => ({
      name: row.name,
      type: row.type,
      doctor: row.doctor_external_id || null,
      doctorName: row.doctor_name,
      network: row.network,
      expiration: row.expiration,
      notes: row.notes,
    }));

    const payload = {
      doctorsList,
      insuranceList,
      doctorsByInsurance: [], // ya no lo usas, pero lo dejamos por compatibilidad
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="kendallsouth-database.json"'
    );
    return res.status(200).send(JSON.stringify(payload, null, 2));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: 'Export failed' });
  }
}

// api/import-database.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Invalid method' });
  }

  const body = req.body || {};
  const doctorsList = body.doctorsList || [];
  const insuranceList = body.insuranceList || [];

  try {
    // 1) Vaciar tablas (primero insurances por FK lógicas)
    let { error: insDelError } = await supabase
      .from('insurances')
      .delete()
      .gt('id', 0);
    if (insDelError) throw insDelError;

    let { error: docDelError } = await supabase
      .from('doctors')
      .delete()
      .gt('id', 0);
    if (docDelError) throw docDelError;

    // 2) Insertar doctores
    if (doctorsList.length) {
      const doctorsPayload = doctorsList.map((d) => ({
        external_id: d.id || d.external_id || null,
        name: d.name,
        npi: d.npi || null,
        license: d.license || null,
        caqh: d.caqh || null,
        medicaid: d.medicaid || null,
        medicare: d.medicare || null,
        dob: d.dob || null,
        taxonomy: d.taxonomy || null,
      }));

      const { error } = await supabase.from('doctors').insert(doctorsPayload);
      if (error) throw error;
    }

    // 3) Insertar insurances
    if (insuranceList.length) {
      const insPayload = insuranceList.map((i) => ({
        name: i.name,
        type: i.type,
        doctor_external_id: i.doctor || null,
        doctor_name: i.doctorName || null,
        network: i.network,
        expiration: i.expiration || null,
        notes: i.notes || null,
      }));

      const { error } = await supabase.from('insurances').insert(insPayload);
      if (error) throw error;
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: 'Import failed' });
  }
}

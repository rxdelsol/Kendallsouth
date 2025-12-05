import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      npi,
      specialty,
    } = req.body;

    const { data, error } = await supabase
      .from('providers')
      .insert([{
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        npi,
        specialty,
      }])
      .select();

    if (error) {
      console.error(error);
      return res.status(500).json({ ok: false, error: 'Error al guardar en la BD' });
    }

    return res.status(200).json({ ok: true, provider: data[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
  }
}

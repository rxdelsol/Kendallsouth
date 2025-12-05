// api/delete-doctor.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { id } = req.body || {};
  if (!id) {
    return res.status(400).json({ ok: false, error: 'Missing id' });
  }

  try {
    const { error } = await supabase.from('doctors').delete().eq('id', id);
    if (error) throw error;
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('delete-doctor error:', err);
    return res
      .status(500)
      .json({ ok: false, error: 'Error deleting doctor' });
  }
}

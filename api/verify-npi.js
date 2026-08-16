// api/verify-npi.js
// Verifica un NPI contra el registro público NPPES (CMS). Gratis, sin credenciales.
// Uso: GET /api/verify-npi?npi=1234567890
//   Opcional: &name=Apellido  → devuelve nameMatch para detectar inconsistencias.

export default async function handler(req, res) {
  const npi = (req.query.npi || '').toString().trim();
  const expectName = (req.query.name || '').toString().trim().toLowerCase();

  if (!/^\d{10}$/.test(npi)) {
    return res.status(400).json({ ok: false, error: 'NPI inválido (deben ser 10 dígitos).' });
  }

  try {
    const url = `https://npiregistry.cms.hhs.gov/api/?version=2.1&number=${npi}`;
    const r = await fetch(url);
    const data = await r.json();

    if (!data.result_count) {
      return res.status(200).json({ ok: true, found: false, npi });
    }

    const rec = data.results[0];
    const b = rec.basic || {};
    const tax = (rec.taxonomies || []).find((t) => t.primary) || (rec.taxonomies || [])[0] || {};
    const loc = (rec.addresses || []).find((a) => a.address_purpose === 'LOCATION') || (rec.addresses || [])[0] || {};
    const fullName = rec.enumeration_type === 'NPI-2'
      ? (b.organization_name || '')
      : `${b.first_name || ''} ${b.last_name || ''}`.trim();

    const out = {
      ok: true,
      found: true,
      npi,
      type: rec.enumeration_type,                 // NPI-1 (individual) / NPI-2 (org)
      name: fullName,
      credential: b.credential || null,
      status: b.status || null,                   // "A" = activo
      active: (b.status || '').toUpperCase() === 'A',
      enumerationDate: b.enumeration_date || null,
      lastUpdated: b.last_updated || null,
      taxonomy: tax.desc || null,
      taxonomyCode: tax.code || null,
      license: tax.license || null,
      licenseState: tax.state || null,
      city: loc.city || null,
      state: loc.state || null,
    };

    if (expectName) {
      out.nameMatch = fullName.toLowerCase().includes(expectName) ||
        expectName.split(/\s+/).some((w) => w.length > 2 && fullName.toLowerCase().includes(w));
    }

    return res.status(200).json(out);
  } catch (err) {
    console.error('verify-npi error:', err);
    return res.status(502).json({ ok: false, error: 'No se pudo consultar NPPES en este momento.' });
  }
}

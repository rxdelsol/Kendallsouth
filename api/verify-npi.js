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
    const mail = (rec.addresses || []).find((a) => a.address_purpose === 'MAILING') || null;

    // Direccion tal cual la publica NPPES, en una sola linea, para poder
    // compararla contra la que publica cada aseguradora en su directorio.
    const addrLine = (a) => {
      if (!a) return null;
      const street = [a.address_1, a.address_2].filter(Boolean).join(', ');
      const cityState = [a.city, a.state].filter(Boolean).join(', ');
      const zip = a.postal_code ? String(a.postal_code).replace(/^(\d{5})(\d{4})$/, '$1-$2') : '';
      const full = [street, cityState, zip].filter(Boolean).join(' \u00b7 ');
      return full || null;
    };
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
      // Direccion de consulta (practice location) completa + telefono.
      addressLine: [loc.address_1, loc.address_2].filter(Boolean).join(', ') || null,
      postalCode: loc.postal_code ? String(loc.postal_code).replace(/^(\d{5})(\d{4})$/, '$1-$2') : null,
      address: addrLine(loc),
      mailingAddress: addrLine(mail),
      phone: loc.telephone_number || null,
      fax: loc.fax_number || null,
      // Todas las taxonomias declaradas, no solo la primaria.
      taxonomies: (rec.taxonomies || []).map((t) => ({
        code: t.code || null,
        desc: t.desc || null,
        primary: !!t.primary,
        license: t.license || null,
        state: t.state || null,
      })),
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

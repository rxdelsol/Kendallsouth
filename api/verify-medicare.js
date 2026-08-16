// api/verify-medicare.js
// Verifica si un NPI aparece en el padrón público de enrollment de Medicare (CMS).
// Uso: GET /api/verify-medicare?npi=1234567890
//
// CMS publica "Medicare Fee-For-Service Public Provider Enrollment" con una API
// tipo data-api cuyo ID de dataset cambia con cada versión. Por eso el endpoint
// es CONFIGURABLE con una variable de entorno:
//
//   CMS_ENROLLMENT_API = plantilla de URL con {npi}, por ejemplo:
//     https://data.cms.gov/data-api/v1/dataset/<DATASET_ID>/data?filter[NPI]={npi}&size=20
//
// Cómo obtener el DATASET_ID actual:
//   1) Entra a data.cms.gov → busca "Medicare Fee-For-Service Public Provider Enrollment".
//   2) En la página del dataset abre la pestaña "API" y copia la URL de "data".
//   3) Pega esa URL en CMS_ENROLLMENT_API reemplazando el NPI por {npi}.
//
// Si la variable no está configurada, el endpoint responde verified:false (sin romper).

export default async function handler(req, res) {
  const npi = (req.query.npi || '').toString().trim();
  if (!/^\d{10}$/.test(npi)) {
    return res.status(400).json({ ok: false, error: 'NPI inválido (deben ser 10 dígitos).' });
  }

  // Padrón público "Medicare Fee-For-Service Public Provider Enrollment" (data.cms.gov).
  // El UUID del dataset cambia con cada versión trimestral; si CMS lo actualiza y deja de
  // responder, reemplaza este valor por el nuevo (o define CMS_ENROLLMENT_API en Vercel).
  const DEFAULT_CMS_API =
    'https://data.cms.gov/data-api/v1/dataset/7fa94d4b-12ec-4a05-a09f-572b94147179/data?filter[NPI]={npi}';
  const template = process.env.CMS_ENROLLMENT_API || DEFAULT_CMS_API;

  try {
    const url = template.replace('{npi}', encodeURIComponent(npi));
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!r.ok) {
      return res.status(200).json({ ok: true, verified: false, reason: `CMS respondió ${r.status}` });
    }
    const data = await r.json();

    // La respuesta suele ser un array de registros. Consideramos "activo en Medicare"
    // si hay al menos un registro que contenga el NPI en algún campo.
    const rows = Array.isArray(data) ? data : (data.data || data.results || []);
    const match = rows.filter((row) =>
      Object.values(row || {}).some((v) => String(v).trim() === npi)
    );

    const enrolled = match.length > 0;
    // Intentamos extraer datos útiles del primer match, sin asumir nombres exactos de columnas.
    const first = match[0] || {};
    const pick = (keys) => {
      for (const k of Object.keys(first)) {
        if (keys.some((n) => k.toLowerCase().includes(n))) return first[k];
      }
      return null;
    };

    return res.status(200).json({
      ok: true,
      verified: true,
      enrolled,
      npi,
      records: match.length,
      providerType: pick(['provider_type', 'specialty', 'type']),
      state: pick(['state']),
      enrollmentId: pick(['enrollment_id', 'enrlmt', 'enrollment']),
    });
  } catch (err) {
    console.error('verify-medicare error:', err);
    return res.status(200).json({ ok: true, verified: false, reason: 'No se pudo consultar CMS en este momento.' });
  }
}

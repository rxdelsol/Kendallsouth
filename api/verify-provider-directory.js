// api/verify-provider-directory.js
// Verifica, EN VIVO, si un doctor (por NPI) aparece como activo en el
// Provider Directory FHIR oficial de una aseguradora comercial — el
// mismo tipo de mecanismo público que usa api/verify-medicare.js para
// Medicare, solo que uno por pagador (CMS obliga a cada aseguradora
// regulada a publicar el suyo; no existe un padrón único como PECOS).
//
// Uso: GET /api/verify-provider-directory?payer=humana&npi=1234567890
//   payer: una de las claves de FHIR_PAYERS (ver api/_lib/fhirDirectory.js)
//
// Si la aseguradora no tiene sus variables de entorno configuradas en
// Vercel, responde configured:false sin romper nada (igual que Medicare).
// Ver SETUP-PROVIDER-DIRECTORY-APIS.md para configurar cada una.

import { verifyProviderDirectory, FHIR_PAYERS } from './_lib/fhirDirectory.js';

export default async function handler(req, res) {
  const npi = (req.query.npi || '').toString().trim();
  const payer = (req.query.payer || '').toString().trim();

  if (!/^\d{10}$/.test(npi)) {
    return res.status(400).json({ ok: false, error: 'NPI inválido (deben ser 10 dígitos).' });
  }
  if (!FHIR_PAYERS[payer]) {
    return res.status(400).json({
      ok: false,
      error: `payer inválido. Usa una de: ${Object.keys(FHIR_PAYERS).join(', ')}`,
    });
  }

  const debug = req.query.debug === '1' || req.query.debug === 'true';
  const result = await verifyProviderDirectory(payer, npi, debug);
  return res.status(200).json({ payer, npi, ...result });
}

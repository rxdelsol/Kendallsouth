// api/_lib/fhirDirectory.js
//
// Cliente genérico para las APIs "Provider Directory" (FHIR R4, guía
// Da Vinci PDex Plan-Net) que CMS exige publicar a las aseguradoras
// reguladas (Medicare Advantage, Medicaid managed care, planes QHP del
// marketplace federal). Es EL MISMO tipo de mecanismo que usa CMS/PECOS
// para Medicare (api/verify-medicare.js): un dato oficial, en vivo,
// publicado por el propio pagador — no es scraping ni un directorio
// "para pacientes" con CAPTCHA.
//
// A diferencia de Medicare (un solo padrón nacional de CMS), cada
// aseguradora comercial expone SU PROPIO servidor FHIR, y casi todas
// piden que te registres gratis como "developer" en su portal para
// obtener una URL base y, en varios casos, una API key o credenciales
// OAuth2 (aunque el dato del directorio en sí no sea privado). Esa
// parte de registro **la tienes que hacer tú** — nadie puede crear esa
// cuenta por ti. Ver SETUP-PROVIDER-DIRECTORY-APIS.md para el paso a
// paso de cada aseguradora, con el link exacto a su portal.
//
// Mientras una aseguradora no esté configurada (falten sus variables de
// entorno en Vercel), esta función devuelve configured:false sin
// romper nada — igual que ya hace verify-medicare.js.
//
// Variables de entorno por aseguradora (prefijo = payer.envPrefix):
//   FHIR_<PREFIJO>_BASE      URL base del servidor FHIR (obligatoria)
//   FHIR_<PREFIJO>_APIKEY    Si el pagador pide una API key simple,
//                            se manda como header `apikey` (opcional)
//   FHIR_<PREFIJO>_CLIENT_ID       Para pagadores con OAuth2 client_credentials
//   FHIR_<PREFIJO>_CLIENT_SECRET
//   FHIR_<PREFIJO>_TOKEN_URL       (si no se define, no se intenta OAuth2)
//   FHIR_<PREFIJO>_SCOPE            opcional

const NPI_SYSTEM = 'http://hl7.org/fhir/sid/us-npi';

// Catálogo de aseguradoras soportadas. `family` debe coincidir con el
// `family` que devuelve directoryInfoFor() en EligibilityCheck.jsx para
// que el botón "oficial" aparezca junto al botón de directorio manual.
export const FHIR_PAYERS = {
  aetna: { envPrefix: 'AETNA', label: 'Aetna' },
  humana: { envPrefix: 'HUMANA', label: 'Humana' },
  unitedhealthcare: { envPrefix: 'UHC', label: 'UnitedHealthcare' },
  florida_blue: { envPrefix: 'FLORIDABLUE', label: 'Florida Blue' },
  molina: { envPrefix: 'MOLINA', label: 'Molina' },
  sunshine: { envPrefix: 'SUNSHINE', label: 'Sunshine Health' },
  ambetter: { envPrefix: 'AMBETTER', label: 'Ambetter' },
  simply: { envPrefix: 'SIMPLY', label: 'Simply Healthcare' },
  wellcare: { envPrefix: 'WELLCARE', label: 'WellCare' },
};

function envFor(prefix) {
  const p = `FHIR_${prefix}_`;
  return {
    base: (process.env[p + 'BASE'] || '').trim().replace(/\/+$/, ''),
    apikey: process.env[p + 'APIKEY'] || '',
    clientId: process.env[p + 'CLIENT_ID'] || '',
    clientSecret: process.env[p + 'CLIENT_SECRET'] || '',
    tokenUrl: process.env[p + 'TOKEN_URL'] || '',
    scope: process.env[p + 'SCOPE'] || '',
  };
}

async function getBearerToken(cfg) {
  if (!cfg.tokenUrl || !cfg.clientId || !cfg.clientSecret) return null;
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
  });
  if (cfg.scope) body.set('scope', cfg.scope);
  const r = await fetch(cfg.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!r.ok) throw new Error(`OAuth token ${r.status}: ${await r.text()}`);
  const j = await r.json();
  return j.access_token;
}

async function fhirGet(base, path, headers) {
  const r = await fetch(`${base}${path}`, { headers: { Accept: 'application/fhir+json, application/json', ...headers } });
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch (e) { /* respuesta no-JSON */ }
  return { ok: r.ok, status: r.status, json, text: json ? null : text.slice(0, 500) };
}

function entriesOf(bundle) {
  return Array.isArray(bundle?.entry) ? bundle.entry.map((e) => e.resource).filter(Boolean) : [];
}

// ¿Este recurso Practitioner trae el NPI que buscamos entre sus identifiers?
// (algunos pagadores, ej. Aetna, no soportan buscar Practitioner por
// `identifier` — solo por nombre — así que a veces hay que confirmar el NPI
// del lado del cliente después de buscar por nombre.)
function practitionerHasNpi(practitioner, npi) {
  return (practitioner?.identifier || []).some((id) => String(id.value || '').trim() === npi);
}

// Verifica un NPI (y, si hace falta, el nombre) contra el Provider Directory
// FHIR de `payerKey`. Devuelve { ok, configured, inNetwork, foundPractitioner,
// roles, reason?, raw? }. Si `debug` es true, incluye la respuesta FHIR cruda
// (para ajustar el mapeo de campos la primera vez que conectas un pagador
// nuevo — igual que Availity).
export async function verifyProviderDirectory(payerKey, npi, doctorName = '', debug = false) {
  const payer = FHIR_PAYERS[payerKey];
  if (!payer) return { ok: false, error: `Aseguradora desconocida: ${payerKey}` };

  const cfg = envFor(payer.envPrefix);
  if (!cfg.base) {
    return {
      ok: true,
      configured: false,
      reason: `Falta FHIR_${payer.envPrefix}_BASE en Vercel. Ver SETUP-PROVIDER-DIRECTORY-APIS.md.`,
    };
  }

  try {
    const headers = {};
    if (cfg.apikey) headers.apikey = cfg.apikey;
    const token = await getBearerToken(cfg).catch((e) => {
      throw new Error(`No se pudo obtener token OAuth2: ${e.message}`);
    });
    if (token) headers.Authorization = `Bearer ${token}`;

    // 1) Intento directo: PractitionerRole encadenado por NPI del practitioner.
    //    Muchos servidores Plan-Net soportan esta búsqueda encadenada en una sola llamada.
    const chained = await fhirGet(
      cfg.base,
      `/PractitionerRole?practitioner.identifier=${encodeURIComponent(NPI_SYSTEM + '|' + npi)}&active=true&_count=50`,
      headers
    );

    let roleResources = chained.ok && chained.json ? entriesOf(chained.json).filter((r) => r.resourceType === 'PractitionerRole') : [];
    let foundPractitioner = null;
    let searchStrategy = 'chained-identifier';
    let twoStepPractitionerSearch = null;
    let twoStepRolesSearch = null;
    let twoStepRolesSearchNoFilter = null;

    if (!chained.ok || !roleResources.length) {
      // 2) Alternativa en dos pasos: buscar el Practitioner por NPI y luego su(s) PractitionerRole.
      const pr = await fhirGet(cfg.base, `/Practitioner?identifier=${encodeURIComponent(NPI_SYSTEM + '|' + npi)}`, headers);
      twoStepPractitionerSearch = pr;
      let practitioners = pr.ok && pr.json ? entriesOf(pr.json).filter((r) => r.resourceType === 'Practitioner') : [];
      foundPractitioner = practitioners[0] || null;
      searchStrategy = 'two-step-identifier';

      // 3) Fallback: algunos pagadores (ej. Aetna) NO soportan `identifier` como
      //    parámetro de búsqueda en Practitioner — solo `name`/`family`/`given`.
      //    Si no encontramos nada por NPI y tenemos el nombre del doctor, buscamos
      //    por nombre y confirmamos el NPI en los resultados (nunca al revés: si
      //    el NPI no coincide, no lo damos por encontrado).
      if (!foundPractitioner && doctorName) {
        const byName = await fhirGet(cfg.base, `/Practitioner?name=${encodeURIComponent(doctorName)}&_count=20`, headers);
        const candidates = byName.ok && byName.json ? entriesOf(byName.json).filter((r) => r.resourceType === 'Practitioner') : [];
        foundPractitioner = candidates.find((p) => practitionerHasNpi(p, npi)) || null;
        searchStrategy = 'name-then-npi-match';
      }

      if (!foundPractitioner) {
        return {
          ok: true,
          configured: true,
          foundPractitioner: false,
          inNetwork: false,
          roles: [],
          searchStrategy,
          ...(debug ? { raw: { chained: chained.json, twoStepPractitionerSearch: twoStepPractitionerSearch?.json } } : {}),
        };
      }
      // Pide el/los PractitionerRole de este practitioner. Algunos servidores
      // (ej. UHC/Optum) ignoran o rechazan `active=true` como filtro combinado;
      // por eso además probamos sin ese filtro y unimos ambos resultados para
      // no perder roles solo por una diferencia de parámetros soportados.
      const roles = await fhirGet(cfg.base, `/PractitionerRole?practitioner=${encodeURIComponent(foundPractitioner.id)}&active=true&_count=50`, headers);
      twoStepRolesSearch = roles;
      if (roles.ok && roles.json) {
        roleResources = entriesOf(roles.json).filter((r) => r.resourceType === 'PractitionerRole');
      }
      if (!roleResources.length) {
        const rolesNoFilter = await fhirGet(cfg.base, `/PractitionerRole?practitioner=${encodeURIComponent(foundPractitioner.id)}&_count=50`, headers);
        twoStepRolesSearchNoFilter = rolesNoFilter;
        if (rolesNoFilter.ok && rolesNoFilter.json) {
          roleResources = entriesOf(rolesNoFilter.json).filter((r) => r.resourceType === 'PractitionerRole');
        }
      }
    }

    const activeRoles = roleResources.filter((r) => r.active !== false);
    const roles = activeRoles.map((r) => ({
      organization: r.organization?.display || null,
      network: (r.network || []).map((n) => n.display).filter(Boolean),
      specialty: (r.specialty || []).map((s) => s.text || s.coding?.[0]?.display).filter(Boolean),
    }));

    return {
      ok: true,
      configured: true,
      foundPractitioner: !!(foundPractitioner || activeRoles.length),
      inNetwork: activeRoles.length > 0,
      roles,
      searchStrategy,
      ...(debug
        ? {
            raw: {
              chained: chained.json,
              practitionerId: foundPractitioner?.id || null,
              twoStepPractitionerSearch: twoStepPractitionerSearch?.json,
              twoStepRolesSearch: twoStepRolesSearch?.json,
              twoStepRolesSearchNoFilter: twoStepRolesSearchNoFilter?.json,
              roleResources,
            },
          }
        : {}),
    };
  } catch (err) {
    return { ok: false, configured: true, error: String(err.message || err) };
  }
}

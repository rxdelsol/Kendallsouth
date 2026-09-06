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
// Además del estado (en red / no aparece), devuelve CÓMO APARECE el
// proveedor publicado en cada aseguradora: dirección(es) de consulta,
// taxonomía NUCC, especialidad, teléfono, grupo/organización y redes.
// Eso es lo que hay que comparar contra NPPES: la causa #1 de denials
// por "provider not found" es que la dirección o la taxonomía que la
// aseguradora tiene publicada no coincide con la que se factura.
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
const NUCC_SYSTEM = 'nucc.org/provider-taxonomy';

// Techos de seguridad: sin esto, un servidor lento (ej. UHC/Optum) deja
// la búsqueda colgada 30-40 segundos y se come el tiempo de la función.
const REQUEST_TIMEOUT_MS = 9000;   // por llamada FHIR
const MAX_REF_FETCHES = 24;        // Location/Organization sueltos a resolver
const MAX_ROLES = 25;              // roles que devolvemos con detalle

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
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const r = await fetch(`${base}${path}`, {
      headers: { Accept: 'application/fhir+json, application/json', ...headers },
      signal: ctrl.signal,
    });
    const text = await r.text();
    let json = null;
    try { json = JSON.parse(text); } catch (e) { /* respuesta no-JSON */ }
    return { ok: r.ok, status: r.status, json, text: json ? null : text.slice(0, 500) };
  } catch (err) {
    const timedOut = err?.name === 'AbortError';
    return { ok: false, status: 0, json: null, timedOut, text: timedOut ? 'timeout' : String(err?.message || err) };
  } finally {
    clearTimeout(timer);
  }
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

// ── Extracción de "cómo aparece" ────────────────────────────────────────

// Dirección FHIR → texto plano + partes sueltas, para poder compararla
// campo por campo contra la de NPPES.
function mapAddress(a) {
  if (!a) return null;
  const line = (a.line || []).filter(Boolean).join(', ');
  const cityState = [a.city, a.state].filter(Boolean).join(', ');
  const full = [line, cityState, a.postalCode].filter(Boolean).join(' · ');
  if (!full) return null;
  return {
    line: line || null,
    city: a.city || null,
    state: a.state || null,
    postalCode: a.postalCode ? String(a.postalCode).trim() : null,
    full,
  };
}

function phoneOf(resource) {
  const t = (resource?.telecom || []).find((x) => x.system === 'phone' && x.value);
  return t ? String(t.value).trim() : null;
}

// Saca códigos de taxonomía NUCC de una lista de CodeableConcept.
// Los servidores varían mucho: algunos publican el código NUCC real
// (207Q00000X), otros solo el texto ("INTERNAL MEDICINE") con un coding
// NullFlavor "UNK". Devolvemos las dos cosas por separado para no
// inventar un código que la aseguradora no publicó.
function mapCodeableConcepts(list) {
  const out = [];
  for (const cc of list || []) {
    const codings = cc?.coding || [];
    const nucc = codings.find((c) => String(c.system || '').includes(NUCC_SYSTEM));
    const usable = codings.find((c) => c.code && String(c.code).toUpperCase() !== 'UNK');
    const chosen = nucc || usable || null;
    const text = cc?.text || chosen?.display || null;
    if (!text && !chosen?.code) continue;
    out.push({
      text: text || null,
      code: chosen?.code || null,
      system: chosen?.system || null,
      isNucc: !!nucc,
    });
  }
  // dedup por code+text
  const seen = new Set();
  return out.filter((x) => {
    const k = `${x.code || ''}|${(x.text || '').toUpperCase()}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function refKey(ref) {
  const s = typeof ref === 'string' ? ref : ref?.reference;
  if (!s) return null;
  // "Location/123", "https://host/fhir/Location/123" → "Location/123"
  const m = String(s).match(/([A-Za-z]+)\/([^/?#]+)$/);
  return m ? `${m[1]}/${m[2]}` : null;
}

function nameOfPractitioner(p) {
  const n = (p?.name || [])[0];
  if (!n) return null;
  if (n.text) return n.text;
  const given = (n.given || []).filter(Boolean).join(' ');
  return [given, n.family].filter(Boolean).join(' ').trim() || null;
}

function npiOf(resource) {
  const id = (resource?.identifier || []).find(
    (x) => String(x.system || '').includes('us-npi') || /^\d{10}$/.test(String(x.value || '').trim())
  );
  return id ? String(id.value).trim() : null;
}

// ── Verificación ────────────────────────────────────────────────────────

// Verifica un NPI (y, si hace falta, el nombre) contra el Provider Directory
// FHIR de `payerKey`. Devuelve { ok, configured, inNetwork, foundPractitioner,
// roles, publishedName, publishedNpi, addresses, taxonomies, reason?, raw? }.
// Si `debug` es true, incluye la respuesta FHIR cruda (para ajustar el mapeo
// de campos la primera vez que conectas un pagador nuevo — igual que Availity).
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

  const startedAt = Date.now();

  try {
    const headers = {};
    if (cfg.apikey) headers.apikey = cfg.apikey;
    const token = await getBearerToken(cfg).catch((e) => {
      throw new Error(`No se pudo obtener token OAuth2: ${e.message}`);
    });
    if (token) headers.Authorization = `Bearer ${token}`;

    // Los recursos referenciados (Location, Organization, Practitioner) son
    // los que traen la dirección y la taxonomía publicadas. Se piden con
    // _include en la misma llamada; si el servidor no lo soporta, se
    // resuelven después uno por uno.
    const INCLUDES =
      '&_include=PractitionerRole:location' +
      '&_include=PractitionerRole:organization' +
      '&_include=PractitionerRole:practitioner';

    // Caché de recursos incluidos en cualquier bundle que veamos.
    const resolved = new Map(); // "Location/123" → resource
    const absorb = (bundle) => {
      for (const res of entriesOf(bundle)) {
        if (res.resourceType && res.id) resolved.set(`${res.resourceType}/${res.id}`, res);
      }
    };

    // 1) Intento directo: PractitionerRole encadenado por NPI del practitioner.
    //    Muchos servidores Plan-Net soportan esta búsqueda encadenada en una sola llamada.
    //    OJO: no todos indexan el identifier con su `system`. Varios (ej. Molina,
    //    que en su portal público sí matchea "PROVIDER IDENTIFIER") devuelven 0
    //    resultados con `system|valor` y sí encuentran con el NPI pelado. Por eso
    //    se prueban las dos formas — antes esto hacía que el proveedor solo se
    //    encontrara de rebote por apellido, o directamente saliera "No aparece".
    const idForms = [NPI_SYSTEM + '|' + npi, npi];
    const chainedQs = idForms.map(
      (v) => `/PractitionerRole?practitioner.identifier=${encodeURIComponent(v)}&active=true&_count=50`
    );
    const chainedTries = await Promise.all(chainedQs.map((q) => fhirGet(cfg.base, q + INCLUDES, headers)));
    let chained = chainedTries.find((r) => r.ok && entriesOf(r.json).some((x) => x.resourceType === 'PractitionerRole'))
      || chainedTries.find((r) => r.ok)
      || chainedTries[0];
    // Algunos servidores rechazan _include desconocidos con 400: reintentar sin él.
    if (!chained.ok && !chained.timedOut) {
      const plainTries = await Promise.all(chainedQs.map((q) => fhirGet(cfg.base, q, headers)));
      const plain = plainTries.find((r) => r.ok && entriesOf(r.json).some((x) => x.resourceType === 'PractitionerRole'))
        || plainTries.find((r) => r.ok);
      if (plain) chained = plain;
    }
    for (const r of chainedTries) absorb(r.json);
    absorb(chained.json);

    let roleResources = chained.ok && chained.json ? entriesOf(chained.json).filter((r) => r.resourceType === 'PractitionerRole') : [];
    let foundPractitioner = null;
    let searchStrategy = 'chained-identifier';
    let twoStepPractitionerSearch = null;
    let twoStepRolesSearch = null;
    let twoStepRolesSearchNoFilter = null;

    if (!chained.ok || !roleResources.length) {
      // 2) Alternativa en dos pasos: buscar el Practitioner por NPI y luego su(s) PractitionerRole.
      const prTries = await Promise.all(
        idForms.map((v) => fhirGet(cfg.base, `/Practitioner?identifier=${encodeURIComponent(v)}`, headers))
      );
      for (const r of prTries) absorb(r.json);
      // Nos quedamos con la primera forma del identifier que devuelva un
      // Practitioner cuyo NPI realmente coincida (nunca al revés).
      let practitioners = [];
      let pr = prTries[0];
      for (const r of prTries) {
        const found = r.ok && r.json ? entriesOf(r.json).filter((x) => x.resourceType === 'Practitioner') : [];
        const exact = found.filter((x) => practitionerHasNpi(x, npi));
        if (exact.length) { practitioners = exact; pr = r; break; }
        if (found.length && !practitioners.length) { practitioners = found; pr = r; }
      }
      twoStepPractitionerSearch = pr;
      foundPractitioner = practitioners.find((x) => practitionerHasNpi(x, npi)) || practitioners[0] || null;
      searchStrategy = 'two-step-identifier';

      // 3) Fallback: algunos pagadores (ej. Aetna) NO soportan `identifier` como
      //    parámetro de búsqueda en Practitioner — solo `name`/`family`/`given`.
      //    Si no encontramos nada por NPI y tenemos el nombre del doctor, buscamos
      //    por nombre y confirmamos el NPI en los resultados (nunca al revés: si
      //    el NPI no coincide, no lo damos por encontrado).
      let byNameSearch = null;
      let byNameCandidates = [];
      let byFamilySearch = null;
      if (!foundPractitioner && doctorName) {
        byNameSearch = await fhirGet(cfg.base, `/Practitioner?name=${encodeURIComponent(doctorName)}&_count=20`, headers);
        absorb(byNameSearch.json);
        byNameCandidates = byNameSearch.ok && byNameSearch.json ? entriesOf(byNameSearch.json).filter((r) => r.resourceType === 'Practitioner') : [];
        foundPractitioner = byNameCandidates.find((p) => practitionerHasNpi(p, npi)) || null;
        searchStrategy = 'name-then-npi-match';

        // 3b) Algunos servidores (ej. Centene/Ambetter-Sunshine-Simply-WellCare)
        //     no hacen match con `name=<nombre completo>` (búsqueda de frase
        //     exacta) pero sí con `family=<apellido>` (busca solo por
        //     apellido, mucho más tolerante). Si la búsqueda por nombre
        //     completo no encontró nada, probamos con el último apellido.
        if (!foundPractitioner) {
          const lastName = doctorName.trim().split(/\s+/).pop();
          if (lastName && lastName.toLowerCase() !== doctorName.trim().toLowerCase()) {
            byFamilySearch = await fhirGet(cfg.base, `/Practitioner?family=${encodeURIComponent(lastName)}&_count=20`, headers);
            absorb(byFamilySearch.json);
            const familyCandidates = byFamilySearch.ok && byFamilySearch.json ? entriesOf(byFamilySearch.json).filter((r) => r.resourceType === 'Practitioner') : [];
            foundPractitioner = familyCandidates.find((p) => practitionerHasNpi(p, npi)) || null;
            if (foundPractitioner) {
              byNameCandidates = familyCandidates;
              searchStrategy = 'family-then-npi-match';
            }
          }
        }
      }

      if (!foundPractitioner) {
        return {
          ok: true,
          configured: true,
          foundPractitioner: false,
          inNetwork: false,
          roles: [],
          addresses: [],
          taxonomies: [],
          searchStrategy,
          elapsedMs: Date.now() - startedAt,
          ...(chained.timedOut ? { slow: true, reason: 'El servidor de la aseguradora no respondió a tiempo.' } : {}),
          ...(debug
            ? {
                raw: {
                  chained: chained.json,
                  twoStepPractitionerSearch: twoStepPractitionerSearch?.json,
                  byNameSearch: byNameSearch?.json,
                  byFamilySearch: byFamilySearch?.json,
                  byNameCandidateIds: byNameCandidates.map((p) => ({ id: p.id, identifiers: p.identifier })),
                },
              }
            : {}),
        };
      }
      // Pide el/los PractitionerRole de este practitioner. Dos cosas varían
      // entre servidores y hay que probar combinaciones:
      // 1) el formato de la referencia — algunos (ej. UHC/Optum) aceptan el
      //    id "pelado" (5350887), otros (ej. Centene) EXIGEN la referencia
      //    completa "Practitioner/5350887" y devuelven 0 resultados (sin
      //    error) con el id pelado.
      // 2) el filtro `active=true` — algunos servidores (ej. UHC/Optum)
      //    lo ignoran o rechazan y devuelven 0 resultados con él puesto.
      // Antes se probaban en serie (hasta 4 llamadas encadenadas: por eso
      // UnitedHealthcare tardaba ~30 s). Ahora van las 4 en paralelo y nos
      // quedamos con la primera de la lista de prioridad que traiga roles.
      const refs = [foundPractitioner.id, `Practitioner/${foundPractitioner.id}`];
      const attempts = [];
      for (const ref of refs) {
        attempts.push({ ref, filtered: true, path: `/PractitionerRole?practitioner=${encodeURIComponent(ref)}&active=true&_count=50` });
        attempts.push({ ref, filtered: false, path: `/PractitionerRole?practitioner=${encodeURIComponent(ref)}&_count=50` });
      }
      const settled = await Promise.all(attempts.map((a) => fhirGet(cfg.base, a.path + INCLUDES, headers).then((r) => ({ ...a, res: r }))));
      for (const a of settled) {
        absorb(a.res.json);
        if (a.filtered && !twoStepRolesSearch) twoStepRolesSearch = a.res;
        if (!a.filtered && !twoStepRolesSearchNoFilter) twoStepRolesSearchNoFilter = a.res;
      }
      for (const a of settled) {
        if (!a.res.ok || !a.res.json) continue;
        const found = entriesOf(a.res.json).filter((r) => r.resourceType === 'PractitionerRole');
        if (found.length) { roleResources = found; break; }
      }
    }

    const activeRoles = roleResources.filter((r) => r.active !== false).slice(0, MAX_ROLES);

    // Resolver las referencias que el servidor no mandó con _include.
    // Son las que traen la dirección publicada (Location) y el grupo
    // (Organization) — el dato que hay que comparar contra NPPES.
    const wanted = new Set();
    for (const r of activeRoles) {
      for (const l of r.location || []) { const k = refKey(l); if (k && !resolved.has(k)) wanted.add(k); }
      const o = refKey(r.organization); if (o && !resolved.has(o)) wanted.add(o);
    }
    const practitionerRef = refKey(foundPractitioner ? `Practitioner/${foundPractitioner.id}` : activeRoles[0]?.practitioner);
    if (practitionerRef && !resolved.has(practitionerRef)) wanted.add(practitionerRef);

    const toFetch = [...wanted].slice(0, MAX_REF_FETCHES);
    if (toFetch.length) {
      const fetched = await Promise.all(toFetch.map((k) => fhirGet(cfg.base, `/${k}`, headers).then((r) => [k, r])));
      for (const [k, r] of fetched) {
        if (r.ok && r.json && r.json.resourceType) resolved.set(k, r.json);
      }
    }

    const practitionerRes = (practitionerRef && resolved.get(practitionerRef)) || foundPractitioner || null;

    const roles = activeRoles.map((r) => {
      const locations = (r.location || [])
        .map((l) => resolved.get(refKey(l)))
        .filter(Boolean)
        .map((loc) => ({
          name: loc.name || null,
          address: mapAddress(loc.address),
          phone: phoneOf(loc) || null,
        }))
        .filter((l) => l.address || l.name);

      const org = resolved.get(refKey(r.organization)) || null;

      return {
        organization: org?.name || r.organization?.display || null,
        organizationNpi: org ? npiOf(org) : null,
        network: (r.network || []).map((n) => n.display).filter(Boolean),
        // Compatibilidad: `specialty` sigue siendo un array de textos.
        specialty: (r.specialty || []).map((s) => s.text || s.coding?.[0]?.display).filter(Boolean),
        // Nuevo: taxonomía con código NUCC cuando la aseguradora lo publica.
        taxonomies: mapCodeableConcepts(r.specialty),
        roleCodes: mapCodeableConcepts(r.code),
        locations,
        phone: phoneOf(r),
        lastUpdated: r.meta?.lastUpdated || null,
      };
    });

    // Resúmenes planos: todo lo publicado por esta aseguradora, sin repetir.
    // Es lo que la pantalla compara contra NPPES.
    const addrSeen = new Set();
    const addresses = [];
    for (const role of roles) {
      for (const l of role.locations) {
        const key = (l.address?.full || l.name || '').toUpperCase();
        if (!key || addrSeen.has(key)) continue;
        addrSeen.add(key);
        addresses.push({ name: l.name, phone: l.phone, ...(l.address || {}) });
      }
    }

    const taxSeen = new Set();
    const taxonomies = [];
    for (const role of roles) {
      for (const t of role.taxonomies) {
        const key = `${t.code || ''}|${(t.text || '').toUpperCase()}`;
        if (taxSeen.has(key)) continue;
        taxSeen.add(key);
        taxonomies.push(t);
      }
    }
    // La taxonomía "de verdad" (código NUCC) suele venir en las
    // qualification del Practitioner, no en el PractitionerRole.
    for (const t of mapCodeableConcepts((practitionerRes?.qualification || []).map((q) => q.code))) {
      const key = `${t.code || ''}|${(t.text || '').toUpperCase()}`;
      if (taxSeen.has(key)) continue;
      taxSeen.add(key);
      taxonomies.push(t);
    }

    return {
      ok: true,
      configured: true,
      foundPractitioner: !!(foundPractitioner || activeRoles.length),
      inNetwork: activeRoles.length > 0,
      roles,
      // Cómo aparece publicado el proveedor en ESTA aseguradora:
      publishedName: nameOfPractitioner(practitionerRes),
      publishedNpi: practitionerRes ? npiOf(practitionerRes) : null,
      addresses,
      taxonomies,
      networks: [...new Set(roles.flatMap((r) => r.network))],
      organizations: [...new Set(roles.map((r) => r.organization).filter(Boolean))],
      lastUpdated: roles.map((r) => r.lastUpdated).filter(Boolean).sort().pop() || null,
      searchStrategy,
      elapsedMs: Date.now() - startedAt,
      ...(debug
        ? {
            raw: {
              chained: chained.json,
              practitionerId: foundPractitioner?.id || null,
              practitionerResource: practitionerRes,
              twoStepPractitionerSearch: twoStepPractitionerSearch?.json,
              twoStepRolesSearch: twoStepRolesSearch?.json,
              twoStepRolesSearchNoFilter: twoStepRolesSearchNoFilter?.json,
              resolvedKeys: [...resolved.keys()],
              roleResources,
            },
          }
        : {}),
    };
  } catch (err) {
    return { ok: false, configured: true, error: String(err.message || err), elapsedMs: Date.now() - startedAt };
  }
}

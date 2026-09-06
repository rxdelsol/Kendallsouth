// api/_lib/licenseFlorida.js
//
// Vencimiento de licencia de Florida, desde la verificación pública de
// MQA (Department of Health): mqa-internet.doh.state.fl.us. Es el mismo
// dato que cualquiera puede consultar a mano en su buscador.
//
// El sitio NO tiene robots.txt (devuelve 404), así que ninguna ruta está
// restringida, y su guía de uso no prohíbe la consulta automatizada.
//
// No existe una URL GET que reciba el número de licencia: el controlador
// solo hace model-binding en POST (cualquier querystring devuelve "No
// records found"). Por eso van tres pasos: GET del formulario para tomar
// la cookie y el __RequestVerificationToken, POST de la búsqueda, y
// lectura del resultado.
//
// PRUDENCIA: esto lee HTML, no una API con contrato. Si el sitio cambia
// su maquetación, el parser deja de reconocer el dato. Preferimos NO
// escribir nada antes que escribir una fecha equivocada: una fecha mala
// en una herramienta de credencialización hace perder una renovación.
// Por eso todo resultado se acepta solo si (a) la fecha es válida y
// plausible y (b) el nombre devuelto comparte apellido con el doctor.

const MQA_URL = 'https://mqa-internet.doh.state.fl.us/MQASearchServices/HealthCareProviders';
const TIMEOUT_MS = 12000;

function withTimeout(ms) {
  const c = new AbortController();
  return { signal: c.signal, done: setTimeout(() => c.abort(), ms) };
}

function cookiesFrom(res) {
  const jar = typeof res.headers.getSetCookie === 'function'
    ? res.headers.getSetCookie()
    : [res.headers.get('set-cookie')].filter(Boolean);
  return jar.map((c) => String(c).split(';')[0]).join('; ');
}

// 'M/D/YYYY' (el sitio mezcla '1/31/2028' sin cero y '04/25/2018' con cero)
// → 'YYYY-MM-DD'. Rechaza cualquier cosa que no sea una fecha real.
export function parseUsDate(s) {
  const m = String(s || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, mm, dd, yyyy] = m;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (d.getFullYear() !== Number(yyyy) || d.getMonth() !== Number(mm) - 1 || d.getDate() !== Number(dd)) return null;
  const year = Number(yyyy);
  if (year < 1980 || year > 2100) return null;
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
}

function stripTags(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/[ \t]+/g, ' ');
}

// Busca la fecha que sigue a una etiqueta de vencimiento. Tolerante a
// cambios de maquetación porque trabaja sobre el texto plano, no sobre
// una ruta de nodos concreta.
export function extractLicenseInfo(html, licenseNumber) {
  const text = stripTags(html);
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  const findAfter = (labelRe, valueRe, span = 4) => {
    for (let i = 0; i < lines.length; i++) {
      if (!labelRe.test(lines[i])) continue;
      const inline = lines[i].match(valueRe);
      if (inline) return inline[0];
      for (let j = i + 1; j <= i + span && j < lines.length; j++) {
        const m = lines[j].match(valueRe);
        if (m) return m[0];
      }
    }
    return null;
  };

  const DATE = /\d{1,2}\/\d{1,2}\/\d{4}/;
  const expirationRaw = findAfter(/expiration/i, DATE);
  const status = findAfter(/licen[sc]e\s*status|^status\b/i, /[A-Za-z][A-Za-z\/ -]{2,40}/);

  // El nombre suele aparecer cerca del número de licencia.
  let name = null;
  if (licenseNumber) {
    const idx = lines.findIndex((l) => l.toUpperCase().includes(String(licenseNumber).toUpperCase()));
    if (idx >= 0) {
      for (let j = Math.max(0, idx - 3); j <= Math.min(lines.length - 1, idx + 3); j++) {
        const cand = lines[j].trim();
        if (/^[A-Z][A-Z .,'-]{5,60}$/.test(cand) && !/LICEN|EXPIR|STATUS|PROFESSION|ADDRESS/i.test(cand)) {
          name = cand; break;
        }
      }
    }
  }

  const noRecords = /no records found/i.test(text);
  return {
    expiration: parseUsDate(expirationRaw),
    expirationRaw: expirationRaw || null,
    status: status ? status.trim() : null,
    name,
    noRecords,
  };
}

// ¿El nombre que devolvió MQA corresponde al doctor que pedimos? Compara
// apellidos: si no hay coincidencia, NO aceptamos el dato.
export function nameMatches(mqaName, doctorName) {
  if (!mqaName || !doctorName) return false;
  const toks = (s) => String(s).toUpperCase().replace(/[^A-Z\s-]/g, ' ').split(/[\s-]+/).filter((t) => t.length > 3);
  const a = new Set(toks(mqaName));
  return toks(doctorName).some((t) => a.has(t));
}

// Consulta una licencia. Devuelve { ok, expiration, status, name, reason }.
// Nunca lanza: ante cualquier problema devuelve ok:false y el motivo.
export async function lookupFloridaLicense(licenseNumber, doctorName = '', opts = {}) {
  const fetchImpl = opts.fetchImpl || fetch;
  const lic = String(licenseNumber || '').trim();
  if (!lic) return { ok: false, reason: 'sin número de licencia' };

  try {
    const t1 = withTimeout(TIMEOUT_MS);
    const g = await fetchImpl(MQA_URL, { signal: t1.signal, headers: { Accept: 'text/html' } });
    clearTimeout(t1.done);
    if (!g.ok) return { ok: false, reason: `MQA respondió ${g.status} al abrir el formulario` };
    const formHtml = await g.text();
    const token = /name="__RequestVerificationToken"[^>]*value="([^"]+)"/i.exec(formHtml)?.[1];
    if (!token) return { ok: false, reason: 'no se encontró el token del formulario (cambió la página)' };

    const body = new URLSearchParams({
      __RequestVerificationToken: token,
      'SearchDto.LicenseNumber': lic,
      'SearchDto.LicenseStatus': 'ALL',
      'SearchDto.BusinessName': '',
      'SearchDto.LastName': '',
      'SearchDto.FirstName': '',
      'SearchDto.City': '',
      'SearchDto.County': '',
      'SearchDto.ZipCode': '',
    });

    const t2 = withTimeout(TIMEOUT_MS);
    const p = await fetchImpl(MQA_URL, {
      method: 'POST',
      signal: t2.signal,
      redirect: 'follow',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'text/html',
        Cookie: cookiesFrom(g),
        Referer: MQA_URL,
      },
      body,
    });
    clearTimeout(t2.done);
    if (!p.ok) return { ok: false, reason: `MQA respondió ${p.status} a la búsqueda` };

    const html = await p.text();
    const info = extractLicenseInfo(html, lic);
    if (info.noRecords) return { ok: false, reason: 'MQA no encontró esa licencia' };
    if (!info.expiration) {
      return { ok: false, reason: 'no se pudo leer la fecha de vencimiento', snippet: stripTags(html).slice(0, 600) };
    }
    if (doctorName && !nameMatches(info.name, doctorName)) {
      return { ok: false, reason: `el nombre devuelto (${info.name || 'ninguno'}) no coincide con ${doctorName}` };
    }
    return { ok: true, expiration: info.expiration, status: info.status, name: info.name };
  } catch (err) {
    return { ok: false, reason: err?.name === 'AbortError' ? 'MQA no respondió a tiempo' : String(err?.message || err) };
  }
}

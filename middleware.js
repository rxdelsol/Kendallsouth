// middleware.js
//
// Puerta de entrada al sitio. Corre ANTES que cualquier página o API, así que
// protege las dos cosas de una sola vez: sin esto, /api/get-doctors devolvía
// NPIs, licencias, CAQH y contratos a cualquiera que supiera la URL, y
// /api/delete-doctor borraba sin preguntar.
//
// Va como Edge Middleware de Vercel: no cuenta contra el tope de 12 funciones
// del plan Hobby (verificalo igual en el resumen del deploy).
//
// Variables a crear en Vercel → Settings → Environment Variables:
//   APP_PASSWORD   la contraseña que compartirá el equipo
//   AUTH_SECRET    una cadena larga al azar, solo para firmar la cookie
//
// Ponelas vos: no manejo contraseñas. Si falta alguna, el sitio queda cerrado
// y lo dice — nunca se abre solo.

export const config = {
  matcher: [
    // Todo, salvo los recursos estáticos y el cron de vencimientos, que lo
    // dispara Vercel y no lleva sesión de navegador.
    "/((?!assets/|favicon|Picture1|logo|icons/|manifest|sw\\.js|api/cron-check-expirations).*)",
  ],
};

const COOKIE = "ks_session";
const DIAS = 7;
const enc = new TextEncoder();

const b64url = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function firmar(texto, secreto) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secreto), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(texto)));
}

// Comparación de tiempo constante: comparar con === filtra información por el
// tiempo que tarda en fallar.
function igual(a, b) {
  const x = enc.encode(String(a)), y = enc.encode(String(b));
  let dif = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) dif |= (x[i] || 0) ^ (y[i] || 0);
  return dif === 0;
}

async function cookieValida(valor, secreto) {
  if (!valor) return false;
  const partes = String(valor).split(".");
  if (partes.length !== 2) return false;
  const [exp, sig] = partes;
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  return igual(sig, await firmar(exp, secreto));
}

function paginaLogin(mensaje, estado = 401) {
  const cuerpo = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Kendall South · Sign in</title>
<style>
  :root{color-scheme:light}
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#ECEFEC;color:#17293A;
       font:15px/1.5 "Segoe UI",system-ui,sans-serif;padding:24px}
  .box{background:#FBFCFB;border:1px solid #D3DAD5;border-radius:4px;padding:26px 24px;width:min(370px,100%);
       box-shadow:0 1px 1px rgba(22,35,42,.05),0 12px 34px -20px rgba(22,35,42,.5)}
  h1{font-size:17px;margin:0 0 3px;letter-spacing:-.01em}
  p.sub{margin:0 0 18px;color:#6C7F91;font-size:12.5px}
  label{display:block;font-size:10.5px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:#6C7F91;margin-bottom:5px}
  input{width:100%;padding:9px 11px;border:1px solid #D3DAD5;border-radius:3px;font-size:14px;background:#fff;color:#17293A}
  input:focus{outline:2px solid #17293A;outline-offset:1px;border-color:#17293A}
  button{width:100%;margin-top:14px;padding:9px;border:0;border-radius:3px;background:#17293A;color:#FBFCFB;
         font-size:14px;font-weight:600;cursor:pointer}
  button:hover{background:#22384C}
  .err{margin:14px 0 0;padding:9px 11px;background:#F6E2DE;color:#A63A2C;border-radius:3px;font-size:12.5px}
  .foot{margin:16px 0 0;color:#8695A0;font-size:11px;text-align:center}
</style></head><body>
<form class="box" method="POST" autocomplete="on">
  <h1>Kendall South Medical Center</h1>
  <p class="sub">Credentialing · restricted access</p>
  <label for="p">Password</label>
  <input id="p" name="__password" type="password" autocomplete="current-password" autofocus required>
  <button type="submit">Sign in</button>
  ${mensaje ? `<p class="err">${mensaje}</p>` : ""}
  <p class="foot">This information is confidential. Do not share the password by email.</p>
</form></body></html>`;
  return new Response(cuerpo, {
    status: estado,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}

// ── Búsqueda de ensayos en ClinicalTrials.gov ───────────────────────────────
//
// Esto vive acá y no en /api/trial-search.js por la misma razón que /logout: el
// plan Hobby de Vercel no admite más de 12 funciones serverless por despliegue y
// las doce ya están ocupadas. El middleware corre en el edge y no cuenta contra
// ese tope. De regalo, la búsqueda queda detrás de la misma sesión que el resto
// del sitio, en vez de ser un endpoint abierto.
//
// La API de ClinicalTrials.gov es pública y no lleva clave.

const CT_BASE = "https://clinicaltrials.gov/api/v2/studies";

const CT_CAMPOS = [
  "protocolSection.identificationModule",
  "protocolSection.statusModule",
  "protocolSection.sponsorCollaboratorsModule",
  "protocolSection.conditionsModule",
  "protocolSection.designModule",
  "protocolSection.contactsLocationsModule",
].join(",");

// Un estudio con cientos de sitios ya repartidos rara vez abre más. No se
// esconde, se marca: aplicar a ése suele ser gastar una tarde en un
// cuestionario.
const MUCHOS_SITIOS = 120;

function limpiarEstudio(s) {
  const p = s?.protocolSection || {};
  const id = p.identificationModule || {};
  const st = p.statusModule || {};
  const sp = p.sponsorCollaboratorsModule || {};
  const co = p.conditionsModule || {};
  const de = p.designModule || {};
  const cl = p.contactsLocationsModule || {};

  const sitios = Array.isArray(cl.locations) ? cl.locations : [];
  const enFlorida = sitios.filter((l) => /florida/i.test(String(l.state || "")) || String(l.state || "") === "FL");

  return {
    nct: id.nctId || "",
    title: id.briefTitle || "",
    sponsor: sp.leadSponsor?.name || "",
    collaborators: (sp.collaborators || []).map((c) => c.name).slice(0, 4),
    status: st.overallStatus || "",
    lastUpdate: st.lastUpdatePostDateStruct?.date || "",
    conditions: (co.conditions || []).slice(0, 6),
    phases: (de.phases || []).map((f) => f.replace("PHASE", "Phase ").replace("NA", "N/A")),
    enrollment: de.enrollmentInfo?.count ?? null,
    siteCount: sitios.length,
    floridaSites: enFlorida.map((l) => [l.facility, l.city].filter(Boolean).join(" · ")).slice(0, 6),
    crowded: sitios.length >= MUCHOS_SITIOS,
    // El contacto central es el camino real para pedir ser sitio. Si no hay,
    // se dice que no hay, en vez de inventar un correo del patrocinador.
    contacts: (cl.centralContacts || []).map((c) => ({
      name: c.name || "", role: c.role || "", phone: c.phone || "", email: c.email || "",
    })),
    url: id.nctId ? `https://clinicaltrials.gov/study/${id.nctId}` : "",
  };
}

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

async function buscarEnsayos(url) {
  try {
    const p = url.searchParams;
    const q = p.get("q") || "";
    const fase = p.get("phase") || "";
    const estado = p.get("status") || "RECRUITING";
    const estadoGeo = p.get("state") || "Florida";
    const pagina = p.get("page") || "";

    const u = new URL(CT_BASE);
    u.searchParams.set("format", "json");
    u.searchParams.set("pageSize", "40");
    u.searchParams.set("countTotal", "true");
    u.searchParams.set("fields", CT_CAMPOS);
    u.searchParams.set("query.locn", estadoGeo);
    u.searchParams.set("filter.overallStatus", estado);
    // Lo actualizado hace poco primero: un registro tocado la semana pasada es
    // un estudio vivo; uno intacto desde hace dos años suele ser un registro
    // que nadie mantiene.
    u.searchParams.set("sort", "LastUpdatePostDate:desc");
    if (q) u.searchParams.set("query.term", q);
    if (fase) u.searchParams.set("filter.advanced", `AREA[Phase]${fase}`);
    if (pagina) u.searchParams.set("pageToken", pagina);

    // Si el registro rechaza la consulta suele ser por el filtro de fase o por
    // el orden. Se reintenta sin ellos antes de rendirse: una búsqueda sin
    // ordenar sirve; una pantalla en blanco porque cambió el nombre de un
    // parámetro, no.
    let r = await fetch(u.toString(), { headers: { accept: "application/json" } });
    let degradada = false;
    if (!r.ok && (u.searchParams.has("filter.advanced") || u.searchParams.has("sort"))) {
      u.searchParams.delete("filter.advanced");
      u.searchParams.delete("sort");
      r = await fetch(u.toString(), { headers: { accept: "application/json" } });
      degradada = r.ok;
    }
    if (!r.ok) {
      const cuerpo = await r.text().catch(() => "");
      return json({ ok: false, error: `ClinicalTrials.gov respondió ${r.status}`, detail: cuerpo.slice(0, 300) }, 502);
    }

    const data = await r.json();
    return json({
      ok: true,
      // En true, el filtro de fase no se aplicó. La pantalla lo dice en vez de
      // enseñar todas las fases como si fueran las pedidas.
      degraded: degradada,
      total: data.totalCount ?? null,
      nextPage: data.nextPageToken || null,
      studies: (data.studies || []).map(limpiarEstudio),
    });
  } catch (e) {
    return json({ ok: false, error: String(e?.message || e) }, 500);
  }
}

export default async function middleware(req) {
  // robots.txt se responde sin sesión y de verdad: devolver la página de
  // acceso en su lugar deja a los rastreadores sin instrucciones y rompe a
  // cualquier cliente que lo consulte antes de pedir una URL.
  if (new URL(req.url).pathname === "/robots.txt") {
    return new Response("User-agent: *\nDisallow: /\n", {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const password = process.env.APP_PASSWORD;
  const secreto = process.env.AUTH_SECRET;

  // Sin configurar, el sitio queda CERRADO. Abrirse solo sería lo peor:
  // parecería que funciona y estaría publicando los datos.
  if (!password || !secreto) {
    return paginaLogin(
      "APP_PASSWORD and AUTH_SECRET are not set in Vercel. The site stays locked until they are.",
      503
    );
  }

  const url = new URL(req.url);

  // Cerrar sesión. La cookie es HttpOnly a propósito, así que el navegador no
  // puede borrarla por su cuenta: tiene que pedirlo acá. Va en el middleware
  // y no en /api para no gastar una de las 12 funciones del plan.
  if (url.pathname === "/logout") {
    return new Response(null, {
      status: 303,
      headers: {
        location: "/",
        "set-cookie": `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
        "cache-control": "no-store",
      },
    });
  }

  // Envío del formulario de acceso.
  if (req.method === "POST") {
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/x-www-form-urlencoded")) {
      const form = new URLSearchParams(await req.text());
      if (form.has("__password")) {
        if (!igual(form.get("__password"), password)) {
          // Demora deliberada: encarece probar contraseñas a lo bruto.
          await new Promise((r) => setTimeout(r, 700));
          return paginaLogin("Incorrect password.");
        }
        const exp = String(Date.now() + DIAS * 864e5);
        const valor = exp + "." + (await firmar(exp, secreto));
        return new Response(null, {
          status: 303,
          headers: {
            location: url.pathname,
            "set-cookie": `${COOKIE}=${valor}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${DIAS * 86400}`,
            "cache-control": "no-store",
          },
        });
      }
    }
  }

  const cookie = (req.headers.get("cookie") || "")
    .split(";").map((c) => c.trim())
    .find((c) => c.startsWith(COOKIE + "="));
  const valor = cookie ? cookie.slice(COOKIE.length + 1) : null;

  if (await cookieValida(valor, secreto)) {
    if (url.pathname === "/api/trial-search") return buscarEnsayos(url);
    return;
  }

  // Sin sesión: a las APIs se les responde JSON, no una página de login.
  if (url.pathname.startsWith("/api/")) {
    return new Response(JSON.stringify({ ok: false, error: "Not authenticated." }), {
      status: 401,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }
  return paginaLogin(null);
}

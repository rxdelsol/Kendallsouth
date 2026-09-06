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

export default async function middleware(req) {
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

  if (await cookieValida(valor, secreto)) return;

  // Sin sesión: a las APIs se les responde JSON, no una página de login.
  if (url.pathname.startsWith("/api/")) {
    return new Response(JSON.stringify({ ok: false, error: "Not authenticated." }), {
      status: 401,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }
  return paginaLogin(null);
}

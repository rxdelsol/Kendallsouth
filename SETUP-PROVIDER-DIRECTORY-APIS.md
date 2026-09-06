# Verificación oficial de seguros comerciales (Provider Directory FHIR)

Esto añade, junto al botón de Medicare, botones **"⚡ Verificar [Aseguradora]"** en
**Doctor × Seguro** que consultan EN VIVO el **Provider Directory** oficial de cada
aseguradora — el mismo tipo de dato público y automático que ya tienes para
Medicare, solo que aquí es **uno por aseguradora** porque no existe un padrón único
como PECOS para las comerciales.

## Por qué esto sí es posible (y por qué antes decía que no)

CMS obliga a las aseguradoras reguladas — planes Medicare Advantage, Medicaid
managed care y los planes del marketplace federal (QHP) — a publicar un
**Provider Directory API** público en formato **FHIR** (estándar
[Da Vinci PDex Plan-Net](https://hl7.org/fhir/us/davinci-pdex-plan-net/)). Es
justo el mecanismo que le da vida al botón de Medicare, aplicado por CMS a las
comerciales. No es scraping ni un formulario con CAPTCHA — es una API oficial.

**La diferencia con Medicare:** con Medicare, el código ya trae el endpoint
público configurado. Con cada aseguradora comercial, **tú tienes que
registrarte gratis** en su portal de developers para obtener la URL de su
servidor FHIR (y en varias, además, una API key). Eso es algo que solo tú
puedes hacer — nadie puede crear esa cuenta en tu nombre. Una vez que tengas
esos datos, los pegas en Vercel y el botón queda funcionando exactamente
igual que el de Medicare.

**Importante:** confirmé contra la documentación real del portal de **Aetna**
y de **UnitedHealthcare** (ver detalle de cada una abajo) — Aetna no busca
por NPI directamente (el código ya tiene el respaldo por nombre) y UHC
resultó ser la más simple: su Provider Directory es público, sin necesidad
de cuenta ni credenciales. Las demás (Humana, Florida Blue, Molina, Centene)
siguen el mismo estándar Da Vinci Plan-Net, pero no pude entrar a sus
portales reales (requieren cuenta) para confirmar el detalle exacto de cada
una. Usa `&debug=1` en la URL de verificación (ver abajo) para ver la
respuesta cruda la primera vez que configures una — mándamela si el
resultado no cuadra con lo que sabes de ese doctor y ajusto el mapeo.

---

## Archivos incluidos

| Archivo | Qué es |
|---|---|
| `api/_lib/fhirDirectory.js` | **Nuevo.** Cliente genérico FHIR Plan-Net (reutilizado por todas las aseguradoras). |
| `api/verify-provider-directory.js` | **Nuevo.** Endpoint `GET /api/verify-provider-directory?payer=<clave>&npi=<npi>`. |
| `src/components/EligibilityCheck.jsx` | **Reemplaza.** Agrega la sección "⚡ Verificar seguros comerciales" y el badge ⚡ en la matriz. |

Copia estos archivos sobre tu repo (respetando las rutas) y haz commit/push. Vercel redeplega solo.

---

## Cómo registrarte y qué variable pegar en Vercel

Todas van en **Vercel → tu proyecto → Settings → Environment Variables**, y
después **Redeploy**. Mientras una aseguradora no tenga su `..._BASE`
configurada, su botón dice claramente "no configurado" — no rompe nada.

### Aetna (verificado — pasos exactos)
1. Entra a **developerportal.aetna.com** → **Login/Register → Register**. Pon tu email de la clínica, nombre y apellido, acepta los términos, confirma el código que te llega por email y crea usuario/contraseña.
2. **My Applications → Create New**. En "I Am Representing" elige **Third-Party**. En "Application Environment" elige **Production** → Continue.
3. Completa el **Questionnaire** que aparece y dale Submit. Aetna revisa y responde en **2 a 4 días hábiles** (no es instantáneo) — te avisan por email.
4. Una vez aprobado: **Create Application**, completa los datos y Submit. Te da un **Client ID** y **Client Secret** — cópialos, el Secret no se vuelve a mostrar.
5. En **Products**, suscríbete a todos los productos de **"Provider Directory"** disponibles (incluye el de Medicare) y confirma la suscripción.
6. En Vercel agrega:

| Variable | Valor |
|---|---|
| `FHIR_AETNA_BASE` | `https://apif1.aetna.com/fhir/v1/providerdirectorydata` |
| `FHIR_AETNA_CLIENT_ID` | El Client ID que te dio Aetna |
| `FHIR_AETNA_CLIENT_SECRET` | El Client Secret que te dio Aetna |
| `FHIR_AETNA_TOKEN_URL` | `https://apif1.aetna.com/fhir/v1/fhirserver_auth/oauth2/token` |
| `FHIR_AETNA_SCOPE` | `Public NonPII` |

> Detalle técnico (ya resuelto en el código, no tienes que hacer nada): la API
> de Aetna no permite buscar un Practitioner directamente por NPI, solo por
> nombre — `verifyProviderDirectory()` ya intenta primero por NPI y, si no
> encuentra nada, busca por el nombre del doctor y confirma el NPI en el
> resultado antes de darlo por válido.

### Humana
1. Entra a **developers.humana.com** → crea cuenta → busca **"Provider Directory API"** en su marketplace.
2. Suscríbete y copia la URL base del entorno de producción.
3. Variable: `FHIR_HUMANA_BASE` (más las de API key/OAuth si tu suscripción las requiere).

### Centene — Ambetter, Sunshine Health, Simply Healthcare y WellCare (verificado — ya configurado, sin registro)
Confirmé en vivo en **partners.centene.com/apis** que las 4 marcas comparten
**una sola API pública "FHIR - Provider Directory" (v4.0.1), con
Authentication Type: None** — igual que UnitedHealthcare, sin necesidad de
cuenta ni credenciales. Ya quedó configurada en Vercel:

| Variable | Valor |
|---|---|
| `FHIR_AMBETTER_BASE` | `https://iopc-pd.api.centene.com/iopc/pd/fhir/providerdirectory` |
| `FHIR_SIMPLY_BASE` | `https://iopc-pd.api.centene.com/iopc/pd/fhir/providerdirectory` |
| `FHIR_SUNSHINE_BASE` | `https://iopc-pd.api.centene.com/iopc/pd/fhir/providerdirectory` |
| `FHIR_WELLCARE_BASE` | `https://iopc-pd.api.centene.com/iopc/pd/fhir/providerdirectory` |

> Detalle técnico (ya resuelto en el código, no tienes que hacer nada): igual
> que Aetna, su Practitioner no soporta búsqueda por `identifier` (NPI) — solo
> por nombre — así que usa el mismo respaldo por nombre. Tampoco documenta un
> parámetro `active` en PractitionerRole, así que usa el mismo respaldo "sin
> filtro" que se agregó para UnitedHealthcare.

### Florida Blue (GuideWell) — portal confirmado, falta que te registres
Confirmé en vivo que **developer.bcbsfl.com** sí tiene un producto llamado
**"Provider Directory 1.0.0"** activo (junto a PDEX FHIR Service, Patient
Access, Payer2Payer). El registro es gratis ("Create a new account and get
started with our APIs. It's free to join.") — el detalle técnico exacto
(URL base, si pide API key u OAuth2) está detrás del login, así que no lo
pude confirmar sin una cuenta.
1. Entra a **developer.bcbsfl.com** → **Create a new account** (arriba a la derecha) → completa tus datos y confirma el email.
2. Una vez adentro, ve a **API Products** → abre **"Provider Directory"**.
3. Suscríbete al producto (puede pedir aprobación o darte acceso al instante — Florida Blue no especifica un plazo como Aetna).
4. Ahí mismo debería darte la URL base del servidor FHIR y, si aplica, un API key o Client ID/Secret.
5. Variable: `FHIR_FLORIDABLUE_BASE` con esa URL (más `FHIR_FLORIDABLUE_APIKEY` o `FHIR_FLORIDABLUE_CLIENT_ID`/`_CLIENT_SECRET`/`_TOKEN_URL` si el portal te da credenciales).
6. Si tienes dudas técnicas, el soporte del portal es **InteroperabilityAPIs@floridablue.com**.

### Molina
1. Entra a **developer.interop.molinahealthcare.com** → documentación/registro del **Provider Online Directory**.
2. Sigue su proceso de registro de developer para obtener la URL base.
3. Variable: `FHIR_MOLINA_BASE`.

### UnitedHealthcare (verificado — es la más fácil, sin registro)
Confirmado directo en **uhc.com/legal/interoperability-apis/patient-access-api**:
UHC publica su Provider Directory en endpoints **públicos, sin autenticación**
("Authorization NOT Required Endpoints — these endpoints are only applicable
to the public directory API calls"). No hace falta crear cuenta ni pedir
Client ID/Secret — solo agrega esta variable en Vercel:

| Variable | Valor |
|---|---|
| `FHIR_UHC_BASE` | `https://flex.optum.com/fhirpublic/R4` |

Y listo — sin `CLIENT_ID`, `CLIENT_SECRET` ni `TOKEN_URL`, el código ya
maneja el caso de "sin autenticación" (simplemente no manda esos headers).
Su API sí soporta buscar `Practitioner?identifier=<npi>` directamente, así
que no necesita el respaldo por nombre que sí usa Aetna.

> Nota: los links de arriba son los que encontré vigentes al armar esto; si
> alguno cambió de dirección, busca "[aseguradora] provider directory API
> developer" y deberías llegar al mismo lugar. Los portales piden datos
> básicos de tu organización (NPI del grupo, tax ID) — es gratis, no es una
> cuenta de "miembro" ni nada relacionado a facturación.

---

## Aseguradoras que se quedan manuales (por ahora)

MultiPlan/PHCS, Oscar, Curative, CarePlus, Devoted Health y Medicaid FL
(AHCA) no confirmé que tengan un Provider Directory FHIR público de este
tipo (algunas no son planes regulados por esta norma de CMS; otras no
encontré su portal de developer). Para esas, sigue usando el botón manual
"🔗 Verificar en directorios oficiales" que ya tenías. Si me confirmas que
alguna sí publica una API así, la agrego con el mismo patrón.

---

## Probar / depurar una aseguradora ya configurada

Abre en el navegador (reemplaza payer y npi):

```
https://kendallsouthcredentialing.vercel.app/api/verify-provider-directory?payer=humana&npi=1234567890&name=Ariel%20Goitia&debug=1
```

El parámetro `name` es opcional pero recomendado: si el pagador no soporta
buscar por NPI directamente (como Aetna), el código lo usa como respaldo —
busca por nombre y confirma el NPI en el resultado.

Con `&debug=1` te devuelve, además del resultado, la respuesta cruda del
servidor FHIR de esa aseguradora — mándamela si el resultado no coincide con
lo que sabes de ese doctor y ajusto el mapeo de campos.

Claves de `payer` válidas: `aetna`, `humana`, `unitedhealthcare`,
`florida_blue`, `molina`, `sunshine`, `ambetter`, `simply`, `wellcare`.

---

## Cobertura de Florida (ampliación)

El catálogo pasó de 9 a **23 aseguradoras**, cubriendo el mercado de Florida.
Se dividen en tres grupos.

### 1. Funcionan solas — no hay que configurar nada

Su Provider Directory FHIR es público y sin credenciales, así que la URL base
viene en el código (`defaultBase` en `api/_lib/fhirDirectory.js`). Si alguna
cambia de URL, se puede sobreescribir con su variable `FHIR_<PREFIJO>_BASE` en
Vercel — la variable de entorno siempre gana.

| Aseguradora | URL base | Estado |
|---|---|---|
| Cigna | `https://p-hi2.digitaledge.cigna.com/ProviderDirectory/v1` | Verificada en vivo — ver la limitación abajo |
| Devoted Health | `https://fhir.devoted.com/fhir` | Verificada en vivo |
| Community Care Plan | `https://ccpcmsioapi.zeomega.com/t/ccpprd.com/fhir/v1/ProviderDirectory/` | Verificada en vivo |
| Ambetter · Sunshine · Simply · WellCare | `https://iopc-pd.api.centene.com/iopc/pd/fhir/providerdirectory` | Centene, una sola API para las 4 marcas |
| AvMed | `https://avmp.interop.avmed.com/avmp/api/plannet` | Verificada en vivo — **no** es la URL que publica su web (ver abajo) |

### 2. Requieren registro (variable de entorno en Vercel)

UnitedHealthcare, Florida Blue, Molina, Humana, Aetna y **Aetna Better Health FL**
(`FHIR_AETNABH_*`, mismo servidor que Aetna).

> **AvMed — la URL que publican está mal.** Su página "For Developers" anuncia
> `https://myfhir.avmed.org/provider`, cuyo **certificado TLS está vencido**:
> cualquier cliente con validación normal falla. El host bueno es otro —
> `avmed.com`, no `avmed.org` — y está verificado en vivo devolviendo
> Practitioner y PractitionerRole con perfil Plan-Net y NPIs reales. Dos
> particularidades: su `/metadata` da 404 (las consultas de datos sí funcionan,
> así que no sirve como health check), y sus PractitionerRole vienen sin
> referencias de red, así que para AvMed "En red" hay que leerlo como "aparece
> en su directorio con un rol activo". Soporte (ya bajo Sentara):
> `CMSIODevSupport@sentara.com`.
>
> **Aetna:** su `/metadata` es público pero los datos devuelven **401** — pide
> OAuth2 sí o sí, a diferencia de lo que manda la regla de CMS. Además movió la
> base de `/fhir/v1/providerdirectory` a `/fhir/v1/providerdirectorydata`.

### 3. Sin Provider Directory FHIR consultable — verificación manual

Oscar, Curative, CarePlus, Health First, Freedom Health, Optimum HealthCare,
Vivida Health, Florida Community Care y Ultimate Health Plans **no publican** un
endpoint de directorio usable, aunque operan líneas reguladas de Medicaid/MA/QHP
en Florida. En la tabla salen como "Sin API pública" con el link directo a su
directorio para chequear a mano. Están ocultas por defecto detrás del botón
"Mostrar N aseguradoras sin API pública".

> **CarePlus — cuidado con la URL obvia:** `https://fhir.careplushealthplans.com/api`
> responde sin autenticación, pero es el servidor de **Patient Access**, no el
> directorio: `PractitionerRole` devuelve `total: 0` y `Practitioner` devuelve
> 253 registros con el nombre en blanco. No conectarlo como directorio.

### Limitación conocida de Cigna

Su API publica al proveedor como `Practitioner` activo, con dirección, teléfono
y titulación — pero **no hay forma de recuperar sus `PractitionerRole`**. Se
probaron todas las variantes: `practitioner=<id>`, `practitioner=Practitioner/<id>`,
`practitioner:identifier=<npi>`, `practitioner.identifier=<system>|<npi>`,
`identifier=<npi>` (400) y `_revinclude=PractitionerRole:practitioner`. Todas
devuelven vacío, y no es que el recurso esté vacío: una consulta suelta a
`PractitionerRole` devuelve registros con redes y taxonomía NUCC. Tampoco
respeta `_include`.

Consecuencia práctica: para Cigna la app muestra **"En el directorio ✓"** con la
dirección y el teléfono publicados, y manda a su directorio de consumidor
(`hcpdirectory.cigna.com`) para ver los planes, que ahí sí aparecen —
SureFit, HMO/Network, Open Access Plus, PPO. Ese directorio es un sistema
aparte, no FHIR.

---

## Acceso restringido (middleware.js)

Hasta ahora el sitio era **público**: cualquiera con la URL podía leer
`/api/get-doctors` y `/api/get-insurances` — NPIs, licencias, CAQH y contratos —
y llamar a `/api/delete-doctor`. `middleware.js` cierra la puerta antes de que
la petición llegue a la app o a las APIs.

Va como **Edge Middleware de Vercel**, que no cuenta contra el tope de 12
funciones del plan Hobby (confirmalo igual en el resumen del deploy).

### Qué crear en Vercel → Settings → Environment Variables

| Variable | Qué poner |
|---|---|
| `APP_PASSWORD` | La contraseña que compartirá el equipo |
| `AUTH_SECRET` | Una cadena larga al azar (32+ caracteres). Solo firma la cookie; no se escribe en ningún lado |

Ponelas vos y hacé **Redeploy**. Mientras falte alguna, el sitio queda
**cerrado** y lo dice en pantalla: nunca se abre solo. Es a propósito —
abrirse ante un error de configuración sería el peor comportamiento posible.

Para generar el `AUTH_SECRET`, en una terminal:
`openssl rand -base64 32`

### Cómo funciona

- Sin sesión, cualquier página devuelve el formulario de acceso y cualquier
  `/api/*` devuelve `401` en JSON (no una página de login, que rompería el
  front).
- Al entrar bien, se guarda una cookie firmada con HMAC-SHA256, `HttpOnly`,
  `Secure`, `SameSite=Lax`, válida **7 días**. La contraseña no viaja en la
  cookie ni queda guardada en el navegador.
- La comparación de la contraseña es de tiempo constante, y un intento fallido
  espera 700 ms para encarecer la prueba a lo bruto.
- El cron de vencimientos (`/api/cron-check-expirations`) queda exento: lo
  dispara Vercel y no lleva sesión de navegador.

### Lo que esto NO es

Es **una contraseña compartida**, no cuentas por persona. No hay registro de
quién entró ni quién borró algo, y si alguien deja la clínica hay que cambiar
la contraseña para todos. Alcanza para que los datos dejen de estar públicos,
que es el problema urgente. Si en algún momento se necesita saber quién hizo
cada cambio, o si se llegara a guardar información de pacientes, esto se queda
corto y hay que pasar a cuentas individuales (por ejemplo Supabase Auth, que ya
está en el proyecto).

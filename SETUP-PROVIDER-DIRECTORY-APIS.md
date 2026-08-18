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

**Importante:** no pude probar estas integraciones contra un servidor real
(mi entorno de trabajo no tiene acceso a internet general, y el navegador se
desconectó a mitad de la investigación). El código sigue el estándar Da Vinci
Plan-Net al pie de la letra, pero cada aseguradora implementa el estándar con
pequeñas diferencias. Usa `&debug=1` en la URL de verificación (ver abajo)
para ver la respuesta cruda de cada aseguradora la primera vez y así ajustar
el mapeo si hace falta — avísame con esa respuesta y lo corrijo.

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

### Aetna
1. Entra a **developerportal.aetna.com** → crea una cuenta de developer → registra una app.
2. Suscríbela al producto **"Provider Directory API"** (FHIR R4 / Da Vinci Plan-Net).
3. Copia la URL base de la API (y la API key/credenciales si el producto las pide).
4. Variables: `FHIR_AETNA_BASE` (y si aplica `FHIR_AETNA_APIKEY` o `FHIR_AETNA_CLIENT_ID` / `FHIR_AETNA_CLIENT_SECRET` / `FHIR_AETNA_TOKEN_URL`).

### Humana
1. Entra a **developers.humana.com** → crea cuenta → busca **"Provider Directory API"** en su marketplace.
2. Suscríbete y copia la URL base del entorno de producción.
3. Variable: `FHIR_HUMANA_BASE` (más las de API key/OAuth si tu suscripción las requiere).

### Centene — cubre Sunshine Health, Ambetter y Simply Healthcare (y WellCare)
1. Entra a **developer.centene.com** (Partner Portal de Centene) → crea cuenta → busca **"FHIR - Provider Directory"** en el catálogo de APIs.
2. Centene agrupa sus marcas bajo la misma plataforma; confirma en el portal si te da una sola URL base para todas o una por marca/estado (Florida).
3. Variables — usa la(s) misma(s) URL que te dé Centene, una por marca que uses:
   `FHIR_SUNSHINE_BASE`, `FHIR_AMBETTER_BASE`, `FHIR_SIMPLY_BASE`, `FHIR_WELLCARE_BASE`.

### Florida Blue (GuideWell)
1. Entra a **developer.bcbsfl.com** → API Developer Portal → producto **"Provider Directory"**.
2. Regístrate y sigue el flujo de "Getting Started" para obtener acceso.
3. Variable: `FHIR_FLORIDABLUE_BASE` (más credenciales si el portal las exige).

### Molina
1. Entra a **developer.interop.molinahealthcare.com** → documentación/registro del **Provider Online Directory**.
2. Sigue su proceso de registro de developer para obtener la URL base.
3. Variable: `FHIR_MOLINA_BASE`.

### UnitedHealthcare
1. UHC publica sus APIs de interoperabilidad en **uhc.com/legal/interoperability-apis** — desde ahí enlazan al portal de developer donde te registras.
2. Variable: `FHIR_UHC_BASE`.

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
https://kendallsouthcredentialing.vercel.app/api/verify-provider-directory?payer=humana&npi=1234567890&debug=1
```

Con `&debug=1` te devuelve, además del resultado, la respuesta cruda del
servidor FHIR de esa aseguradora — mándamela si el resultado no coincide con
lo que sabes de ese doctor y ajusto el mapeo de campos.

Claves de `payer` válidas: `aetna`, `humana`, `unitedhealthcare`,
`florida_blue`, `molina`, `sunshine`, `ambetter`, `simply`, `wellcare`.

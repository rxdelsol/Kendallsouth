# Kendall South — Mejoras de Credentialing

Este paquete añade a tu tracker:

**Insurances**
1. **Filtro + buscador** (texto; filtrar por aseguradora, doctor, tipo y network).
2. **Semáforo de vencimientos** con tarjetas resumen y colores en *Days Left*.
3. **Botón "Guía"** por fila: cómo *renovar* o *aplicar* con esa aseguradora (portal, documentos, plazos).

**Doctors**
4. **Semáforo de credenciales**: Licencia FL, DEA, CAQH (re-atestación cada 120 días), Malpractice y revalidación de Medicare (5 años), con mini-pills de colores y columna "Próx. vence".
5. **Buscador** + tarjetas resumen (Con vencido, ≤30, 31–60, Datos incompletos).
6. **Modal "Detalle"** por doctor: cada credencial con su fecha, días restantes y la acción/portal para renovarla.

**Buscar x NPI** (pestaña nueva)
7. Escribes un **NPI** (o nombre) y ves al doctor con **todos sus seguros** (In/Out of Network, expiración, semáforo) y el estado de sus credenciales. Resumen: In Network, Out of Network, Por vencer, Vencidos.

**Automático**
8. **Aviso por email** (Vercel Cron + Resend) de contratos de seguros **y** credenciales de doctores vencidos o próximos a vencer.

---

## Archivos incluidos

| Archivo | Qué es |
|---|---|
| `supabase-migration.sql` | **Ejecutar 1 vez** en Supabase (agrega columnas de fecha a `doctors`). |
| `src/components/InsurancesTable.jsx` | **Reemplaza** (filtro + semáforo + botón Guía). |
| `src/components/DoctorsTable.jsx` | **Reemplaza** (semáforo de credenciales + detalle + formulario con fechas). |
| `src/components/ProviderLookup.jsx` | **Nuevo**. Vista "Buscar x NPI". |
| `src/App.jsx` | **Reemplaza** (agrega la ruta de la vista NPI). |
| `src/components/Header.jsx` | **Reemplaza** (agrega el botón "Buscar x NPI"). |
| `src/data/renewalGuides.js` | **Nuevo**. Base de conocimiento por aseguradora. |
| `src/utils/credStatus.js` | **Nuevo**. Lógica compartida del semáforo. |
| `src/styles/index.css` | **Reemplaza** (estilos nuevos al final). |
| `api/get-doctors.js` | **Reemplaza** (lee las fechas nuevas). |
| `api/save-doctor.js` | **Reemplaza** (guarda las fechas nuevas). |
| `api/cron-check-expirations.js` | **Nuevo**. Revisa vencimientos y envía el email. |
| `src/components/EligibilityCheck.jsx` | **Nuevo**. Vista "Elegibilidad" (Availity). |
| `api/verify-npi.js` | **Nuevo**. Verificación NPPES (gratis). |
| `api/verify-medicare.js` | **Nuevo**. Verificación Medicare/PECOS (CMS). |
| `api/availity-eligibility.js` | **Nuevo**. Elegibilidad de paciente (Availity 270/271). |
| `vercel.json` | **Nuevo**. Programa la tarea (Vercel Cron). |

Copia estos archivos sobre tu repo (respetando las rutas) y haz commit/push. Vercel redeplega solo.

---

## Parte 0 — Migración de Supabase (¡HAZLA PRIMERO!)

El semáforo de doctores usa columnas de fecha nuevas. **Antes de subir el código**, agrégalas:

1. Entra a **supabase.com** → tu proyecto → **SQL Editor** → **New query**.
2. Pega el contenido de `supabase-migration.sql` y dale **Run**.
3. Es seguro (usa `if not exists`, no borra nada).

> Si subes el código sin correr esto, el botón *Save* de un doctor dará error porque las columnas aún no existen. Los seguros (Insurances) no dependen de la migración y funcionan igual.

---

## Parte 1 — Filtro, semáforo y guías (no requiere configuración)

Funcionan apenas subes los archivos. **Importante:** el semáforo y los avisos dependen de que cada seguro tenga **fecha de expiración**. Hoy la mayoría de tus 144 registros no la tienen — ve entrando la fecha con el botón **Edit** de cada fila. Los que no tengan fecha aparecen como *"Sin fecha"* (gris).

---

## Parte 2 — Email automático (configuración única)

El código ya está listo; solo faltan las credenciales. **Tú pegas las claves en Vercel; nunca las compartas por chat.**

### A) Crear cuenta en Resend (gratis)

1. Entra a **https://resend.com** y crea una cuenta.
2. **API Keys → Create API Key**. Copia la clave (empieza con `re_...`).
3. Remitente:
   - *Rápido para probar:* usa `onboarding@resend.dev` como remitente (solo llega a tu propio email de la cuenta Resend).
   - *Para producción:* **Domains → Add Domain**, verifica tu dominio con los registros DNS que te da Resend, y usa algo como `alertas@tudominio.com`.

### B) Variables de entorno en Vercel

En Vercel → tu proyecto → **Settings → Environment Variables**, agrega:

| Nombre | Valor |
|---|---|
| `RESEND_API_KEY` | La clave `re_...` de Resend |
| `ALERT_EMAIL_TO` | Tu email (o varios separados por coma) |
| `ALERT_EMAIL_FROM` | `onboarding@resend.dev` o tu remitente verificado |
| `CRON_SECRET` | Una clave inventada larga (ej. `ksmc-9f3k2xQ...`) para proteger el endpoint |

`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE` ya existen en tu proyecto — no las toques.

Después de agregarlas, haz **Redeploy** para que tomen efecto.

### C) Probar manualmente

Abre en el navegador (reemplaza el secret):

```
https://kendallsouthcredentialing.vercel.app/api/cron-check-expirations?secret=TU_CRON_SECRET
```

- Si faltan variables, te devuelve un resumen JSON **sin enviar** (útil para verificar el conteo).
- Si todo está bien, responde `{"ok":true,"sent":true,...}` y te llega el email.

### D) La tarea programada

`vercel.json` ya programa el aviso **cada lunes a las 12:00 UTC (~8 AM en Miami)**.
Para cambiar la frecuencia, edita el campo `schedule` (formato cron, en UTC):

- Diario 8 AM Miami: `"0 12 * * *"`
- Cada lunes y jueves: `"0 12 * * 1,4"`

> Nota: en el plan **Hobby** de Vercel los cron corren una vez al día como máximo. La hora puede variar por horario de verano (UTC no cambia; Miami sí).

---

## Parte 3 — Verificaciones externas (NPPES · Medicare · Availity)

En la pestaña **Buscar x NPI**, el botón **"Verificar NPPES + Medicare"** consulta fuentes externas. La pestaña **Elegibilidad** usa Availity.

### NPPES (NPI) — funciona solo, sin configurar
`api/verify-npi.js` consulta el registro público de NPI. No necesita claves. Confirma que el NPI está activo y que el nombre/taxonomía/licencia coinciden con tu registro (te avisa si el nombre no cuadra).

### Medicare / PECOS — requiere 1 variable
CMS publica el padrón "Medicare Fee-For-Service Public Provider Enrollment", pero el ID del dataset cambia con cada versión. Configúralo una vez:

1. Entra a **data.cms.gov** → busca *"Medicare Fee-For-Service Public Provider Enrollment"*.
2. Abre la pestaña **API** del dataset y copia la URL de "data".
3. En Vercel agrega la variable `CMS_ENROLLMENT_API` con esa URL, poniendo `{npi}` donde va el número. Ejemplo:
   `https://data.cms.gov/data-api/v1/dataset/<ID>/data?filter[NPI]={npi}&size=20`

Sin esta variable, la verificación de Medicare simplemente muestra "no verificado" (no rompe nada).

### Availity Eligibility (270/271) — requiere credenciales
> ⚠️ Recuerda: Availity confirma la cobertura de un **paciente**, no la participación del proveedor en la red (eso no existe como API).

1. En **developer.availity.com** crea/usa tu app, suscríbela al producto **Coverages** y copia el `client_id` y `client_secret`.
2. En Vercel agrega:

| Nombre | Valor |
|---|---|
| `AVAILITY_CLIENT_ID` | tu client id |
| `AVAILITY_CLIENT_SECRET` | tu client secret |
| `AVAILITY_SCOPE` | `hipaa` (por defecto; ajústalo si tu cuenta usa otro) |

3. Los **Payer ID** los tomas de la *Payer List* de Availity (varían por pagador).
4. La primera consulta: usa **"Ver respuesta completa de Availity"** para confirmar los nombres exactos de los campos de tu pagador. Si el formato del 270/271 de tu cuenta difiere, mándame esa respuesta y ajusto el mapeo (variables opcionales `AVAILITY_BASE` y `AVAILITY_COVERAGES_PATH` permiten cambiar el endpoint sin tocar código).

> PHI: la elegibilidad maneja datos del paciente. Todo va servidor-a-servidor (las claves nunca llegan al navegador) y no se registran en logs.

---

## Umbral de aviso

Por defecto avisa de todo lo que esté **vencido o venza dentro de 90 días**, agrupado en Vencidos / ≤30 / 31–60 / 61–90. Para cambiarlo, edita `WARN_WITHIN_DAYS` en `api/cron-check-expirations.js`.

---

## Nota sobre los datos

La sección Insurances lee de **Supabase** vía `/api/get-insurances`. Los botones "Download/Upload Database" del encabezado son un mecanismo aparte (localStorage heredado) y **no** afectan a Supabase — el semáforo y el email siempre usan Supabase, que es la fuente real.

Los portales y plazos de las guías son referencias operativas de credentialing en Florida y **pueden cambiar**; confirma siempre la fecha efectiva y los deadlines en el portal de cada pagador.

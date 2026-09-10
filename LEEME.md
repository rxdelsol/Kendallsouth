# Ronda 7 — El sitio se llama solo **Kendall South Medical Center**

**Reemplaza a `ksmc-v6.zip`, `ksmc-v5.zip` y `ksmc-v4-research.zip`.** Sube solo
éste: trae todo lo de las rondas anteriores.

---

## El cambio de nombre

Se fue "— Provider Credential Tracker" de los seis sitios donde aparecía. No
bastaba con la barra de arriba: el nombre largo seguía saliendo en la pestaña
del navegador, en el icono si alguien instala el sitio en el teléfono, y en el
encabezado y el pie de los PDF que exporta la sección Reports.

| Dónde | Antes | Ahora |
|---|---|---|
| Pestaña del navegador | Kendall South Medical Center — Provider Credential Tracker | Kendall South Medical Center |
| Barra de arriba | nombre + subtítulo en azul | solo el nombre |
| App instalada (manifest) | nombre largo · corto "PCT Website" | Kendall South Medical Center · corto "Kendall South" |
| PDF exportado | nombre largo en encabezado y pie | Kendall South Medical Center |
| `src/ui/App.jsx`, `src/components/Header.jsx` | nombre largo | corregidos también |

Los dos últimos son pantallas viejas que hoy no están montadas en ninguna ruta.
Las cambié igual: si alguien las vuelve a conectar, el nombre largo reaparecería
sin que nadie entienda de dónde salió.

**Un detalle de maquetación.** El bloque de la barra era de dos líneas y su
propia altura lo centraba. Quitando el subtítulo, el nombre quedaba pegado
arriba y a 13.5 px se veía menudo junto al buscador. Ahora el bloque se centra
de verdad y el nombre sube a 15 px.

La página de inicio de sesión ya decía solo "Kendall South Medical Center", así
que no la toqué.

---

## Cómo subir esta ronda

Descomprime. Quedan **dos carpetas** (`src`, `api`), **dos archivos sueltos**
(`index.html`, `manifest.webmanifest`) y dos `.sql`.

1. Abre **`https://github.com/rxdelsol/Kendallsouth/upload/main`** — la raíz.
   Arriba tiene que decir solo `Kendallsouth /`, sin subcarpetas.
2. Arrastra **las dos carpetas y los dos archivos sueltos a la vez**.
   `index.html` y `manifest.webmanifest` van en la raíz del repo, que es donde
   ya están: se reemplazan solos.
3. Si en la lista ves `src/src/...`, cancela — entraste a una subcarpeta.
4. Commit.

Los `.sql` no se suben: se pegan en Supabase (ver abajo).

---

## Si es la primera vez que subes desde la ronda 4

Hay tres cosas más que hacer una sola vez. Si ya las hiciste, sáltatelas.

### Los dos SQL en Supabase

**SQL Editor → New query → Run**, en este orden (el segundo usa funciones del
primero):

1. `supabase-study-files.sql` — bucket privado `study-docs`, tablas
   `site_users`, `study_docs`, `doc_events`, y las políticas RLS.
2. `supabase-applications.sql` — tabla `trial_applications`.

### Tu usuario

**Authentication → Users → Add user**: `manager@floridatrials.org`, contraseña
la que tú pongas, marca *Auto Confirm User*. Después, en el SQL Editor:

```sql
insert into site_users (id, email, full_name, role)
select id, email, 'Kendall South Manager', 'admin' from auth.users
where email = 'manager@floridatrials.org'
on conflict (id) do update set role = 'admin', active = true;
```

### Las dos variables en Vercel

**Settings → Environment Variables**, tipo **Config**, Production:

| Key | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://jtyklteafygjxmirsode.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | la clave **anon / public**, Supabase → Settings → API |

### Y borra las tres copias sueltas del repo

Abrir en GitHub → `⋯` → *Delete file* → commit:
`credStatus.js` (en la raíz) · `src/utils/src/utils/credStatus.js` ·
`src/utils/README.md`.

---

## Lo que ya traía este paquete

- **Opportunities** — buscar en vivo lo que recluta en Florida
  (ClinicalTrials.gov) con el contacto de cada estudio, y el pipeline de
  aplicaciones con alerta de feasibilities calladas más de 21 días.
- **Study Files** — binder regulatorio por estudio, bucket privado, descargas
  con enlace firmado de 60 segundos y log de quién hizo qué.
- **Research** — siete estudios abiertos, equipo con CV y GCP, perfil de sitio,
  capacidades, 98 estudios de histórico y documentos de sitio.
- **La ficha del proveedor** ya no corta el NPI.
- **La fila de DEA** desaparece en los registros que no prescriben.

## Sigue pendiente de tu lado

- **El GCP de Maria E. Gadea** venció el 18 Feb 2024 y sigue activa.
- **El apellido de Gabriela**, y su CV y GCP.
- **`GCP/Jose luis 2029.pdf` está mal nombrado** — adentro dice Jose Hernandez
  Guevara.
- **PI, sub-investigadores y versión de protocolo** de los siete estudios
  abiertos.
- **`RESEND_API_KEY`** para que salgan los correos de vencimientos.

Probado con `vite build`: limpio.

# Ronda 8 — Arreglado el fallo del despliegue

**Reemplaza a `ksmc-v7.zip` y a todos los anteriores.** Sube solo éste.

---

## Qué pasó

Los dos despliegues fallaron con esto:

> **Build Failed** — No more than 12 Serverless Functions can be added to a
> Deployment on the Hobby plan.

El error fue mío. El repo tiene 15 archivos en `api/`, de los cuales
`.vercelignore` ya excluye tres para quedar justo en el tope de 12. Al añadir
`api/trial-search.js` para la búsqueda de ensayos, subió a 13 y Vercel rechazó
el build entero. Debí contarlas antes de mandarte el paquete.

Tu sitio no se rompió en ningún momento: como el build falló, Vercel dejó en
producción el despliegue bueno anterior. Lo que no pasó fue el cambio de nombre.

## Cómo lo arreglé

La búsqueda ya no es una función serverless: se mudó a `middleware.js`, que
corre en el edge y **no cuenta contra el tope de 12**. La URL sigue siendo
`/api/trial-search`, así que el resto de la app no cambia ni una línea.

Ya había precedente en tu propio repo: `/logout` vive en el middleware por
exactamente esta razón, y el comentario del archivo lo dice.

De regalo, la búsqueda ahora queda detrás de la misma sesión que el resto del
sitio en vez de ser un endpoint abierto — el middleware la atiende solo después
de validar la cookie.

**Vuelve a quedar en 12 funciones exactas.** Si algún día quieres añadir otra
función, hay que subir a Pro, excluir otra en `.vercelignore`, o mudarla también
al middleware. Te lo dejo escrito para que no nos vuelva a pasar.

## Y ya no hay `api/` en este ZIP

Este paquete no trae carpeta `api`. Si en la subida anterior llegaste a crear
`api/trial-search.js` en el repo, **bórralo** (GitHub → abrir el archivo → `⋯` →
*Delete file* → commit) o el build va a seguir fallando por lo mismo.

---

## Cómo subir

Descomprime. Quedan **una carpeta** (`src`), **tres archivos sueltos**
(`index.html`, `manifest.webmanifest`, `middleware.js`) y dos `.sql`.

1. Abre **`https://github.com/rxdelsol/Kendallsouth/upload/main`** — la raíz.
   Arriba tiene que decir solo `Kendallsouth /`.
2. Arrastra **la carpeta `src` y los tres archivos sueltos a la vez**. Los tres
   sueltos van a la raíz, que es donde ya viven: se reemplazan solos.
3. Si en la lista ves `src/src/...`, cancela — entraste a una subcarpeta.
4. Commit.
5. Si existe `api/trial-search.js` en el repo, bórralo.

Los `.sql` no se suben: se pegan en Supabase.

---

## Lo que trae

### El nombre

Se fue "— Provider Credential Tracker" de los seis sitios donde salía: pestaña
del navegador, barra de arriba, manifest (nombre corto pasa de "PCT Website" a
"Kendall South"), encabezado y pie de los PDF, y dos pantallas viejas sin ruta
que corregí para que el nombre largo no reaparezca si alguien las vuelve a
conectar.

El bloque de la barra era de dos líneas y su altura lo centraba; sin subtítulo
quedaba pegado arriba, así que ahora se centra de verdad y sube a 15 px.

### **Opportunities**

Buscar en vivo lo que recluta en Florida, con el contacto de cada estudio y los
que ya tienen más de 120 sitios marcados en ámbar. Y el pipeline de aplicaciones
con alerta de feasibilities calladas más de 21 días.

### **Study Files**

Binder regulatorio por estudio. Bucket privado, descargas con enlace firmado de
60 segundos, y log de quién hizo qué que nadie puede borrar.

### **Research**

Siete estudios abiertos con PI, sub-investigadores y versión de protocolo
(vacíos hasta que me pases los datos); equipo con CV y GCP; perfil de sitio,
capacidades, 98 estudios de histórico y documentos de sitio.

### Y lo de antes

La ficha del proveedor ya no corta el NPI, y la fila de DEA desaparece en los
registros que no prescriben.

---

## Si es la primera vez que subes desde la ronda 4

Falta hacer esto una sola vez:

1. **Los dos SQL en Supabase**, en orden: `supabase-study-files.sql` y después
   `supabase-applications.sql`.
2. **Tu usuario**: Authentication → Users → Add user
   (`manager@floridatrials.org`, *Auto Confirm User*), y luego en el SQL Editor:

   ```sql
   insert into site_users (id, email, full_name, role)
   select id, email, 'Kendall South Manager', 'admin' from auth.users
   where email = 'manager@floridatrials.org'
   on conflict (id) do update set role = 'admin', active = true;
   ```
3. **Dos variables en Vercel**, tipo Config, Production:
   `VITE_SUPABASE_URL` = `https://jtyklteafygjxmirsode.supabase.co` y
   `VITE_SUPABASE_ANON_KEY` = la clave anon/public.
4. **Borrar del repo**: `credStatus.js` (raíz), `src/utils/src/utils/credStatus.js`,
   `src/utils/README.md`, y `api/trial-search.js` si llegó a crearse.

## Sigue pendiente

- **El GCP de Maria E. Gadea** venció el 18 Feb 2024 y sigue activa.
- **El apellido de Gabriela**, y su CV y GCP.
- **`GCP/Jose luis 2029.pdf`** está a nombre de Jose Hernandez Guevara.
- **PI, sub-I y versión de protocolo** de los siete estudios abiertos.
- **`RESEND_API_KEY`** para los correos de vencimientos.

Probado con `vite build`: limpio. `middleware.js` pasa `node --check`.

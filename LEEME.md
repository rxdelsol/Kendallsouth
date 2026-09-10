# Ronda 6 — Opportunities, Study Files, Research y lo anterior

**Este paquete reemplaza a `ksmc-v5.zip` y a `ksmc-v4-research.zip`.** Si no
subiste ninguno de los dos, sube solo éste: trae todo.

---

## Orden

1. Correr los dos `.sql` en Supabase
2. Crear tu usuario y darte admin
3. Crear dos variables en Vercel
4. Subir `src` **y** `api` a GitHub
5. Borrar las tres copias sueltas del repo

---

## Paso 1 — Los dos SQL

En **Supabase → SQL Editor → New query → Run**, primero uno y después el otro,
en este orden (el segundo usa funciones que crea el primero):

1. `supabase-study-files.sql` — bucket privado `study-docs`, tablas
   `site_users`, `study_docs`, `doc_events`, y las políticas RLS.
2. `supabase-applications.sql` — tabla `trial_applications` con sus políticas.

Los dos se pueden correr dos veces sin romper nada.

## Paso 2 — Tu usuario

**Supabase → Authentication → Users → Add user.** Email
`manager@floridatrials.org`, contraseña la que tú pongas, marca
*Auto Confirm User*. Después, en el SQL Editor:

```sql
insert into site_users (id, email, full_name, role)
select id, email, 'Kendall South Manager', 'admin' from auth.users
where email = 'manager@floridatrials.org'
on conflict (id) do update set role = 'admin', active = true;
```

| Rol | Puede |
|---|---|
| `viewer` | ver y descargar; ver el pipeline |
| `member` | además subir documentos y editar aplicaciones |
| `admin` | además borrar y ver el log de auditoría |

## Paso 3 — Las dos variables en Vercel

**Settings → Environment Variables**, tipo **Config**, entorno Production:

| Key | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://jtyklteafygjxmirsode.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | la clave **anon / public**, Supabase → Settings → API |

La `anon` está hecha para viajar en el navegador; lo que decide quién ve qué son
las políticas del paso 1. La `service_role` no va al navegador nunca.

Vite las incrusta al compilar, así que tienen que existir antes del despliegue.

## Paso 4 — Subir el código

Descomprime. Quedan dos carpetas, `src` y `api`, más dos `.sql` (esos no se
suben, se pegan en Supabase).

Abre **`https://github.com/rxdelsol/Kendallsouth/upload/main`** — la raíz, sin
entrar a ninguna subcarpeta; arriba tiene que decir solo `Kendallsouth /`.
Arrastra **las dos carpetas a la vez**. Si en la lista ves `src/src/...`,
cancela: entraste a una subcarpeta. Eso fue lo que falló la primera vez.

## Paso 5 — Borra las tres copias sueltas

Abrir en GitHub → `⋯` → *Delete file* → commit:

| Archivo | Por qué |
|---|---|
| `credStatus.js` (raíz) | copia huérfana, nadie la importa |
| `src/utils/src/utils/credStatus.js` | ruta duplicada |
| `src/utils/README.md` | instrucciones mías, no código |

---

## La sección nueva: **Opportunities**

Dos pestañas.

### Find trials in Florida

Busca en vivo en ClinicalTrials.gov lo que está reclutando en Florida, lo más
recientemente actualizado primero. Por cada estudio: patrocinador, fase,
condición, cuántos pacientes planea, **cuántos sitios ya tiene** y a quién se le
escribe (el contacto central, con correo y teléfono cuando el registro lo trae).

Puedes buscar por texto o arrancar de un clic desde cualquiera de las nueve
áreas terapéuticas que el sitio ya declara en su perfil — que es donde tienes
experiencia que enseñar.

Dos cosas de honestidad que vale la pena que sepas:

- **El registro no es un formulario de aplicación.** ClinicalTrials.gov es donde
  los patrocinadores publican, no donde se aplica. "Aplicar" en la práctica es
  escribirle al contacto central o entrar al portal de sitios del CRO. Por eso
  la pantalla te da el contacto y el enlace, y no un botón de "aplicar" que no
  existiría.
- **Los estudios con más de 120 sitios salen marcados en ámbar.** Un estudio con
  300 sitios ya repartidos rara vez abre más; aplicar a ése suele ser gastar una
  tarde en un cuestionario. No lo escondo, lo marco.

### Pipeline

Una fila por oportunidad, con etapa (*Interested → Feasibility sent → CDA signed
→ Site selected → In start-up*, más *Not selected / We declined / Closed*),
fecha en que aplicaste, próximo paso con su fecha, dueño y contacto.

Desde la búsqueda, **Track this** crea la fila con el NCT, el título, el
patrocinador y el contacto ya rellenos.

Arriba hay cuatro contadores, y dos son los que hacen el trabajo:

- **Silent > 21d** — feasibilities mandadas hace más de tres semanas sin
  respuesta. Eso no es "en proceso": es esperar a que alguien de acá levante el
  teléfono.
- **Next step overdue** — el próximo paso ya venció.

Las etapas son una lista cerrada a propósito. "En proceso" y "pendiente"
escritos a mano terminan significando cosas distintas para cada persona, y
entonces no se puede contar cuántas están de verdad esperando respuesta.

### Una cosa que no pude probar

La búsqueda sale de este entorno bloqueada por la red del contenedor donde
trabajo, así que la escribí contra la API v2 de ClinicalTrials.gov pero **no la
vi correr con datos reales**. Va a funcionar desde Vercel, que no tiene esa
restricción. Si al abrirla algo no cuadra, mándame lo que dice y lo ajusto en
minutos. Por si acaso, si el registro rechaza el filtro de fase o el orden, la
función reintenta sin ellos y la pantalla te avisa que el filtro no se aplicó,
en vez de enseñarte resultados de todas las fases como si fueran los pedidos.

---

## Lo demás que trae

### **Study Files** — binder regulatorio por estudio

Subir, buscar y descargar por protocolo y categoría. Bucket privado, cada
descarga con enlace firmado que caduca en 60 segundos, y cada acción registrada
con el correo de quien la hizo. Una versión vieja se marca *superseded*, no se
borra: en un binder la versión anterior es la prueba de qué estaba vigente
cuándo.

**Nada de source documents de pacientes ahí.** Eso es PHI y necesita un BAA
firmado con Supabase y con Vercel antes del primer archivo.

### **Research** — seis pestañas, abre en *Active studies*

Los siete estudios abiertos con PI, sub-investigadores y versión de protocolo
(vacíos en ámbar hasta que me pases los datos); el equipo con CV y GCP bajo el
mismo semáforo que Providers; perfil de sitio, capacidades, los 98 estudios del
histórico y los documentos de sitio.

### La ficha del proveedor ya no corta los números

`.modal.modal-record` en vez de `.modal-record`, porque la regla base `.modal` de
`src/styles/index.css` se carga después y le ganaba. Abre a 1180 px, y ninguna
columna de identificadores se hace más angosta que un NPI de 10 dígitos.

### La fila de DEA desaparece donde no aplica

Kendall South Inc., Sara Zayas, Natasha, Hailin Wu, Yalit y Karla Santos pierden
la fila. Jimenez, Pedro Fernandez y Gadea la conservan: tienen número pero no
certificado, y ese hueco tiene que verse.

---

## Sigue pendiente de tu lado

- **El GCP de Maria E. Gadea** venció el 18 Feb 2024 y sigue activa.
- **El apellido de Gabriela**, y su CV y GCP.
- **`GCP/Jose luis 2029.pdf` está mal nombrado** — adentro dice Jose Hernandez
  Guevara.
- **PI, sub-investigadores y versión de protocolo** de los siete estudios
  abiertos.
- **`RESEND_API_KEY`** para que salgan los correos de vencimientos.

Probado con `vite build`: limpio.

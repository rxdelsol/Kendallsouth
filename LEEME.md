# Otras credenciales — cambio para el tracker

Agrega al panel PROVIDER RECORD las credenciales que antes no cabían: residuos
biomédicos, calibración de equipos, OSHA, HIPAA, CLIA, business tax, bomberos,
rayos X, o cualquier otra que escribas. Se pintan con el mismo semáforo y la
misma barra que las cinco de siempre, y entran en el correo de aviso de 90/60/30
días.

Repo: `rxdelsol/Kendallsouth` · probado con `vite build`, compila limpio.

## Orden — importa

### 1. Corre la migración en Supabase

Supabase → SQL Editor → New query → pega esto → Run:

```sql
alter table doctors add column if not exists extra_creds jsonb not null default '[]'::jsonb;
```

Es seguro: `if not exists`, no borra ni cambia nada existente. Está también al
final de `supabase-migration.sql`.

Si subes los archivos **antes** de correr la migración no se rompe nada — el
`save-doctor` ya reintenta sin las columnas nuevas — pero lo que escribas en
"Otras credenciales" no se guarda hasta que la corras.

### 2. Sube estos 7 archivos al repo

Cada uno reemplaza el que ya existe, en la misma ruta:

| Archivo | Qué cambia |
|---|---|
| `supabase-migration.sql` | La línea del `alter table` nueva, documentada |
| `api/get-doctors.js` | Devuelve `extraCreds` al front |
| `api/save-doctor.js` | Guarda y limpia `extra_creds` (descarta filas sin nombre, recorta largos) |
| `api/cron-check-expirations.js` | Las adicionales entran al correo de aviso |
| `src/utils/credStatus.js` | `doctorCredentials()` las agrega al final + catálogo de sugerencias |
| `src/components/DoctorsTable.jsx` | El bloque "Otras credenciales" en el formulario Edit Doctor |
| `src/styles/index.css` | Estilos de ese bloque |

`src/components/ProviderRecord.jsx` **no se toca**: ya recorre
`doctorCredentials()`, así que las nuevas filas aparecen solas.

### 3. Redeploy en Vercel

El push dispara el build. Nada más que hacer.

## Cómo se usa

Abre cualquier proveedor → **Edit** → baja a **Otras credenciales**.

- **Agregar de la lista** trae la etiqueta y el texto de "qué hay que hacer" ya
  escritos, para los 11 trámites más comunes de una práctica en Florida.
- **Agregar en blanco** para cualquier otra cosa.
- Cada fila tiene nombre, fecha de vencimiento y una nota de qué hacer para
  renovarla. Sin nombre no se guarda.

## Por qué una columna JSON y no seis columnas

Con columnas fijas, cada trámite nuevo — bomberos, Certificate of Use, rayos X —
pide otra migración, otro campo en el formulario y otro deploy. Con la lista, se
agrega escribiendo. El costo es que no puedes filtrar por "todos los que tienen
residuos biomédicos" con SQL simple; si algún día hace falta, se resuelve con un
índice GIN sobre `extra_creds`.

## Para cargar lo del grupo cuando esté arriba

En la ficha de **Kendall South Medical Center Inc.**:

| Credencial | Vence | Nota |
|---|---|---|
| Permiso de residuos biomédicos | 2026-09-30 | Permiso 13-64-13168 · $152 sin pagar · después de pagar hay que mandar la renovación y el reporte anual a MiamidadeEH@flhealth.gov |
| Calibración y mantenimiento de equipos | 2026-11-12 | All Medical Repairs LLC · invoice 2223262 |
| Capacitación OSHA | 2027-07-07 | OSHA & HIPAA Compliance, Inc. |
| Capacitación HIPAA / HITECH | 2027-07-07 | OSHA & HIPAA Compliance, Inc. |

La licencia FL de esa ficha ya lleva el AHCA (04/21/2027) y el malpractice el
12/13/2026, así que con esas cuatro queda todo el grupo en un solo registro.

-- supabase-study-files.sql
-- Archivo del binder regulatorio por estudio: subir, listar, descargar.
--
-- Corre esto UNA VEZ en Supabase → SQL Editor → New query → Run.
-- Es idempotente: si lo corres dos veces no rompe nada.
--
-- Qué crea:
--   1. el bucket privado study-docs
--   2. site_users   — quién puede entrar y con qué permiso
--   3. study_docs   — un registro por archivo (metadatos, no el archivo)
--   4. doc_events   — quién subió, descargó o borró qué, y cuándo
--   5. las políticas RLS que hacen que nada de lo anterior sea decorativo
--
-- IMPORTANTE: este módulo es para el binder regulatorio — protocolo y enmiendas,
-- IB, delegation log, cartas del IRB, certificados de training, CDAs, logs de
-- equipo. NO subas source documents de pacientes acá. Eso es PHI y necesita un
-- BAA firmado con Supabase y con Vercel antes de tocar el primer archivo.


-- ── 1. Bucket ───────────────────────────────────────────────────────────────
-- private = true: no hay URL pública. Cada descarga pasa por una URL firmada
-- con vencimiento corto, que es lo que permite saber quién descargó qué.
insert into storage.buckets (id, name, public, file_size_limit)
values ('study-docs', 'study-docs', false, 52428800)  -- 50 MB por archivo
on conflict (id) do update set public = false;


-- ── 2. Personas ─────────────────────────────────────────────────────────────
-- Se apoya en auth.users de Supabase: las contraseñas las guarda y las cifra
-- Supabase, no esta tabla y no yo. Acá solo vive el rol.
--
--   viewer  ve la lista y descarga
--   member  además sube
--   admin   además borra, ve el log de auditoría y cambia roles
create table if not exists site_users (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  full_name  text,
  role       text not null default 'viewer' check (role in ('viewer','member','admin')),
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists site_users_email_idx on site_users (lower(email));

-- Funciones de ayuda. security definer para que puedan leer site_users desde
-- dentro de una política sin caer en recursión de RLS.
create or replace function my_role() returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select role from site_users where id = auth.uid() and active), 'none');
$$;

create or replace function can_upload() returns boolean
language sql stable security definer set search_path = public as $$
  select my_role() in ('member','admin');
$$;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select my_role() = 'admin';
$$;


-- ── 3. Archivos ─────────────────────────────────────────────────────────────
create table if not exists study_docs (
  id           uuid primary key default gen_random_uuid(),
  protocol     text not null,               -- 'C5091017', 'CV44536', …
  category     text not null default 'Other',
  title        text not null,
  version      text,                        -- 'v4.0', 'Amendment 3'
  doc_date     date,                        -- la fecha que lleva el documento
  filename     text not null,
  storage_path text not null unique,
  bytes        bigint,
  mime         text,
  uploaded_by  uuid references auth.users(id),
  uploaded_at  timestamptz not null default now(),
  superseded   boolean not null default false
);

create index if not exists study_docs_protocol_idx on study_docs (protocol);
create index if not exists study_docs_cat_idx on study_docs (category);


-- ── 4. Auditoría ────────────────────────────────────────────────────────────
-- Un binder sin log de quién sacó qué es media respuesta cuando el monitor
-- pregunta. Se escribe siempre, y nadie puede borrar de acá: no hay política
-- de delete, así que ni un admin la tiene.
create table if not exists doc_events (
  id       bigserial primary key,
  doc_id   uuid references study_docs(id) on delete set null,
  protocol text,
  filename text,
  action   text not null check (action in ('upload','download','delete','supersede')),
  actor    uuid references auth.users(id),
  actor_email text,
  at       timestamptz not null default now()
);

create index if not exists doc_events_at_idx on doc_events (at desc);


-- ── 5. RLS ──────────────────────────────────────────────────────────────────
alter table site_users enable row level security;
alter table study_docs enable row level security;
alter table doc_events enable row level security;

-- site_users: cada quien se ve a sí mismo; el admin ve y cambia a todos.
drop policy if exists su_self on site_users;
create policy su_self on site_users for select to authenticated
  using (id = auth.uid() or is_admin());

drop policy if exists su_admin_write on site_users;
create policy su_admin_write on site_users for all to authenticated
  using (is_admin()) with check (is_admin());

-- study_docs: lo ve cualquier usuario activo; lo escribe member o admin;
-- lo borra solo admin.
drop policy if exists sd_read on study_docs;
create policy sd_read on study_docs for select to authenticated
  using (my_role() <> 'none');

drop policy if exists sd_insert on study_docs;
create policy sd_insert on study_docs for insert to authenticated
  with check (can_upload() and uploaded_by = auth.uid());

drop policy if exists sd_update on study_docs;
create policy sd_update on study_docs for update to authenticated
  using (can_upload()) with check (can_upload());

drop policy if exists sd_delete on study_docs;
create policy sd_delete on study_docs for delete to authenticated
  using (is_admin());

-- doc_events: el admin lee todo, el resto solo lo suyo. Insertar puede
-- cualquiera activo — si no, no se registraría la descarga de un viewer.
-- No hay update ni delete a propósito: el log es de solo escribir y leer.
drop policy if exists de_read on doc_events;
create policy de_read on doc_events for select to authenticated
  using (is_admin() or actor = auth.uid());

drop policy if exists de_insert on doc_events;
create policy de_insert on doc_events for insert to authenticated
  with check (my_role() <> 'none' and actor = auth.uid());


-- ── 6. Políticas del bucket ─────────────────────────────────────────────────
drop policy if exists sdoc_read on storage.objects;
create policy sdoc_read on storage.objects for select to authenticated
  using (bucket_id = 'study-docs' and my_role() <> 'none');

drop policy if exists sdoc_write on storage.objects;
create policy sdoc_write on storage.objects for insert to authenticated
  with check (bucket_id = 'study-docs' and can_upload());

drop policy if exists sdoc_del on storage.objects;
create policy sdoc_del on storage.objects for delete to authenticated
  using (bucket_id = 'study-docs' and is_admin());


-- ── 7. Tu usuario admin ─────────────────────────────────────────────────────
-- Después de correr todo esto:
--   a) Supabase → Authentication → Users → Add user
--      email: manager@floridatrials.org, y la contraseña la pones tú.
--      (Marca "Auto Confirm User" para no esperar el correo.)
--   b) Vuelve acá y corre esta línea para darte el rol de admin:
--
--      insert into site_users (id, email, full_name, role)
--      select id, email, 'Kendall South Manager', 'admin' from auth.users
--      where email = 'manager@floridatrials.org'
--      on conflict (id) do update set role = 'admin', active = true;
--
-- Para cada persona más: créala en Authentication → Users y repite el insert
-- con su email y el rol que le toque ('viewer', 'member' o 'admin').

-- supabase-applications.sql
--
-- Seguimiento de las oportunidades a las que el sitio aplica.
-- Corre esto DESPUÉS de supabase-study-files.sql: reutiliza site_users,
-- my_role() y can_upload(), que se crean allá.
--
-- Supabase → SQL Editor → New query → Run. Se puede correr dos veces.

create table if not exists trial_applications (
  id            uuid primary key default gen_random_uuid(),

  -- Qué es
  nct           text,                  -- si salió de la búsqueda
  protocol      text,                  -- número del patrocinador, si lo dieron
  title         text not null,
  sponsor       text,
  cro           text,
  indication    text,
  phase         text,

  -- Dónde va
  -- La lista es cerrada a propósito. "En proceso" y "pendiente" escritos a mano
  -- terminan significando cosas distintas para cada persona, y entonces no se
  -- puede contar cuántas están de verdad esperando respuesta.
  stage         text not null default 'interested'
                check (stage in ('interested','feasibility_sent','cda_signed',
                                 'site_selected','startup','not_selected','declined','closed')),

  applied_on    date,                  -- cuándo se mandó la feasibility
  next_step     text,                  -- lo próximo que hay que hacer
  next_due      date,                  -- y para cuándo
  owner_name    text,                  -- quién lo lleva
  contact       text,                  -- a quién se le escribe del lado del sponsor
  url           text,
  notes         text,

  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists ta_stage_idx on trial_applications (stage);
create index if not exists ta_due_idx   on trial_applications (next_due);
create unique index if not exists ta_nct_idx on trial_applications (nct) where nct is not null;

-- updated_at que no depende de que el front se acuerde de ponerlo.
create or replace function touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

drop trigger if exists ta_touch on trial_applications;
create trigger ta_touch before update on trial_applications
  for each row execute function touch_updated_at();

alter table trial_applications enable row level security;

drop policy if exists ta_read on trial_applications;
create policy ta_read on trial_applications for select to authenticated
  using (my_role() <> 'none');

drop policy if exists ta_write on trial_applications;
create policy ta_write on trial_applications for insert to authenticated
  with check (can_upload());

drop policy if exists ta_update on trial_applications;
create policy ta_update on trial_applications for update to authenticated
  using (can_upload()) with check (can_upload());

drop policy if exists ta_delete on trial_applications;
create policy ta_delete on trial_applications for delete to authenticated
  using (is_admin());

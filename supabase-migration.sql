-- Migración: campos de vencimiento de credenciales por doctor
-- Ejecuta esto UNA VEZ en Supabase → SQL Editor → New query → Run.
-- Es seguro: usa "if not exists", no borra ni cambia datos existentes.

alter table doctors add column if not exists license_exp date;            -- vencimiento de licencia FL
alter table doctors add column if not exists dea text;                    -- número DEA
alter table doctors add column if not exists dea_exp date;                -- vencimiento DEA
alter table doctors add column if not exists caqh_attested date;          -- fecha de última atestación CAQH (vence a los 120 días)
alter table doctors add column if not exists malpractice_exp date;        -- vencimiento de malpractice/COI
alter table doctors add column if not exists medicare_revalidation date;  -- fecha de revalidación de Medicare (cada 5 años)

-- ---------------------------------------------------------------------------
-- Credenciales adicionales: permisos y trámites que no son del clínico sino de
-- la operación — residuos biomédicos, calibración de equipos, OSHA, HIPAA,
-- CLIA, business tax, bomberos. Una sola columna JSON en vez de una columna por
-- tipo: agregar un tipo nuevo mañana no necesita otra migración.
--
-- Forma de cada elemento:  { "label": "...", "date": "YYYY-MM-DD", "action": "..." }
alter table doctors add column if not exists extra_creds jsonb not null default '[]'::jsonb;

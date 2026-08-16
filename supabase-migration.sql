-- Migración: campos de vencimiento de credenciales por doctor
-- Ejecuta esto UNA VEZ en Supabase → SQL Editor → New query → Run.
-- Es seguro: usa "if not exists", no borra ni cambia datos existentes.

alter table doctors add column if not exists license_exp date;            -- vencimiento de licencia FL
alter table doctors add column if not exists dea text;                    -- número DEA
alter table doctors add column if not exists dea_exp date;                -- vencimiento DEA
alter table doctors add column if not exists caqh_attested date;          -- fecha de última atestación CAQH (vence a los 120 días)
alter table doctors add column if not exists malpractice_exp date;        -- vencimiento de malpractice/COI
alter table doctors add column if not exists medicare_revalidation date;  -- fecha de revalidación de Medicare (cada 5 años)

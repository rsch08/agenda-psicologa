-- Agenda para Psicóloga — esquema MVP
-- Ejecutar en el SQL Editor de tu proyecto de Supabase.
--
-- A diferencia de otros proyectos, el navegador nunca habla directo con
-- estas tablas: todo pasa por las funciones serverless de /api usando la
-- service role key. Por eso RLS queda cerrado por completo (sin políticas
-- "for all using (true)") — solo la service role key (que ignora RLS) puede
-- leer/escribir.

create extension if not exists "pgcrypto";

-- Fila única de ajustes generales. El id boolean+check fuerza a que solo
-- pueda existir una fila (id siempre `true`).
create table if not exists settings (
  id boolean primary key default true,
  session_duration_minutes integer not null default 50,
  buffer_minutes integer not null default 10,
  timezone text not null default 'America/Bogota',
  min_notice_hours integer not null default 12,
  max_days_ahead integer not null default 14,
  psychologist_name text not null default '',
  updated_at timestamptz not null default now(),
  constraint settings_singleton check (id)
);

insert into settings (id) values (true) on conflict (id) do nothing;

create table if not exists availability_rules (
  id uuid primary key default gen_random_uuid(),
  weekday integer not null check (weekday between 0 and 6), -- 0=domingo..6=sábado
  start_time time not null,
  end_time time not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint availability_rules_valid_range check (start_time < end_time)
);

create index if not exists availability_rules_weekday_idx on availability_rules(weekday);

-- Fila única con las credenciales OAuth de la psicóloga.
create table if not exists google_tokens (
  id boolean primary key default true,
  access_token text,
  refresh_token text,
  scope text,
  token_type text,
  expiry_date bigint,
  connected_email text,
  calendar_id text not null default 'primary',
  updated_at timestamptz not null default now(),
  constraint google_tokens_singleton check (id)
);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  patient_name text not null,
  patient_email text not null,
  patient_phone text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  google_event_id text,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  constraint appointments_valid_range check (start_time < end_time)
);

create index if not exists appointments_start_time_idx on appointments(start_time);
create index if not exists appointments_status_idx on appointments(status);

-- RLS cerrado: sin políticas para 'anon'/'authenticated'. Solo la service
-- role key (usada del lado del servidor en /api) puede leer o escribir.
alter table settings enable row level security;
alter table availability_rules enable row level security;
alter table google_tokens enable row level security;
alter table appointments enable row level security;

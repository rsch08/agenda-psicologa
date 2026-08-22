-- Agenda para Psicóloga — esquema v2 (paquetes de horarios por paciente)
-- Ejecutar en el SQL Editor de tu proyecto de Supabase.
--
-- El navegador nunca habla directo con estas tablas: todo pasa por las
-- funciones serverless de /api usando la service role key. Por eso RLS
-- queda cerrado por completo — solo la service role key (que ignora RLS)
-- puede leer/escribir.

create extension if not exists "pgcrypto";

-- Fila única de ajustes generales.
create table if not exists settings (
  id boolean primary key default true,
  session_duration_minutes integer not null default 50,
  timezone text not null default 'America/Mexico_City',
  psychologist_name text not null default '',
  updated_at timestamptz not null default now(),
  constraint settings_singleton check (id)
);

insert into settings (id) values (true) on conflict (id) do nothing;

-- Fila única con las credenciales OAuth del calendario conectado.
-- Independiente de quién esté logueado como admin (ver ADMIN_EMAILS) —
-- solo se actualiza cuando alguien completa el flujo de "Conectar calendario".
create table if not exists google_tokens (
  id boolean primary key default true,
  access_token text,
  refresh_token text,
  scope text,
  token_type text,
  expiry_date bigint,
  connected_email text,
  calendar_id text not null default 'primary', -- dónde se crean los eventos al agendar
  busy_calendar_ids text[] not null default array['primary'], -- cuáles se revisan para "ocupado" en el widget
  updated_at timestamptz not null default now(),
  constraint google_tokens_singleton check (id)
);

-- Un "paquete" de horarios armado a mano para un paciente específico.
create table if not exists patient_links (
  id uuid primary key default gen_random_uuid(),
  patient_name text not null,
  token text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists patient_links_token_idx on patient_links(token);

-- Los horarios exactos que la psicóloga eligió a mano para ese paciente.
create table if not exists offered_slots (
  id uuid primary key default gen_random_uuid(),
  patient_link_id uuid not null references patient_links(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  created_at timestamptz not null default now(),
  constraint offered_slots_valid_range check (start_time < end_time)
);

create index if not exists offered_slots_patient_link_id_idx on offered_slots(patient_link_id);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  patient_link_id uuid not null references patient_links(id) on delete cascade,
  offered_slot_id uuid references offered_slots(id) on delete set null,
  patient_name text not null,
  patient_email text not null,
  patient_phone text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  google_event_id text,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  constraint appointments_valid_range check (start_time < end_time)
);

create index if not exists appointments_patient_link_id_idx on appointments(patient_link_id);

alter table settings enable row level security;
alter table google_tokens enable row level security;
alter table patient_links enable row level security;
alter table offered_slots enable row level security;
alter table appointments enable row level security;

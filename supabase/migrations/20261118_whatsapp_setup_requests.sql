-- Solicitudes de conexión asistida, aisladas por negocio.
-- El navegador nunca accede directamente a esta tabla; todas las operaciones
-- pasan por una ruta que comprueba la sesión y la membresía del negocio.
create table if not exists public.whatsapp_setup_requests (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  requested_by uuid not null references auth.users(id),
  contact_email text not null,
  contact_phone text not null,
  whatsapp_number text not null,
  note text not null default '',
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'ready')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists whatsapp_setup_requests_status_created_idx
  on public.whatsapp_setup_requests (status, created_at desc);

alter table public.whatsapp_setup_requests enable row level security;
revoke all on public.whatsapp_setup_requests from anon, authenticated;
grant select, insert, update on public.whatsapp_setup_requests to service_role;

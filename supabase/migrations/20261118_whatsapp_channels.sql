-- WhatsApp Cloud API pilot: routing is provisioned by an operator after number ownership is verified.
-- These tables are not exposed through the Supabase Data API; only server-side service role code uses them.
create table if not exists public.whatsapp_channels (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses(id) on delete cascade,
  phone_number_id text not null unique check (phone_number_id ~ '^[0-9]+$'),
  waba_id text check (waba_id is null or waba_id ~ '^[0-9]+$'),
  display_phone_number text,
  enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.whatsapp_webhook_events (
  wa_message_id text primary key,
  channel_id uuid not null references public.whatsapp_channels(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  status text not null default 'processing' check (status in ('processing', 'sent', 'failed')),
  outbound_message_id text,
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists whatsapp_webhook_events_business_created_idx
  on public.whatsapp_webhook_events (business_id, created_at desc);

alter table public.whatsapp_channels enable row level security;
alter table public.whatsapp_webhook_events enable row level security;

-- Deliberately no anon/authenticated policies: browser clients cannot list or modify
-- connected phone numbers or inbound message IDs. Server access requires the secret key.
revoke all on public.whatsapp_channels from anon, authenticated;
revoke all on public.whatsapp_webhook_events from anon, authenticated;

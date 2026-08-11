create extension if not exists "pgcrypto";

create table if not exists public.portfolio_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.portfolio_admins enable row level security;
drop policy if exists "Admins can see their own allowlist record" on public.portfolio_admins;
create policy "Admins can see their own allowlist record"
on public.portfolio_admins for select to authenticated
using (user_id = auth.uid());

create or replace function public.is_portfolio_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.portfolio_admins where user_id = auth.uid());
$$;

create or replace function public.is_portfolio_admin_mfa()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_portfolio_admin() and (auth.jwt() ->> 'aal') = 'aal2';
$$;

revoke all on function public.is_portfolio_admin() from public;
revoke all on function public.is_portfolio_admin_mfa() from public;
grant execute on function public.is_portfolio_admin() to authenticated;
grant execute on function public.is_portfolio_admin_mfa() to authenticated;

create table if not exists public.portfolio_items (
  id text primary key default gen_random_uuid()::text,
  owner_id uuid default auth.uid(),
  type text not null,
  title text not null,
  category text default '',
  subtitle text default '',
  description text default '',
  tags text[] default '{}',
  url text default '',
  image_url text default '',
  gallery_urls text[] default '{}',
  role text default '',
  stack_summary text default '',
  learnings text default '',
  next_steps text default '',
  challenge text default '',
  solution text default '',
  outcome text default '',
  publish_at timestamptz,
  sort_order integer default 0,
  featured boolean default false,
  published boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.portfolio_items add column if not exists image_url text default '';
alter table public.portfolio_items add column if not exists gallery_urls text[] default '{}';
alter table public.portfolio_items add column if not exists role text default '';
alter table public.portfolio_items add column if not exists stack_summary text default '';
alter table public.portfolio_items add column if not exists learnings text default '';
alter table public.portfolio_items add column if not exists next_steps text default '';
alter table public.portfolio_items add column if not exists challenge text default '';
alter table public.portfolio_items add column if not exists solution text default '';
alter table public.portfolio_items add column if not exists outcome text default '';
alter table public.portfolio_items add column if not exists publish_at timestamptz;
alter table public.portfolio_items drop constraint if exists portfolio_items_type_check;
alter table public.portfolio_items add constraint portfolio_items_type_check check (type in ('skill', 'project', 'certificate', 'experience'));
alter table public.portfolio_items enable row level security;

drop policy if exists "Published portfolio items are public" on public.portfolio_items;
create policy "Published portfolio items are public" on public.portfolio_items for select
using ((published = true and (publish_at is null or publish_at <= now())) or public.is_portfolio_admin_mfa());
drop policy if exists "Users can create own portfolio items" on public.portfolio_items;
drop policy if exists "Portfolio admins can create portfolio items" on public.portfolio_items;
create policy "Portfolio admins can create portfolio items" on public.portfolio_items for insert to authenticated
with check (public.is_portfolio_admin_mfa() and owner_id = auth.uid());
drop policy if exists "Users can update own portfolio items" on public.portfolio_items;
drop policy if exists "Portfolio admins can update portfolio items" on public.portfolio_items;
create policy "Portfolio admins can update portfolio items" on public.portfolio_items for update to authenticated
using (public.is_portfolio_admin_mfa()) with check (public.is_portfolio_admin_mfa());
drop policy if exists "Users can delete own portfolio items" on public.portfolio_items;
drop policy if exists "Portfolio admins can delete portfolio items" on public.portfolio_items;
create policy "Portfolio admins can delete portfolio items" on public.portfolio_items for delete to authenticated
using (public.is_portfolio_admin_mfa());

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 240),
  subject text default '' check (char_length(subject) <= 180),
  message text not null check (char_length(message) between 1 and 5000),
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at timestamptz not null default now()
);

alter table public.contact_messages drop constraint if exists contact_messages_email_format;
alter table public.contact_messages add constraint contact_messages_email_format check (email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$');
alter table public.contact_messages enable row level security;
drop policy if exists "Anyone can send a contact message" on public.contact_messages;
drop policy if exists "Authenticated users can read messages" on public.contact_messages;
drop policy if exists "Authenticated users can update messages" on public.contact_messages;
drop policy if exists "Authenticated users can delete messages" on public.contact_messages;
drop policy if exists "Portfolio admins can read messages" on public.contact_messages;
create policy "Portfolio admins can read messages" on public.contact_messages for select to authenticated using (public.is_portfolio_admin_mfa());
drop policy if exists "Portfolio admins can update messages" on public.contact_messages;
create policy "Portfolio admins can update messages" on public.contact_messages for update to authenticated using (public.is_portfolio_admin_mfa()) with check (public.is_portfolio_admin_mfa());
drop policy if exists "Portfolio admins can delete messages" on public.contact_messages;
create policy "Portfolio admins can delete messages" on public.contact_messages for delete to authenticated using (public.is_portfolio_admin_mfa());

create table if not exists public.contact_rate_limits (
  id uuid primary key default gen_random_uuid(),
  fingerprint text not null,
  created_at timestamptz not null default now()
);
create index if not exists contact_rate_limits_fingerprint_created_at_idx on public.contact_rate_limits (fingerprint, created_at desc);
alter table public.contact_rate_limits enable row level security;

create table if not exists public.portfolio_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  item_id text,
  item_title text,
  created_at timestamptz not null default now()
);
alter table public.portfolio_audit_log enable row level security;
drop policy if exists "Portfolio admins can read audit log" on public.portfolio_audit_log;
create policy "Portfolio admins can read audit log" on public.portfolio_audit_log for select to authenticated using (public.is_portfolio_admin_mfa());

create or replace function public.audit_portfolio_item_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.portfolio_audit_log (actor_id, action, item_id, item_title)
  values (auth.uid(), tg_op, coalesce(new.id, old.id), coalesce(new.title, old.title));
  return coalesce(new, old);
end;
$$;

drop trigger if exists portfolio_items_audit_log on public.portfolio_items;
create trigger portfolio_items_audit_log after insert or update or delete on public.portfolio_items
for each row execute function public.audit_portfolio_item_change();

create or replace function public.purge_expired_contact_messages()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare removed_count integer;
begin
  delete from public.contact_messages where created_at < now() - interval '90 days';
  get diagnostics removed_count = row_count;
  return removed_count;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio-media', 'portfolio-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Portfolio media is public" on storage.objects;
create policy "Portfolio media is public" on storage.objects for select using (bucket_id = 'portfolio-media');
drop policy if exists "Users can upload own portfolio media" on storage.objects;
drop policy if exists "Portfolio admins can upload media" on storage.objects;
create policy "Portfolio admins can upload media" on storage.objects for insert to authenticated
with check (bucket_id = 'portfolio-media' and public.is_portfolio_admin_mfa() and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users can update own portfolio media" on storage.objects;
drop policy if exists "Portfolio admins can update media" on storage.objects;
create policy "Portfolio admins can update media" on storage.objects for update to authenticated
using (bucket_id = 'portfolio-media' and public.is_portfolio_admin_mfa() and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'portfolio-media' and public.is_portfolio_admin_mfa() and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users can delete own portfolio media" on storage.objects;
drop policy if exists "Portfolio admins can delete media" on storage.objects;
create policy "Portfolio admins can delete media" on storage.objects for delete to authenticated
using (bucket_id = 'portfolio-media' and public.is_portfolio_admin_mfa() and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists portfolio_items_updated_at on public.portfolio_items;
create trigger portfolio_items_updated_at before update on public.portfolio_items
for each row execute function public.set_updated_at();

-- After creating your first Supabase Auth user, run this once with your own email:
-- insert into public.portfolio_admins (user_id)
-- select id from auth.users where email = 'your-admin-email@example.com';

create extension if not exists "pgcrypto";

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
alter table public.portfolio_items add column if not exists challenge text default '';
alter table public.portfolio_items add column if not exists solution text default '';
alter table public.portfolio_items add column if not exists outcome text default '';
alter table public.portfolio_items add column if not exists publish_at timestamptz;
alter table public.portfolio_items drop constraint if exists portfolio_items_type_check;
alter table public.portfolio_items add constraint portfolio_items_type_check check (type in ('skill', 'project', 'certificate', 'experience'));
alter table public.portfolio_items enable row level security;

drop policy if exists "Published portfolio items are public" on public.portfolio_items;
create policy "Published portfolio items are public" on public.portfolio_items for select
using ((published = true and (publish_at is null or publish_at <= now())) or auth.uid() = owner_id);

drop policy if exists "Users can create own portfolio items" on public.portfolio_items;
create policy "Users can create own portfolio items" on public.portfolio_items for insert to authenticated with check (auth.uid() = owner_id);
drop policy if exists "Users can update own portfolio items" on public.portfolio_items;
create policy "Users can update own portfolio items" on public.portfolio_items for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "Users can delete own portfolio items" on public.portfolio_items;
create policy "Users can delete own portfolio items" on public.portfolio_items for delete to authenticated using (auth.uid() = owner_id);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 240),
  subject text default '' check (char_length(subject) <= 180),
  message text not null check (char_length(message) between 1 and 5000),
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at timestamptz default now()
);

alter table public.contact_messages enable row level security;
drop policy if exists "Anyone can send a contact message" on public.contact_messages;
create policy "Anyone can send a contact message" on public.contact_messages for insert to anon, authenticated with check (true);
drop policy if exists "Authenticated users can read messages" on public.contact_messages;
create policy "Authenticated users can read messages" on public.contact_messages for select to authenticated using (true);
drop policy if exists "Authenticated users can update messages" on public.contact_messages;
create policy "Authenticated users can update messages" on public.contact_messages for update to authenticated using (true) with check (true);
drop policy if exists "Authenticated users can delete messages" on public.contact_messages;
create policy "Authenticated users can delete messages" on public.contact_messages for delete to authenticated using (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio-media', 'portfolio-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Portfolio media is public" on storage.objects;
create policy "Portfolio media is public" on storage.objects for select using (bucket_id = 'portfolio-media');
drop policy if exists "Users can upload own portfolio media" on storage.objects;
create policy "Users can upload own portfolio media" on storage.objects for insert to authenticated with check (bucket_id = 'portfolio-media' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users can update own portfolio media" on storage.objects;
create policy "Users can update own portfolio media" on storage.objects for update to authenticated using (bucket_id = 'portfolio-media' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users can delete own portfolio media" on storage.objects;
create policy "Users can delete own portfolio media" on storage.objects for delete to authenticated using (bucket_id = 'portfolio-media' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists portfolio_items_updated_at on public.portfolio_items;
create trigger portfolio_items_updated_at before update on public.portfolio_items for each row execute function public.set_updated_at();

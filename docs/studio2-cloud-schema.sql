-- SHOWSET Studio cloud-staging schema, for a dedicated SHOWSET Supabase project.
-- Not deployed. Run only after provisioning a separate SHOWSET project.
-- Invite owners through Supabase Auth dashboard; insert their IDs/roles manually.
-- Never run against Mahzya, Axle One, or any unrelated database.
create table if not exists public.showset_studio_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','editor','publisher')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.showset_studio_members enable row level security;
create policy "Members see their own role" on public.showset_studio_members
  for select to authenticated
  using (user_id = (select auth.uid()));

create table if not exists public.showset_studio_workspaces (
  id text primary key check (id = 'site'),
  revision bigint not null check (revision >= 1),
  document jsonb not null,
  updated_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now()
);
alter table public.showset_studio_workspaces enable row level security;
create policy "Active owners view site drafts" on public.showset_studio_workspaces
  for select to authenticated
  using (exists (select 1 from public.showset_studio_members m
    where m.user_id = (select auth.uid()) and m.active));
create policy "Active editors initialise drafts" on public.showset_studio_workspaces
  for insert to authenticated
  with check (updated_by = (select auth.uid()) and
    exists (select 1 from public.showset_studio_members m
      where m.user_id = (select auth.uid()) and m.active
        and m.role in ('owner','editor','publisher')));
create policy "Active editors save drafts" on public.showset_studio_workspaces
  for update to authenticated
  using (exists (select 1 from public.showset_studio_members m
    where m.user_id = (select auth.uid()) and m.active
      and m.role in ('owner','editor','publisher')))
  with check (updated_by = (select auth.uid()) and
    exists (select 1 from public.showset_studio_members m
      where m.user_id = (select auth.uid()) and m.active
        and m.role in ('owner','editor','publisher')));

create table if not exists public.showset_studio_releases (
  id bigint generated always as identity primary key,
  source_revision bigint not null,
  snapshot jsonb not null,
  published_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  constraint showset_studio_releases_unique_revision unique (source_revision)
);
alter table public.showset_studio_releases enable row level security;
create policy "Active owners review release history" on public.showset_studio_releases
  for select to authenticated
  using (exists (select 1 from public.showset_studio_members m
    where m.user_id = (select auth.uid()) and m.active));
create policy "Publishers record immutable releases" on public.showset_studio_releases
  for insert to authenticated
  with check (published_by = (select auth.uid()) and
    exists (select 1 from public.showset_studio_members m
      where m.user_id = (select auth.uid()) and m.active
        and m.role in ('owner','publisher')));
-- No UPDATE or DELETE policy on releases. Rollback creates a new release.

-- Server-side verification applies even if an authorised publisher uses
-- the REST insert endpoint directly rather than our approval UI.
create or replace function public.showset_studio_verify_release()
returns trigger language plpgsql security invoker
set search_path = public, pg_temp as $$
declare
  stored_revision bigint;
  stored_document jsonb;
begin
  select revision,document into stored_revision,stored_document
    from public.showset_studio_workspaces where id='site' for share;
  if not found or new.source_revision <> stored_revision or
      new.snapshot is distinct from stored_document then
    raise exception 'Release must match the current saved shared draft'
      using errcode = '40001';
  end if;
  return new;
end;
$$;
revoke all on function public.showset_studio_verify_release() from public,anon;
drop trigger if exists showset_studio_release_source on public.showset_studio_releases;
create trigger showset_studio_release_source
  before insert on public.showset_studio_releases
  for each row execute function public.showset_studio_verify_release();

-- Atomic approval checkpoint. Records the saved server-side document,
-- never an arbitrary client-provided snapshot. Immutable releases are
-- source artifacts; they do not automatically redeploy a static public site.
create or replace function public.showset_studio_publish(
  p_expected_revision bigint
) returns bigint language plpgsql security invoker
set search_path = public, pg_temp as $$
declare
  current_rev bigint;
  current_doc jsonb;
  next_id bigint;
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.showset_studio_members m
    where m.user_id = (select auth.uid()) and m.active
      and m.role in ('owner','publisher')
  ) then
    raise exception 'Publisher permission required' using errcode = '42501';
  end if;
  select revision, document into current_rev,current_doc
    from public.showset_studio_workspaces where id = 'site' for update;
  if not found or current_rev <> p_expected_revision then
    raise exception 'Draft changed; reload before approving'
      using errcode = '40001';
  end if;
  insert into public.showset_studio_releases
    (source_revision,snapshot,published_by)
    values (current_rev,current_doc,(select auth.uid()))
    returning id into next_id;
  return next_id;
end;
$$;
revoke all on function public.showset_studio_publish(bigint) from public,anon;
grant execute on function public.showset_studio_publish(bigint) to authenticated;

-- Explicit Data API grants: SQL grants and RLS are independent. Never
-- allow anonymous access to draft, membership or release records.
revoke all on public.showset_studio_members,
  public.showset_studio_workspaces,
  public.showset_studio_releases from anon;
grant select on public.showset_studio_members to authenticated;
grant select,insert,update on public.showset_studio_workspaces to authenticated;
grant select,insert on public.showset_studio_releases to authenticated;
grant usage,select on sequence public.showset_studio_releases_id_seq to authenticated;

-- A private Storage bucket named showset-studio-media must be created
-- using Supabase Storage API/Dashboard, not by editing storage metadata.
-- Membership is checked against owner-controlled rows (NOT user_metadata).
create policy "SHOWSET active members read originals" on storage.objects
  for select to authenticated
  using (bucket_id='showset-studio-media' and
    (storage.foldername(name))[1]='site' and
    exists(select 1 from public.showset_studio_members m
      where m.user_id=(select auth.uid()) and m.active));
create policy "SHOWSET editors upload new originals" on storage.objects
  for insert to authenticated
  with check (bucket_id='showset-studio-media' and
    (storage.foldername(name))[1]='site' and
    exists(select 1 from public.showset_studio_members m
      where m.user_id=(select auth.uid()) and m.active
        and m.role in ('owner','editor','publisher')));
-- Originals are immutable. No UPDATE/DELETE or upsert policy.
-- Provision private bucket mime limits (image/jpeg/png/webp/avif), <=15 MB.
-- Only owner-managed users may be added to showset_studio_members.

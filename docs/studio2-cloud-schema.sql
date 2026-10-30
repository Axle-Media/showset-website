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


-- Review requests snapshot the current persisted draft. Editors cannot edit
-- or delete a request after submission; a newer draft invalidates the request.
create table if not exists public.showset_studio_reviews (
  id bigint generated always as identity primary key,
  source_revision bigint not null unique check (source_revision >= 1),
  snapshot jsonb not null,
  note text not null default '' check (char_length(note) <= 1000),
  requested_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.showset_studio_reviews enable row level security;
create policy "Active members see release reviews" on public.showset_studio_reviews
  for select to authenticated using (exists (
    select 1 from public.showset_studio_members m
    where m.user_id = (select auth.uid()) and m.active
  ));
create policy "Active editors request reviews" on public.showset_studio_reviews
  for insert to authenticated with check (
    requested_by = (select auth.uid()) and
    exists (select 1 from public.showset_studio_members m
      where m.user_id = (select auth.uid()) and m.active
        and m.role in ('owner','editor','publisher'))
  );
-- Direct REST inserts are subject to exactly the same server-side snapshot
-- comparison as the request-review RPC. An editor cannot invent a snapshot.
create or replace function public.showset_studio_verify_review()
returns trigger language plpgsql security invoker
set search_path = public, pg_temp as $
declare
  current_revision bigint;
  current_document jsonb;
begin
  select revision,document into current_revision,current_document
    from public.showset_studio_workspaces where id='site' for share;
  if not found or new.source_revision <> current_revision or
      new.snapshot is distinct from current_document then
    raise exception 'Review must match the saved shared draft'
      using errcode = '40001';
  end if;
  return new;
end;
$;
revoke all on function public.showset_studio_verify_review() from public,anon;
drop trigger if exists showset_studio_review_source on public.showset_studio_reviews;
create trigger showset_studio_review_source
  before insert on public.showset_studio_reviews
  for each row execute function public.showset_studio_verify_review();

-- Snapshot capture is server-side. The client sends only revision and note.
create or replace function public.showset_studio_request_review(
  p_expected_revision bigint, p_note text
) returns bigint language plpgsql security invoker
set search_path = public, pg_temp as $
declare
  current_revision bigint;
  current_document jsonb;
  next_id bigint;
  review_revision bigint;
  review_doc jsonb;
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.showset_studio_members m
    where m.user_id = (select auth.uid()) and m.active
      and m.role in ('owner','editor','publisher')
  ) then
    raise exception 'Studio membership required' using errcode='42501';
  end if;
  if char_length(coalesce(p_note,'')) > 1000 then
    raise exception 'Review note exceeds 1000 characters' using errcode='22001';
  end if;
  select revision,document into current_revision,current_document
    from public.showset_studio_workspaces where id='site' for share;
  if not found or current_revision <> p_expected_revision then
    raise exception 'Draft changed; save and retry the review'
      using errcode='40001';
  end if;
  insert into public.showset_studio_reviews
    (source_revision,snapshot,note,requested_by)
    values(current_revision,current_document,coalesce(p_note,''),(select auth.uid()))
    returning id into next_id;
  return next_id;
end;
$;
revoke all on function public.showset_studio_request_review(bigint,text) from public,anon;
grant execute on function public.showset_studio_request_review(bigint,text) to authenticated;

create table if not exists public.showset_studio_releases (
  id bigint generated always as identity primary key,
  source_revision bigint not null,
  snapshot jsonb not null,
  published_by uuid not null references auth.users(id),
  review_id bigint unique references public.showset_studio_reviews(id),
  restored_from bigint references public.showset_studio_releases(id),
  constraint showset_release_purpose check (
    (review_id is not null and restored_from is null) or
    (review_id is null and restored_from is not null)
  ),
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
  reviewed_revision bigint;
  reviewed_document jsonb;
  older_document jsonb;
begin
  select revision,document into stored_revision,stored_document
    from public.showset_studio_workspaces where id='site' for share;
  if not found or new.source_revision <> stored_revision or
      new.snapshot is distinct from stored_document then
    raise exception 'Release must match the current saved shared draft'
      using errcode = '40001';
  end if;
  if new.review_id is not null and new.restored_from is null then
    select source_revision,snapshot into reviewed_revision,reviewed_document
      from public.showset_studio_reviews where id=new.review_id;
    if not found or reviewed_revision <> stored_revision or
        reviewed_document is distinct from stored_document then
      raise exception 'Review request is stale or does not match the saved draft'
        using errcode='40001';
    end if;
  elsif new.restored_from is not null and new.review_id is null then
    select snapshot into older_document from public.showset_studio_releases
      where id=new.restored_from;
    if not found or
        (older_document - 'revision' - 'updatedAt') is distinct from
        (new.snapshot - 'revision' - 'updatedAt') then
      raise exception 'Rollback must copy a previously approved release'
        using errcode='40001';
    end if;
  else
    raise exception 'Release requires an approved review or rollback source'
      using errcode='23514';
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
  p_expected_revision bigint, p_review_id bigint
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
  select source_revision,snapshot into review_revision,review_doc
    from public.showset_studio_reviews where id=p_review_id;
  if not found or review_revision <> current_rev or
      review_doc is distinct from current_doc then
    raise exception 'Review request is stale or absent'
      using errcode='40001';
  end if;
  insert into public.showset_studio_releases
    (source_revision,snapshot,published_by,review_id)
    values (current_rev,current_doc,(select auth.uid()),p_review_id)
    returning id into next_id;
  return next_id;
end;
$$;
revoke all on function public.showset_studio_publish(bigint,bigint) from public,anon;
grant execute on function public.showset_studio_publish(bigint,bigint) to authenticated;


-- A rollback is a new immutable release checkpoint, not destructive history
-- rewriting. It only proceeds if the working draft exactly matches the latest
-- approved release, preventing loss of unreviewed, in-progress owner edits.
-- The caller supplies both expected draft revision and current release id.
create or replace function public.showset_studio_rollback(
  p_source_release_id bigint, p_expected_revision bigint,
  p_expected_latest_release_id bigint
) returns bigint language plpgsql security invoker
set search_path = public, pg_temp as $
declare
  current_rev bigint;
  current_doc jsonb;
  latest_id bigint;
  latest_revision bigint;
  latest_doc jsonb;
  source_doc jsonb;
  restored_doc jsonb;
  next_id bigint;
  next_time text;
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.showset_studio_members m
    where m.user_id = (select auth.uid()) and m.active
      and m.role in ('owner','publisher')
  ) then
    raise exception 'Publisher permission required' using errcode='42501';
  end if;
  select revision,document into current_rev,current_doc
    from public.showset_studio_workspaces where id='site' for update;
  if not found or current_rev <> p_expected_revision then
    raise exception 'Draft changed; export unsaved work and retry'
      using errcode='40001';
  end if;
  select id,source_revision,snapshot into latest_id,latest_revision,latest_doc
    from public.showset_studio_releases order by id desc limit 1;
  if not found or latest_id <> p_expected_latest_release_id or
      latest_revision <> current_rev or latest_doc is distinct from current_doc then
    raise exception 'Rollback blocked: current draft differs from latest release'
      using errcode='40001';
  end if;
  if p_source_release_id = latest_id then
    raise exception 'Selected release is already current' using errcode='22023';
  end if;
  select snapshot into source_doc from public.showset_studio_releases
    where id=p_source_release_id;
  if not found then
    raise exception 'Unknown approved release' using errcode='22023';
  end if;
  next_time=to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  restored_doc=jsonb_set(
    jsonb_set(source_doc,'{revision}',to_jsonb(current_rev+1),true),
    '{updatedAt}',to_jsonb(next_time),true
  );
  update public.showset_studio_workspaces
    set revision=current_rev+1,document=restored_doc,
        updated_by=(select auth.uid()),updated_at=now()
    where id='site' and revision=current_rev;
  insert into public.showset_studio_releases
    (source_revision,snapshot,published_by,restored_from)
    values(current_rev+1,restored_doc,(select auth.uid()),p_source_release_id)
    returning id into next_id;
  return next_id;
end;
$;
revoke all on function public.showset_studio_rollback(bigint,bigint,bigint) from public,anon;
grant execute on function public.showset_studio_rollback(bigint,bigint,bigint) to authenticated;

-- Explicit Data API grants: SQL grants and RLS are independent. Never
-- allow anonymous access to draft, membership or release records.
revoke all on public.showset_studio_members,
  public.showset_studio_workspaces,
  public.showset_studio_reviews,
  public.showset_studio_releases from anon,authenticated;
grant select on public.showset_studio_members to authenticated;
grant select,insert,update on public.showset_studio_workspaces to authenticated;
grant select,insert on public.showset_studio_releases to authenticated;
grant select,insert on public.showset_studio_reviews to authenticated;
grant usage,select on sequence public.showset_studio_reviews_id_seq to authenticated;
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
-- Provision private bucket MIME limits (image/jpeg,png,webp), <=8 MB.
-- Only owner-managed users may be added to showset_studio_members.

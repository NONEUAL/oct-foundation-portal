-- OCT Foundation Week: admin role, bracket maker, winner declaration, fan picks.
-- The base schema was inferred from the app code (editions, events, matches,
-- departments, moderators, predictions, score_updates). Review column names
-- against your live database before running.

-- ---------------------------------------------------------------- admins
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

drop policy if exists "admins read self" on public.admins;
create policy "admins read self" on public.admins
  for select using (user_id = auth.uid() or public.is_admin());

-- ------------------------------------------------------------ moderators
alter table public.moderators
  add column if not exists can_declare_winners boolean not null default false,
  add column if not exists email text;

create table if not exists public.moderator_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  department_id uuid not null references public.departments(id),
  can_declare_winners boolean not null default true,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists moderator_invites_open_email
  on public.moderator_invites (lower(email)) where claimed_at is null;
alter table public.moderator_invites enable row level security;
drop policy if exists "admin manages invites" on public.moderator_invites;
create policy "admin manages invites" on public.moderator_invites
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin manages moderators" on public.moderators;
create policy "admin manages moderators" on public.moderators
  for all using (public.is_admin()) with check (public.is_admin());

-- Called after login: turns an open invite for the signed-in email into a moderator row.
create or replace function public.claim_moderator_invite()
returns void language plpgsql security definer set search_path = public as $$
declare inv public.moderator_invites; ed uuid;
begin
  select * into inv from public.moderator_invites
   where lower(email) = lower(auth.jwt() ->> 'email') and claimed_at is null
   limit 1;
  if not found then return; end if;
  select id into ed from public.editions where is_active limit 1;
  if exists (select 1 from public.moderators
              where user_id = auth.uid() and department_id = inv.department_id and edition_id = ed) then
    update public.moderators set can_declare_winners = inv.can_declare_winners
     where user_id = auth.uid() and department_id = inv.department_id and edition_id = ed;
  else
    insert into public.moderators (user_id, department_id, edition_id, can_declare_winners, email)
    values (auth.uid(), inv.department_id, ed, inv.can_declare_winners, inv.email);
  end if;
  update public.moderator_invites set claimed_at = now() where id = inv.id;
end $$;

-- ---------------------------------------------------------------- matches
alter table public.matches
  add column if not exists round integer,
  add column if not exists bracket_position integer,
  add column if not exists next_match_id uuid references public.matches(id),
  add column if not exists next_slot text check (next_slot in ('a','b')),
  add column if not exists best_of integer not null default 3,
  add column if not exists winner_department_id uuid references public.departments(id);

-- ------------------------------------------------------------- fan picks
create table if not exists public.fan_picks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  match_id uuid references public.matches(id) on delete cascade,
  department_id uuid not null references public.departments(id),
  fingerprint text not null,
  created_at timestamptz not null default now()
);
create unique index if not exists fan_picks_one_per_match
  on public.fan_picks (fingerprint, match_id) where match_id is not null;
create unique index if not exists fan_picks_one_per_event
  on public.fan_picks (fingerprint, event_id) where match_id is null;
alter table public.fan_picks enable row level security;
-- no direct policies: writes go through submit_fan_pick, reads through the view.

create or replace view public.fan_pick_counts as
  select event_id, match_id, department_id, count(*)::int as picks
  from public.fan_picks group by event_id, match_id, department_id;
grant select on public.fan_pick_counts to anon, authenticated;

create or replace function public.submit_fan_pick(
  p_event_id uuid, p_match_id uuid, p_department_id uuid, p_fingerprint text)
returns void language plpgsql security definer set search_path = public as $$
declare m public.matches;
begin
  if coalesce(length(p_fingerprint), 0) < 4 then raise exception 'bad fingerprint'; end if;
  if p_match_id is not null then
    select * into m from public.matches where id = p_match_id and event_id = p_event_id;
    if not found then raise exception 'unknown match'; end if;
    if m.winner_department_id is not null or m.status in ('live','completed')
       or exists (select 1 from public.events e where e.id = m.event_id and e.start_time <= now()) then
      raise exception 'picks are closed for this match';
    end if;
    if p_department_id not in (m.department_a_id, m.department_b_id) then
      raise exception 'department is not in this match';
    end if;
    insert into public.fan_picks (event_id, match_id, department_id, fingerprint)
    values (p_event_id, p_match_id, p_department_id, p_fingerprint)
    on conflict (fingerprint, match_id) where match_id is not null
    do update set department_id = excluded.department_id;
  else
    if exists (select 1 from public.matches where event_id = p_event_id and winner_department_id is not null
               and next_match_id is null) then
      raise exception 'picks are closed for this event';
    end if;
    insert into public.fan_picks (event_id, match_id, department_id, fingerprint)
    values (p_event_id, null, p_department_id, p_fingerprint)
    on conflict (fingerprint, event_id) where match_id is null
    do update set department_id = excluded.department_id;
  end if;
end $$;
grant execute on function public.submit_fan_pick(uuid, uuid, uuid, text) to anon, authenticated;

-- ---------------------------------------------------------- bracket maker
create or replace function public.create_bracket(
  p_event_id uuid, p_team_ids uuid[], p_best_of integer default 3)
returns void language plpgsql security definer set search_path = public as $$
declare
  n int := coalesce(array_length(p_team_ids, 1), 0);
  rounds int; r int; i int; cnt int;
  ids uuid[]; prev uuid[] := '{}'; cur uuid[];
  mid uuid;
begin
  if not public.is_admin() then raise exception 'admin only' using errcode = '42501'; end if;
  if n < 2 or (n & (n - 1)) <> 0 then
    raise exception 'team count must be a power of two (2, 4, 8, 16)';
  end if;
  if exists (select 1 from public.matches where event_id = p_event_id and status = 'completed') then
    raise exception 'bracket already has results';
  end if;
  delete from public.matches where event_id = p_event_id;

  rounds := log(2, n)::int;
  -- round 1: seed 1 vs last, 2 vs second last, ...
  cur := '{}';
  for i in 1 .. n / 2 loop
    insert into public.matches (event_id, round, bracket_position, department_a_id,
                                department_b_id, best_of)
    values (p_event_id, 1, i, p_team_ids[i], p_team_ids[n + 1 - i], p_best_of)
    returning id into mid;
    cur := cur || mid;
  end loop;
  prev := cur;
  for r in 2 .. rounds loop
    cnt := array_length(prev, 1) / 2;
    cur := '{}';
    for i in 1 .. cnt loop
      insert into public.matches (event_id, round, bracket_position, best_of)
      values (p_event_id, r, i, p_best_of) returning id into mid;
      cur := cur || mid;
      update public.matches set next_match_id = mid, next_slot = 'a' where id = prev[2 * i - 1];
      update public.matches set next_match_id = mid, next_slot = 'b' where id = prev[2 * i];
    end loop;
    prev := cur;
  end loop;
end $$;
grant execute on function public.create_bracket(uuid, uuid[], integer) to authenticated;

-- -------------------------------------------------------- declare winners
create or replace function public.declare_winner(p_match_id uuid, p_winner_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare m public.matches; nxt public.matches; allowed boolean;
begin
  select * into m from public.matches where id = p_match_id for update;
  if not found then raise exception 'unknown match'; end if;
  if p_winner_id not in (m.department_a_id, m.department_b_id) then
    raise exception 'winner must be one of the two teams';
  end if;

  allowed := public.is_admin() or exists (
    select 1 from public.moderators mo
     where mo.user_id = auth.uid() and mo.can_declare_winners
       and mo.department_id in (m.department_a_id, m.department_b_id));
  if not allowed then raise exception 'not allowed to declare this winner' using errcode = '42501'; end if;

  if m.next_match_id is not null then
    select * into nxt from public.matches where id = m.next_match_id for update;
    if nxt.winner_department_id is not null then
      raise exception 'the next round already has a result; undo that first';
    end if;
    if m.next_slot = 'a' then
      update public.matches set department_a_id = p_winner_id where id = nxt.id;
    else
      update public.matches set department_b_id = p_winner_id where id = nxt.id;
    end if;
  end if;
  update public.matches set winner_department_id = p_winner_id, status = 'completed' where id = p_match_id;
end $$;
grant execute on function public.declare_winner(uuid, uuid) to authenticated;

-- Admin only: undo a declared winner (blocked once the next round has a result).
create or replace function public.undo_winner(p_match_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare m public.matches; nxt public.matches;
begin
  if not public.is_admin() then raise exception 'admin only' using errcode = '42501'; end if;
  select * into m from public.matches where id = p_match_id for update;
  if m.next_match_id is not null then
    select * into nxt from public.matches where id = m.next_match_id for update;
    if nxt.winner_department_id is not null then raise exception 'the next round already has a result'; end if;
    if m.next_slot = 'a' then update public.matches set department_a_id = null where id = nxt.id;
    else update public.matches set department_b_id = null where id = nxt.id; end if;
  end if;
  update public.matches set winner_department_id = null, status = 'scheduled' where id = p_match_id;
end $$;
grant execute on function public.undo_winner(uuid) to authenticated;

-- First admin (run once, with your own email, after you have signed in once):
-- insert into public.admins (user_id, email)
-- select id, email from auth.users where email = 'you@example.com';

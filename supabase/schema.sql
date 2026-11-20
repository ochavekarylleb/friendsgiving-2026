begin;
create schema friendsgiving_private;
revoke all on schema friendsgiving_private from public;
grant usage on schema friendsgiving_private to anon, authenticated;

create table public.friendsgiving_responses (
  id uuid primary key,
  name text not null check (char_length(name) between 2 and 50),
  normalized_name text generated always as (lower(name)) stored unique,
  color text not null unique,
  days integer[] not null check (cardinality(days) between 1 and 15 and days <@ array[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]),
  food text not null check (food in ('Italian','Mexican','Filipino','Japanese')),
  drink text not null check (drink in ('Mocktails','Matcha & Coffee','Wine')),
  dress text not null check (dress in ('Pajamas','Color Coded','Costumes')),
  contribution text not null check (char_length(contribution) <= 600),
  location text not null check (location in ('Kai’s Place','Hotel','My House')),
  revision integer not null default 1
);
alter table public.friendsgiving_responses enable row level security;
revoke all on public.friendsgiving_responses from public, anon, authenticated;
grant select on public.friendsgiving_responses to anon, authenticated;
create policy friendsgiving_public_results on public.friendsgiving_responses for select to anon, authenticated using (true);
alter publication supabase_realtime add table public.friendsgiving_responses;

create table friendsgiving_private.edit_keys (
  id uuid primary key references public.friendsgiving_responses on delete cascade,
  digest bytea not null
);
alter table friendsgiving_private.edit_keys enable row level security;
revoke all on friendsgiving_private.edit_keys from public, anon, authenticated;
create sequence friendsgiving_private.colors minvalue 0 start 0;

-- The browser generates the bearer token. Only its hash is stored in the private schema.
create function friendsgiving_private.save(
  p_id uuid, p_token text, p_revision integer, p_name text, p_days integer[],
  p_food text, p_drink text, p_dress text, p_contribution text, p_location text
) returns public.friendsgiving_responses
language plpgsql security definer set search_path = '' as $$
declare
  response public.friendsgiving_responses;
  token_digest bytea;
  color_index bigint;
  palette text[] := array['#E8B4AF','#B9C8A5','#E9CB91','#B9AEDC','#93C9CA','#E5A67F','#E4A7C7','#B4C7EC','#E8D6BA','#C7A4A1','#DAD99F','#A8D2BF'];
begin
  if p_id is null or p_revision is null or p_revision < 0 or p_token is null or p_token !~ '^[0-9a-f]{64}$' then
    raise exception 'This edit link is invalid.';
  end if;
  token_digest := pg_catalog.sha256(pg_catalog.convert_to(p_token, 'UTF8'));
  p_name := nullif(btrim(regexp_replace(p_name, '[[:space:]]+', ' ', 'g')), '');
  p_days := array(select distinct day from unnest(p_days) as selected(day) order by day);

  if p_revision = 0 then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(p_id::text)::bigint);
    select * into response from public.friendsgiving_responses where id = p_id;
    if found then
      if exists (select 1 from friendsgiving_private.edit_keys where id = p_id and digest = token_digest) then
        return response;
      end if;
      raise exception 'This edit link is invalid.';
    end if;
    color_index := nextval('friendsgiving_private.colors');
    insert into public.friendsgiving_responses (id,name,color,days,food,drink,dress,contribution,location)
    values (p_id,p_name,coalesce(palette[color_index + 1], format('hsl(%s 55%% 72%%)', round(mod(color_index * 137.507764::numeric, 360), 6))),p_days,p_food,p_drink,p_dress,btrim(coalesce(p_contribution,'')),p_location)
    returning * into response;
    insert into friendsgiving_private.edit_keys values (p_id,token_digest);
  else
    if not exists (select 1 from friendsgiving_private.edit_keys where id = p_id and digest = token_digest) then
      raise exception 'This edit link is invalid.';
    end if;
    update public.friendsgiving_responses
    set name = p_name, days = p_days, food = p_food, drink = p_drink, dress = p_dress,
        contribution = btrim(coalesce(p_contribution,'')), location = p_location, revision = revision + 1
    where id = p_id and revision = p_revision
    returning * into response;
    if not found then
      raise exception 'Your answers changed since you opened the form. Open your edit link again to load the latest version.';
    end if;
  end if;
  return response;
exception when unique_violation then
  raise exception 'That name already has an RSVP. Use your private edit link or include your surname if you are a different guest.';
end;
$$;
revoke all on function friendsgiving_private.save(uuid,text,integer,text,integer[],text,text,text,text,text) from public;

create function public.save_friendsgiving_rsvp(
  p_id uuid, p_token text, p_revision integer, p_name text, p_days integer[],
  p_food text, p_drink text, p_dress text, p_contribution text, p_location text
) returns public.friendsgiving_responses
language sql security invoker set search_path = '' as $$
  select friendsgiving_private.save(p_id,p_token,p_revision,p_name,p_days,p_food,p_drink,p_dress,p_contribution,p_location);
$$;
revoke all on function public.save_friendsgiving_rsvp(uuid,text,integer,text,integer[],text,text,text,text,text) from public;
grant execute on function friendsgiving_private.save(uuid,text,integer,text,integer[],text,text,text,text,text) to anon, authenticated;
grant execute on function public.save_friendsgiving_rsvp(uuid,text,integer,text,integer[],text,text,text,text,text) to anon, authenticated;
commit;

-- Execute in the dedicated Supabase project. No passwords or service keys.
create table if not exists public.study_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 1000000),
  revision bigint not null check (revision > 0 and revision < 9007199254740991),
  updated_at timestamptz not null default now()
);
alter table public.study_states enable row level security;
revoke all on public.study_states from anon, authenticated;
grant select on public.study_states to authenticated;
drop policy if exists study_owner_read on public.study_states;
create policy study_owner_read on public.study_states for select to authenticated using ((select auth.uid()) = user_id);

-- Atomic compare-and-swap: a stale device cannot overwrite a newer revision.
create or replace function public.save_study_state(input_state jsonb, expected_revision bigint)
returns table (revision bigint)
language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := auth.uid(); saved_revision bigint;
begin
  if owner_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if expected_revision is null or expected_revision < 0 or expected_revision >= 9007199254740990
     or input_state is null or jsonb_typeof(input_state) <> 'object'
     or octet_length(input_state::text) > 1000000
     or jsonb_typeof(input_state->'records') is distinct from 'array'
     or jsonb_typeof(input_state->'projects') is distinct from 'array'
     or jsonb_typeof(input_state->'equipment') is distinct from 'string'
     or jsonb_typeof(input_state->'week') is distinct from 'number'
     then raise exception 'Invalid state' using errcode = '22023'; end if;
  if jsonb_array_length(input_state->'records') > 1000 or jsonb_array_length(input_state->'projects') > 100
     or (input_state->>'week')::numeric not between 1 and 24
     or (input_state->>'week')::numeric <> trunc((input_state->>'week')::numeric)
     then raise exception 'Invalid state' using errcode = '22023'; end if;
  if expected_revision = 0 then
    insert into public.study_states (user_id, data, revision) values (owner_id, input_state, 1)
      on conflict (user_id) do nothing returning study_states.revision into saved_revision;
  else
    update public.study_states set data = input_state, revision = study_states.revision + 1, updated_at = now()
      where user_id = owner_id and study_states.revision = expected_revision
      returning study_states.revision into saved_revision;
  end if;
  if saved_revision is null then raise exception 'Revision conflict' using errcode = '40001'; end if;
  return query select saved_revision;
end;
$$;
revoke all on function public.save_study_state(jsonb, bigint) from public, anon;
grant execute on function public.save_study_state(jsonb, bigint) to authenticated;

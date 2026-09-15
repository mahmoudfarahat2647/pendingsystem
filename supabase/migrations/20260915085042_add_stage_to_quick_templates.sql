-- Fix #216: scope "note" category quick templates per workflow stage/tab.
-- reminder/reason categories stay global (stage IS NULL) - unaffected.
--
-- DEPLOYMENT ORDER: this migration must be applied to the live database
-- BEFORE the application code in this PR is deployed. quickTemplatesRepository.ts
-- selects/filters on the new `stage` column unconditionally, so running that
-- code against a database that hasn't run this migration yet fails every
-- quick-template request (Notes, Reminder, and both Archive/Freeze reason
-- modals) with a missing-column error. This exact migration-lag failure mode
-- has already happened twice for this table's siblings (see #200, #202 in
-- CLAUDE.md) - do not repeat it here.
--
-- Confirmed against the live project (2026-09-15): the existing uniqueness
-- rule is the bare, case-insensitive functional index
--   CREATE UNIQUE INDEX quick_templates_category_text_uniq
--     ON public.quick_templates USING btree (category, lower(text))
-- - not a plain (category, text) index, and not a table constraint (only a
-- PRIMARY KEY and the category-enum CHECK are registered in pg_constraint).
-- The detection below still checks both the plain and the lower(text) shapes
-- (and both constraint- and bare-index-backed forms) rather than hardcoding
-- this one index's name, since this table's schema has already drifted from
-- what was assumed once. The replacement indexes below keep the same
-- case-insensitive comparison so dedup behavior for reminder/reason is
-- unchanged, just newly scoped by stage for note.

alter table public.quick_templates
  add column if not exists stage public.order_stage;

-- Drop the existing (category, text)-based uniqueness rule, in whichever
-- form it actually takes, BEFORE the backfill below: with the old rule still
-- in place, cloning a note template into five more stages would insert rows
-- that collide with it immediately (same category, same text, only stage
-- differs - and the old rule doesn't know about stage).
do $$
declare
  target_index_name text;
  target_index_oid oid;
  backing_constraint text;
begin
  -- pg_get_indexdef(indexrelid, N, true) returns each key's plain column
  -- name OR its expression text (e.g. "lower(text)") - unlike a join through
  -- pg_attribute (which only resolves plain columns and misses expression
  -- keys entirely), this correctly identifies a functional index too.
  select cls.relname, idx.indexrelid
  into target_index_name, target_index_oid
  from pg_index idx
  join pg_class cls on cls.oid = idx.indexrelid
  join pg_class tbl on tbl.oid = idx.indrelid
  join pg_namespace nsp on nsp.oid = tbl.relnamespace
  where nsp.nspname = 'public'
    and tbl.relname = 'quick_templates'
    and idx.indisunique
    and not idx.indisprimary
    and (
      (
        select array_agg(pg_get_indexdef(idx.indexrelid, gs, true) order by gs)
        from generate_series(1, idx.indnkeyatts) as gs
      ) = array['category', 'text']
      or (
        select array_agg(pg_get_indexdef(idx.indexrelid, gs, true) order by gs)
        from generate_series(1, idx.indnkeyatts) as gs
      ) = array['category', 'lower(text)']
    )
  limit 1;

  if target_index_oid is not null then
    select con.conname
    into backing_constraint
    from pg_constraint con
    where con.conindid = target_index_oid and con.contype = 'u';

    if backing_constraint is not null then
      execute format(
        'alter table public.quick_templates drop constraint %I',
        backing_constraint
      );
    else
      execute format('drop index public.%I', target_index_name);
    end if;
  end if;
end $$;

-- Backfill: existing note-category rows have no stage provenance, so they
-- cannot be attributed to a single "real" originating tab. To avoid losing
-- any existing template, each existing note row is assigned to 'orders' and
-- then cloned once per remaining stage, so every tab starts with what used
-- to be shared and can diverge independently from this point on. Safe now
-- that the old uniqueness rule is gone.
update public.quick_templates
set stage = 'orders'
where category = 'note' and stage is null;

insert into public.quick_templates (category, text, sort_order, stage)
select qt.category, qt.text, qt.sort_order, s.stage
from public.quick_templates qt
cross join (
  values
    ('main'::public.order_stage),
    ('call'::public.order_stage),
    ('booking'::public.order_stage),
    ('archive'::public.order_stage),
    ('freeze'::public.order_stage)
) as s(stage)
where qt.category = 'note' and qt.stage = 'orders';

-- Enforce the category/stage invariant at the DB layer (mirrors the API-level
-- QuickTemplateScopeSchema rule): note rows must carry a stage, every other
-- category must not. Added after the backfill above so every existing row
-- already satisfies it.
alter table public.quick_templates
  add constraint quick_templates_category_stage_invariant
  check (
    (category = 'note' and stage is not null)
    or (category <> 'note' and stage is null)
  );

-- Replacement dedup rule, keeping the prior case-insensitive comparison:
-- reminder/reason (stage IS NULL) keep their previous global uniqueness;
-- note templates (stage IS NOT NULL) are unique per stage.
create unique index if not exists quick_templates_category_text_global_uniq
  on public.quick_templates (category, lower(text))
  where stage is null;

create unique index if not exists quick_templates_category_stage_text_uniq
  on public.quick_templates (category, stage, lower(text))
  where stage is not null;

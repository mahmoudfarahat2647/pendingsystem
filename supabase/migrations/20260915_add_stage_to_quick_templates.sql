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

alter table public.quick_templates
  add column if not exists stage public.order_stage;

-- Drop whatever form the existing (category, text) uniqueness rule takes -
-- this table was created directly in Supabase outside tracked migrations, so
-- it may be a real table constraint (visible in pg_constraint) or a bare
-- unique index never registered as a constraint. This MUST happen before the
-- backfill below: with the old (category, text)-only rule still in place,
-- cloning a note template into five more stages would insert rows with the
-- same (category, text) as the original and violate it immediately.
do $$
declare
  existing_constraint text;
  existing_index text;
begin
  -- Match only a unique constraint whose columns are exactly
  -- {category, text} - not merely "any unique constraint on this table" -
  -- so an unrelated unique constraint (if one exists on this hand-created
  -- table) is never dropped by mistake.
  select con.conname
  into existing_constraint
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'quick_templates'
    and con.contype = 'u'
    and (
      select array_agg(att.attname order by att.attname)
      from unnest(con.conkey) as k(attnum)
      join pg_attribute att
        on att.attrelid = con.conrelid and att.attnum = k.attnum
    ) = array['category', 'text']::name[]
  limit 1;

  if existing_constraint is not null then
    execute format(
      'alter table public.quick_templates drop constraint %I',
      existing_constraint
    );
  end if;

  -- Same precise column-set match for a bare unique index never registered
  -- as a table constraint, excluding any index that already backs a
  -- constraint (already handled, or already dropped, above).
  select cls.relname
  into existing_index
  from pg_index idx
  join pg_class cls on cls.oid = idx.indexrelid
  join pg_class tbl on tbl.oid = idx.indrelid
  join pg_namespace nsp on nsp.oid = tbl.relnamespace
  where nsp.nspname = 'public'
    and tbl.relname = 'quick_templates'
    and idx.indisunique
    and not idx.indisprimary
    and idx.indexrelid not in (
      select conindid from pg_constraint where contype in ('u', 'p')
    )
    and (
      select array_agg(att.attname order by att.attname)
      from unnest(idx.indkey) as k(attnum)
      join pg_attribute att
        on att.attrelid = idx.indrelid and att.attnum = k.attnum
    ) = array['category', 'text']::name[]
  limit 1;

  if existing_index is not null then
    execute format('drop index if exists public.%I', existing_index);
  end if;
end $$;

-- Backfill: existing note-category rows have no stage provenance, so they
-- cannot be attributed to a single "real" originating tab. To avoid losing
-- any existing template, each existing note row is assigned to 'orders' and
-- then cloned once per remaining stage, so every tab starts with what used
-- to be shared and can diverge independently from this point on. Safe now
-- that the old (category, text)-only uniqueness rule is gone.
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

-- Replacement dedup rule: reminder/reason (stage IS NULL) keep their previous
-- global uniqueness; note templates (stage IS NOT NULL) are unique per stage.
create unique index if not exists quick_templates_category_text_global_uniq
  on public.quick_templates (category, text)
  where stage is null;

create unique index if not exists quick_templates_category_stage_text_uniq
  on public.quick_templates (category, stage, text)
  where stage is not null;

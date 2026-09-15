-- Fix #216: scope "note" category quick templates per workflow stage/tab.
-- reminder/reason categories stay global (stage IS NULL) - unaffected.

alter table public.quick_templates
  add column if not exists stage public.order_stage;

-- Backfill: existing note-category rows have no stage provenance, so they
-- cannot be attributed to a single "real" originating tab. To avoid losing
-- any existing template, each existing note row is assigned to 'orders' and
-- then cloned once per remaining stage, so every tab starts with what used
-- to be shared and can diverge independently from this point on.
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
-- category must not.
alter table public.quick_templates
  add constraint quick_templates_category_stage_invariant
  check (
    (category = 'note' and stage is not null)
    or (category <> 'note' and stage is null)
  );

-- Drop whatever form the existing (category, text) uniqueness rule takes -
-- this table was created directly in Supabase outside tracked migrations, so
-- it may be a real table constraint (visible in pg_constraint) or a bare
-- unique index never registered as a constraint. Check both and drop
-- whichever is actually present before adding the stage-aware replacements.
do $$
declare
  existing_constraint text;
  existing_index text;
begin
  select con.conname
  into existing_constraint
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'quick_templates'
    and con.contype = 'u'
  limit 1;

  if existing_constraint is not null then
    execute format(
      'alter table public.quick_templates drop constraint %I',
      existing_constraint
    );
  end if;

  select indexname
  into existing_index
  from pg_indexes
  where schemaname = 'public'
    and tablename = 'quick_templates'
    and indexdef ilike '%unique%'
    and indexdef ilike '%category%'
    and indexdef ilike '%text%'
  limit 1;

  if existing_index is not null then
    execute format('drop index if exists public.%I', existing_index);
  end if;
end $$;

-- Replacement dedup rule: reminder/reason (stage IS NULL) keep their previous
-- global uniqueness; note templates (stage IS NOT NULL) are unique per stage.
create unique index if not exists quick_templates_category_text_global_uniq
  on public.quick_templates (category, text)
  where stage is null;

create unique index if not exists quick_templates_category_stage_text_uniq
  on public.quick_templates (category, stage, text)
  where stage is not null;

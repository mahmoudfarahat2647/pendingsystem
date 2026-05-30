-- Backfill quantity data from embedded leading-number prefixes in part descriptions.
--
-- Background:
--   Some part descriptions were historically entered with a leading integer indicating
--   quantity, e.g. "2 شدادات خلفى" means qty=2, description="شدادات خلفى".
--   The app now has an explicit `quantity` field on each part object (and a mirrored
--   top-level metadata->>'quantity' field).  This migration extracts that data.
--
-- Transform rule (applied per-part inside metadata->'parts'):
--   IF description matches ^[1-9]\d*\s  (positive leading integer + at least one space)
--     THEN  quantity  := the leading integer
--           description := description with the leading "N " prefix stripped
--   ELSE   leave the part object untouched
--          (the app schema default of 1 is supplied on read for any part without quantity)
--
-- Safety notes:
--   - "2"  (digit only, no trailing space) does NOT match ^[1-9]\d*\s → untouched.
--   - A leading 0 (e.g. "0 شدادات") is intentionally NOT extracted; quantity=0 would
--     fail the app schema (z.number().int().positive()), so such rows keep default 1.
--   - Orders with no parts array are untouched.
--   - Parts whose description does not start with a digit are untouched.
--   - COALESCE(..., '[]'::jsonb) guards jsonb_agg returning NULL on an empty aggregation.
--
-- Execution order matters: Statement 1 rebuilds the parts array first;
-- Statement 2 then re-syncs the top-level description and quantity from parts[0].

-- ============================================================
-- Statement 1: Rebuild parts array — extract quantity and strip
--              the leading "N " prefix from affected descriptions
-- ============================================================

UPDATE orders
SET metadata = jsonb_set(
  metadata,
  '{parts}',
  (
    SELECT COALESCE(
      jsonb_agg(
        CASE
          -- Part description begins with a positive integer followed by whitespace
          WHEN part->>'description' ~ '^[1-9]\d*\s'
          THEN jsonb_set(
                 jsonb_set(
                   part,
                   '{quantity}',
                   -- Extract the leading integer as a JSONB number
                   to_jsonb((regexp_match(part->>'description', '^([1-9]\d*)'))[1]::int)
                 ),
                 '{description}',
                 -- Strip the leading "N " prefix (greedy whitespace)
                 to_jsonb(regexp_replace(part->>'description', '^[1-9]\d*\s+', ''))
               )
          ELSE part
        END
      ),
      '[]'::jsonb
    )
    FROM jsonb_array_elements(metadata->'parts') AS part
  )
)
-- Only touch rows that actually contain at least one affected part
WHERE EXISTS (
  SELECT 1
  FROM jsonb_array_elements(metadata->'parts') AS part
  WHERE part->>'description' ~ '^[1-9]\d*\s'
);

-- ============================================================
-- Statement 2: Sync top-level metadata description and quantity
--              fields from the (now-updated) parts[0] entry
-- ============================================================
--
-- This keeps SQL-level queries on metadata->>'description' and
-- metadata->>'quantity' consistent with the parts array truth.
-- Scoped to ONLY the orders Statement 1 just modified: rows whose
-- top-level description still carries the "N " prefix while the
-- (now-stripped) parts[0].description no longer does. This state can
-- only be produced by Statement 1, so unrelated orders — including any
-- pre-existing top-level/parts[0] mismatches — are left untouched.

UPDATE orders
SET metadata = jsonb_set(
       jsonb_set(
         metadata,
         '{description}',
         -- Use parts[0].description; fall back to existing top-level value if missing
         COALESCE(
           metadata->'parts'->0->'description',
           metadata->'description',
           'null'::jsonb
         )
       ),
       '{quantity}',
       -- Use parts[0].quantity; fall back to 1 (schema default) if not set
       COALESCE(
         metadata->'parts'->0->'quantity',
         to_jsonb(1)
       )
     )
WHERE metadata->>'description' ~ '^[1-9]\d*\s'
  AND metadata->'parts'->0->>'description' !~ '^[1-9]\d*\s'
  AND jsonb_array_length(COALESCE(metadata->'parts', '[]'::jsonb)) > 0;

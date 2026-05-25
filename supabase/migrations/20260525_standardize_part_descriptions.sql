-- Standardize descriptions for 13 known part numbers.
-- Each part number gets two UPDATE statements:
--   A) top-level metadata->>'description' (used by conflict-detection SQL queries)
--   B) metadata->'parts' array entries (source of truth for the app)
-- ILIKE = case-insensitive part number match
-- IS DISTINCT FROM = skip rows already correct

-- ============================================================
-- 260605634R → كشاف شمال علوى
-- ============================================================

UPDATE orders
SET metadata = jsonb_set(metadata, '{description}', '"كشاف شمال علوى"')
WHERE metadata->>'partNumber' ILIKE '260605634R'
  AND metadata->>'description' IS DISTINCT FROM 'كشاف شمال علوى';

UPDATE orders
SET metadata = jsonb_set(
  metadata,
  '{parts}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN part->>'partNumber' ILIKE '260605634R'
        THEN jsonb_set(part, '{description}', '"كشاف شمال علوى"')
        ELSE part
      END
    )
    FROM jsonb_array_elements(metadata->'parts') AS part
  )
)
WHERE EXISTS (
  SELECT 1
  FROM jsonb_array_elements(metadata->'parts') AS part
  WHERE part->>'partNumber' ILIKE '260605634R'
    AND part->>'description' IS DISTINCT FROM 'كشاف شمال علوى'
);

-- ============================================================
-- 620129443R → اكصدام امامى علوى
-- ============================================================

UPDATE orders
SET metadata = jsonb_set(metadata, '{description}', '"اكصدام امامى علوى"')
WHERE metadata->>'partNumber' ILIKE '620129443R'
  AND metadata->>'description' IS DISTINCT FROM 'اكصدام امامى علوى';

UPDATE orders
SET metadata = jsonb_set(
  metadata,
  '{parts}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN part->>'partNumber' ILIKE '620129443R'
        THEN jsonb_set(part, '{description}', '"اكصدام امامى علوى"')
        ELSE part
      END
    )
    FROM jsonb_array_elements(metadata->'parts') AS part
  )
)
WHERE EXISTS (
  SELECT 1
  FROM jsonb_array_elements(metadata->'parts') AS part
  WHERE part->>'partNumber' ILIKE '620129443R'
    AND part->>'description' IS DISTINCT FROM 'اكصدام امامى علوى'
);

-- ============================================================
-- 620221471R → اكصدام امامى
-- ============================================================

UPDATE orders
SET metadata = jsonb_set(metadata, '{description}', '"اكصدام امامى"')
WHERE metadata->>'partNumber' ILIKE '620221471R'
  AND metadata->>'description' IS DISTINCT FROM 'اكصدام امامى';

UPDATE orders
SET metadata = jsonb_set(
  metadata,
  '{parts}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN part->>'partNumber' ILIKE '620221471R'
        THEN jsonb_set(part, '{description}', '"اكصدام امامى"')
        ELSE part
      END
    )
    FROM jsonb_array_elements(metadata->'parts') AS part
  )
)
WHERE EXISTS (
  SELECT 1
  FROM jsonb_array_elements(metadata->'parts') AS part
  WHERE part->>'partNumber' ILIKE '620221471R'
    AND part->>'description' IS DISTINCT FROM 'اكصدام امامى'
);

-- ============================================================
-- 622355863R → مصفح اكصدام امامى
-- ============================================================

UPDATE orders
SET metadata = jsonb_set(metadata, '{description}', '"مصفح اكصدام امامى"')
WHERE metadata->>'partNumber' ILIKE '622355863R'
  AND metadata->>'description' IS DISTINCT FROM 'مصفح اكصدام امامى';

UPDATE orders
SET metadata = jsonb_set(
  metadata,
  '{parts}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN part->>'partNumber' ILIKE '622355863R'
        THEN jsonb_set(part, '{description}', '"مصفح اكصدام امامى"')
        ELSE part
      END
    )
    FROM jsonb_array_elements(metadata->'parts') AS part
  )
)
WHERE EXISTS (
  SELECT 1
  FROM jsonb_array_elements(metadata->'parts') AS part
  WHERE part->>'partNumber' ILIKE '622355863R'
    AND part->>'description' IS DISTINCT FROM 'مصفح اكصدام امامى'
);

-- ============================================================
-- 625006891R → صدر
-- ============================================================

UPDATE orders
SET metadata = jsonb_set(metadata, '{description}', '"صدر"')
WHERE metadata->>'partNumber' ILIKE '625006891R'
  AND metadata->>'description' IS DISTINCT FROM 'صدر';

UPDATE orders
SET metadata = jsonb_set(
  metadata,
  '{parts}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN part->>'partNumber' ILIKE '625006891R'
        THEN jsonb_set(part, '{description}', '"صدر"')
        ELSE part
      END
    )
    FROM jsonb_array_elements(metadata->'parts') AS part
  )
)
WHERE EXISTS (
  SELECT 1
  FROM jsonb_array_elements(metadata->'parts') AS part
  WHERE part->>'partNumber' ILIKE '625006891R'
    AND part->>'description' IS DISTINCT FROM 'صدر'
);

-- ============================================================
-- 638132363R → داير رفرف امامى شمال
-- ============================================================

UPDATE orders
SET metadata = jsonb_set(metadata, '{description}', '"داير رفرف امامى شمال"')
WHERE metadata->>'partNumber' ILIKE '638132363R'
  AND metadata->>'description' IS DISTINCT FROM 'داير رفرف امامى شمال';

UPDATE orders
SET metadata = jsonb_set(
  metadata,
  '{parts}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN part->>'partNumber' ILIKE '638132363R'
        THEN jsonb_set(part, '{description}', '"داير رفرف امامى شمال"')
        ELSE part
      END
    )
    FROM jsonb_array_elements(metadata->'parts') AS part
  )
)
WHERE EXISTS (
  SELECT 1
  FROM jsonb_array_elements(metadata->'parts') AS part
  WHERE part->>'partNumber' ILIKE '638132363R'
    AND part->>'description' IS DISTINCT FROM 'داير رفرف امامى شمال'
);

-- ============================================================
-- 727124129R → زجاج امامى
-- ============================================================

UPDATE orders
SET metadata = jsonb_set(metadata, '{description}', '"زجاج امامى"')
WHERE metadata->>'partNumber' ILIKE '727124129R'
  AND metadata->>'description' IS DISTINCT FROM 'زجاج امامى';

UPDATE orders
SET metadata = jsonb_set(
  metadata,
  '{parts}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN part->>'partNumber' ILIKE '727124129R'
        THEN jsonb_set(part, '{description}', '"زجاج امامى"')
        ELSE part
      END
    )
    FROM jsonb_array_elements(metadata->'parts') AS part
  )
)
WHERE EXISTS (
  SELECT 1
  FROM jsonb_array_elements(metadata->'parts') AS part
  WHERE part->>'partNumber' ILIKE '727124129R'
    AND part->>'description' IS DISTINCT FROM 'زجاج امامى'
);

-- ============================================================
-- 804309225R → 2 شدادات خلفى
-- ============================================================

UPDATE orders
SET metadata = jsonb_set(metadata, '{description}', '"2 شدادات خلفى"')
WHERE metadata->>'partNumber' ILIKE '804309225R'
  AND metadata->>'description' IS DISTINCT FROM '2 شدادات خلفى';

UPDATE orders
SET metadata = jsonb_set(
  metadata,
  '{parts}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN part->>'partNumber' ILIKE '804309225R'
        THEN jsonb_set(part, '{description}', '"2 شدادات خلفى"')
        ELSE part
      END
    )
    FROM jsonb_array_elements(metadata->'parts') AS part
  )
)
WHERE EXISTS (
  SELECT 1
  FROM jsonb_array_elements(metadata->'parts') AS part
  WHERE part->>'partNumber' ILIKE '804309225R'
    AND part->>'description' IS DISTINCT FROM '2 شدادات خلفى'
);

-- ============================================================
-- 809012155R → فرش باب امامى شمال
-- ============================================================

UPDATE orders
SET metadata = jsonb_set(metadata, '{description}', '"فرش باب امامى شمال"')
WHERE metadata->>'partNumber' ILIKE '809012155R'
  AND metadata->>'description' IS DISTINCT FROM 'فرش باب امامى شمال';

UPDATE orders
SET metadata = jsonb_set(
  metadata,
  '{parts}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN part->>'partNumber' ILIKE '809012155R'
        THEN jsonb_set(part, '{description}', '"فرش باب امامى شمال"')
        ELSE part
      END
    )
    FROM jsonb_array_elements(metadata->'parts') AS part
  )
)
WHERE EXISTS (
  SELECT 1
  FROM jsonb_array_elements(metadata->'parts') AS part
  WHERE part->>'partNumber' ILIKE '809012155R'
    AND part->>'description' IS DISTINCT FROM 'فرش باب امامى شمال'
);

-- ============================================================
-- 824309801R → 2 شدادات امامى
-- ============================================================

UPDATE orders
SET metadata = jsonb_set(metadata, '{description}', '"2 شدادات امامى"')
WHERE metadata->>'partNumber' ILIKE '824309801R'
  AND metadata->>'description' IS DISTINCT FROM '2 شدادات امامى';

UPDATE orders
SET metadata = jsonb_set(
  metadata,
  '{parts}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN part->>'partNumber' ILIKE '824309801R'
        THEN jsonb_set(part, '{description}', '"2 شدادات امامى"')
        ELSE part
      END
    )
    FROM jsonb_array_elements(metadata->'parts') AS part
  )
)
WHERE EXISTS (
  SELECT 1
  FROM jsonb_array_elements(metadata->'parts') AS part
  WHERE part->>'partNumber' ILIKE '824309801R'
    AND part->>'description' IS DISTINCT FROM '2 شدادات امامى'
);

-- ============================================================
-- 850100309V → اكصدام خلفى
-- ============================================================

UPDATE orders
SET metadata = jsonb_set(metadata, '{description}', '"اكصدام خلفى"')
WHERE metadata->>'partNumber' ILIKE '850100309V'
  AND metadata->>'description' IS DISTINCT FROM 'اكصدام خلفى';

UPDATE orders
SET metadata = jsonb_set(
  metadata,
  '{parts}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN part->>'partNumber' ILIKE '850100309V'
        THEN jsonb_set(part, '{description}', '"اكصدام خلفى"')
        ELSE part
      END
    )
    FROM jsonb_array_elements(metadata->'parts') AS part
  )
)
WHERE EXISTS (
  SELECT 1
  FROM jsonb_array_elements(metadata->'parts') AS part
  WHERE part->>'partNumber' ILIKE '850100309V'
    AND part->>'description' IS DISTINCT FROM 'اكصدام خلفى'
);

-- ============================================================
-- 876G37352R → مساج كرسى السائق
-- ============================================================

UPDATE orders
SET metadata = jsonb_set(metadata, '{description}', '"مساج كرسى السائق"')
WHERE metadata->>'partNumber' ILIKE '876G37352R'
  AND metadata->>'description' IS DISTINCT FROM 'مساج كرسى السائق';

UPDATE orders
SET metadata = jsonb_set(
  metadata,
  '{parts}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN part->>'partNumber' ILIKE '876G37352R'
        THEN jsonb_set(part, '{description}', '"مساج كرسى السائق"')
        ELSE part
      END
    )
    FROM jsonb_array_elements(metadata->'parts') AS part
  )
)
WHERE EXISTS (
  SELECT 1
  FROM jsonb_array_elements(metadata->'parts') AS part
  WHERE part->>'partNumber' ILIKE '876G37352R'
    AND part->>'description' IS DISTINCT FROM 'مساج كرسى السائق'
);

-- ============================================================
-- 913504996R → زجاج فتحة سقف
-- ============================================================

UPDATE orders
SET metadata = jsonb_set(metadata, '{description}', '"زجاج فتحة سقف"')
WHERE metadata->>'partNumber' ILIKE '913504996R'
  AND metadata->>'description' IS DISTINCT FROM 'زجاج فتحة سقف';

UPDATE orders
SET metadata = jsonb_set(
  metadata,
  '{parts}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN part->>'partNumber' ILIKE '913504996R'
        THEN jsonb_set(part, '{description}', '"زجاج فتحة سقف"')
        ELSE part
      END
    )
    FROM jsonb_array_elements(metadata->'parts') AS part
  )
)
WHERE EXISTS (
  SELECT 1
  FROM jsonb_array_elements(metadata->'parts') AS part
  WHERE part->>'partNumber' ILIKE '913504996R'
    AND part->>'description' IS DISTINCT FROM 'زجاج فتحة سقف'
);

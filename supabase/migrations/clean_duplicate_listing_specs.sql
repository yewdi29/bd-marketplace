-- Remove redundant year/model/manufacturer/brand/condition/category keys from
-- listings.specs JSON. These values already live in dedicated columns and were
-- duplicated in the freeform specs blob by the AI generator.

UPDATE listings
SET specs = (
  SELECT COALESCE(jsonb_object_agg(key, value), '{}'::jsonb)
  FROM jsonb_each(specs) AS e(key, value)
  WHERE lower(trim(key)) NOT IN (
    'year',
    'manufacturer',
    'brand',
    'make',
    'model',
    'condition',
    'category'
  )
)
WHERE specs IS NOT NULL
  AND specs != '{}'::jsonb
  AND EXISTS (
    SELECT 1
    FROM jsonb_each(specs) AS e(key, value)
    WHERE lower(trim(key)) IN (
      'year',
      'manufacturer',
      'brand',
      'make',
      'model',
      'condition',
      'category'
    )
  );

-- Normalize empty specs objects to NULL
UPDATE listings
SET specs = NULL
WHERE specs = '{}'::jsonb;

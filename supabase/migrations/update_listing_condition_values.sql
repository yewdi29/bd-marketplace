-- Listing condition enum refresh (run only after reviewing row counts below).
--
-- Pre-migration counts (2026-10-19):
--   good: 19 | like_new: 8 | (null): 7 | new: 7 | fair: 4 | (empty string): 1 | parts_only: 0
--
-- Step 1: remap legacy values
UPDATE listings SET condition = 'poor' WHERE condition = 'parts_only';
UPDATE listings SET condition = NULL WHERE condition = '';

-- Step 2: enforce allowed values
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_condition_check;

ALTER TABLE listings ADD CONSTRAINT listings_condition_check
  CHECK (
    condition IS NULL
    OR condition IN (
      'new',
      'like_new',
      'great',
      'good',
      'fair',
      'poor',
      'rebuilt'
    )
  );

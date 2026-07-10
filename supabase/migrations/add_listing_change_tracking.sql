-- Tracks when a listing was last approved and when a major edit occurred.
-- Used by publish/edit flows to skip or require AI review.

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS last_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_major_edit_at timestamptz;

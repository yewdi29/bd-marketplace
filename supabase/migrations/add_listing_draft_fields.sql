-- Add fields required for the new listing modal flow
-- Run this in the Supabase SQL Editor before testing the new listing flow.

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS price_visible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS tags          text[],
  ADD COLUMN IF NOT EXISTS video_url     text;

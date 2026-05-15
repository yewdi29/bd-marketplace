-- Saved listings — users can bookmark listings they're interested in.
-- Run this in the Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.saved_listings (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS saved_listings_user_idx    ON public.saved_listings (user_id);
CREATE INDEX IF NOT EXISTS saved_listings_listing_idx ON public.saved_listings (listing_id);

ALTER TABLE public.saved_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own saved listings"
  ON public.saved_listings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Site-wide feedback submissions (anonymous + authenticated)

CREATE TYPE public.feedback_category AS ENUM (
  'bug',
  'feature_request',
  'like',
  'dislike'
);

CREATE TYPE public.feedback_status AS ENUM (
  'new',
  'reviewed',
  'resolved',
  'dismissed'
);

CREATE TABLE public.feedback (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  category   public.feedback_category NOT NULL,
  message    text NOT NULL,
  image_url  text,
  page_url   text NOT NULL,
  user_id    uuid REFERENCES public.users(id) ON DELETE SET NULL,
  user_tier  text,
  user_role  text,
  status     public.feedback_status NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX feedback_status_created_at_idx
  ON public.feedback (status, created_at DESC);

CREATE INDEX feedback_created_at_idx
  ON public.feedback (created_at DESC);

COMMENT ON TABLE public.feedback IS
  'User/visitor feedback from the site-wide peeking tab. Anonymous inserts allowed; admin-only read/update.';

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can insert
CREATE POLICY "Anyone can insert feedback"
  ON public.feedback
  FOR INSERT
  WITH CHECK (true);

-- Admins only for read/update
CREATE POLICY "Admins can select feedback"
  ON public.feedback
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update feedback"
  ON public.feedback
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Public bucket for optional bug screenshots (served via public URL in admin UI)
INSERT INTO storage.buckets (id, name, public)
VALUES ('feedback-images', 'feedback-images', true)
ON CONFLICT (id) DO NOTHING;

-- Uploads go through service-role API; allow public read of objects
DROP POLICY IF EXISTS "Public read feedback images" ON storage.objects;
CREATE POLICY "Public read feedback images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'feedback-images');

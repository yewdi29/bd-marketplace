-- Hide internal moderation / AI-review columns on public.listings from the anon role.
--
-- Excluded from GRANT SELECT TO anon (and why):
--   ai_verification_notes      — AI listing-review notes (admin / owner only)
--   ai_verification_score      — AI listing-review score (admin / owner only)
--   ai_recommended_action      — AI listing-review action (admin / owner only)
--   admin_flagged              — admin moderation flag
--   removal_reason             — admin/seller removal notes
--   deal_tier                  — internal deal-routing field (not a public listing attribute)
--
-- Does not change RLS row policies. Does not change grants for authenticated or service_role.
-- Rollback: GRANT SELECT ON public.listings TO anon;

REVOKE SELECT ON public.listings FROM anon;

GRANT SELECT (
  id,
  seller_id,
  organization_id,
  posted_by_user_id,
  title,
  description,
  category,
  manufacturer,
  model,
  year,
  condition,
  price,
  price_unit,
  price_negotiable,
  price_visible,
  location_city,
  location_state,
  tags,
  specs,
  video_url,
  status,
  tier,
  featured,
  view_count,
  slug,
  meta_description,
  created_at,
  updated_at,
  industry_id,
  category_id,
  country_id,
  region_id,
  state_id,
  latitude,
  longitude,
  search_vector,
  last_approved_at,
  last_major_edit_at
) ON public.listings TO anon;

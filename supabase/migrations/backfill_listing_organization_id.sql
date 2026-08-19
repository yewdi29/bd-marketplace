-- Stamp organization_id on listings owned by active org members that were never
-- linked to the company (drafts/creates after org join skipped this historically).
-- posted_by_user_id is set to the seller when still null.

UPDATE public.listings AS l
SET
  organization_id = m.organization_id,
  posted_by_user_id = COALESCE(l.posted_by_user_id, l.seller_id)
FROM public.org_members AS m
WHERE m.user_id = l.seller_id
  AND m.status = 'active'
  AND l.organization_id IS NULL;

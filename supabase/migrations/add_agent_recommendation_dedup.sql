-- One pending Listing Verifier recommendation per listing (prevents duplicate webhook runs)
-- Step 1: remove duplicate pending rows left by webhook retries (keep newest per listing)

DELETE FROM public.agent_recommendations
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY entity_id
        ORDER BY created_at DESC
      ) AS rn
    FROM public.agent_recommendations
    WHERE entity_type = 'listing'
      AND agent_name = 'Listing Verifier'
      AND status = 'pending'
  ) ranked
  WHERE rn > 1
);

-- Step 2: enforce at most one pending recommendation per listing

CREATE UNIQUE INDEX IF NOT EXISTS agent_recommendations_one_pending_listing_verifier_idx
  ON public.agent_recommendations (entity_id)
  WHERE entity_type = 'listing'
    AND agent_name = 'Listing Verifier'
    AND status = 'pending';

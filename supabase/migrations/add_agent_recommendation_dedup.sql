-- One pending Listing Verifier recommendation per listing (prevents duplicate webhook runs)

CREATE UNIQUE INDEX IF NOT EXISTS agent_recommendations_one_pending_listing_verifier_idx
  ON public.agent_recommendations (entity_id)
  WHERE entity_type = 'listing'
    AND agent_name = 'Listing Verifier'
    AND status = 'pending';

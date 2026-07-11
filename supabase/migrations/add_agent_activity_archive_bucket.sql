-- Private archive bucket for agent_activity_log retention exports.
-- Service role uploads via API route; no public read access.

INSERT INTO storage.buckets (id, name, public)
VALUES ('agent-activity-archive', 'agent-activity-archive', false)
ON CONFLICT (id) DO NOTHING;

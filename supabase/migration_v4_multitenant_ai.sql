-- ============================================================
-- Migration v4 — Multi-tenant AI Support
-- Run via: n8n → Postgres node → Execute (once)
-- ============================================================

-- 1) Add AI-related columns to organizations
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS anthropic_key      text,        -- org's own Anthropic key (optional)
  ADD COLUMN IF NOT EXISTS ai_requests_used   integer NOT NULL DEFAULT 0;

-- 2) Create index for efficient plan lookups
CREATE INDEX IF NOT EXISTS idx_org_plan ON organizations(plan_id);

-- 3) Add RLS: org members can see their own org's AI usage
--    (already handled by existing org RLS — no new policy needed)

-- 4) Create a secure function to increment AI usage (called by service role)
CREATE OR REPLACE FUNCTION increment_ai_usage(org_id uuid)
RETURNS void AS $$
  UPDATE organizations
  SET ai_requests_used = ai_requests_used + 1
  WHERE id = org_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- 5) Expose plans table for RLS-safe reads (anon can read plan limits)
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read plans" ON plans;
CREATE POLICY "Anyone can read plans"
  ON plans FOR SELECT
  USING (true);

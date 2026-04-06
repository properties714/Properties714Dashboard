-- Migration: add new columns for Google Sheet compatibility
ALTER TABLE acquisitions_leads
  ADD COLUMN IF NOT EXISTS listing_url     text,
  ADD COLUMN IF NOT EXISTS beds            integer,
  ADD COLUMN IF NOT EXISTS baths           numeric,
  ADD COLUMN IF NOT EXISTS comp1_address   text,
  ADD COLUMN IF NOT EXISTS comp1_distance  numeric,
  ADD COLUMN IF NOT EXISTS comp2_address   text,
  ADD COLUMN IF NOT EXISTS comp2_distance  numeric,
  ADD COLUMN IF NOT EXISTS comp3_address   text,
  ADD COLUMN IF NOT EXISTS comp3_distance  numeric,
  ADD COLUMN IF NOT EXISTS initial_offer   numeric,
  ADD COLUMN IF NOT EXISTS owner_name      text;

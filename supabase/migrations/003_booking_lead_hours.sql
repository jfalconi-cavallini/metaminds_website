-- ================================================================
-- Migration 003: Add booking_lead_hours to tutors
-- Run this in the Supabase SQL Editor
-- ================================================================

ALTER TABLE tutors ADD COLUMN IF NOT EXISTS booking_lead_hours integer NOT NULL DEFAULT 24;

-- Migration 009: Add grade column to homework table
ALTER TABLE homework ADD COLUMN IF NOT EXISTS grade text;

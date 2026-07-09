-- Allow parent updates to tag which sessions they cover
ALTER TABLE parent_updates ADD COLUMN IF NOT EXISTS session_ids INTEGER[] DEFAULT '{}';

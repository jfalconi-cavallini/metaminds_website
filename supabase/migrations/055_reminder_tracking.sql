-- 055: Track when session/homework reminder emails have been sent, so the
-- daily reminders cron doesn't email the same session or assignment twice.

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;
ALTER TABLE homework ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

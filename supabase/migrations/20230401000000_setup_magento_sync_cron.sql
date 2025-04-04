
-- Enable the required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the Magento sync job to run daily at 3 AM
SELECT cron.schedule(
  'daily-magento-sync', -- unique job name
  '0 3 * * *', -- cron schedule (3 AM daily)
  $$
  -- This SQL runs at the scheduled time
  SELECT net.http_post(
    url:='https://vlkcnndgtarduplyedyp.supabase.co/functions/v1/magento-sync-cron',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsa2NubmRndGFyZHVwbHllZHlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyNDY0ODYsImV4cCI6MjA1MTgyMjQ4Nn0.jr1HnmnBjlyabBUafz6gFpjpjGrYMq4E3XckB0XCovE"}'::jsonb,
    body:='{"source": "scheduled_cron"}'::jsonb
  ) as request_id;
  $$
);

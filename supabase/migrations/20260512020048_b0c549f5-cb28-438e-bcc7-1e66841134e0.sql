
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Unschedule existing job if any
DO $$
BEGIN
  PERFORM cron.unschedule('auto-newsletter-dispatch-hourly');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'auto-newsletter-dispatch-hourly',
  '5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://xwtmnzorzsvkamqemddk.supabase.co/functions/v1/auto-newsletter-dispatch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3dG1uem9yenN2a2FtcWVtZGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MDIyNzQsImV4cCI6MjA4OTE3ODI3NH0.QE1RN4EiQd2bB5RD41mtRP_Gn4mJ21QaA7WvU69MVig'
    ),
    body := '{}'::jsonb
  );
  $$
);

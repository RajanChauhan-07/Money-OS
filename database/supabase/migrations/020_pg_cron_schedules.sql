-- 020: pg_cron schedules
-- Note: pg_cron is only available on Supabase hosted (not local).
-- These schedules should be applied via Supabase Dashboard > SQL Editor
-- after deploying Edge Functions.

-- AMFI NAV sync: weekdays at 10:30PM IST (5PM UTC)
-- SELECT cron.schedule('amfi-nav-sync', '30 17 * * 1-5',
--   $$SELECT net.http_post(
--     url:='https://zxyisgkwyheejgpsxvpm.supabase.co/functions/v1/amfi-nav-sync',
--     headers:='{"Authorization":"Bearer SERVICE_ROLE_KEY"}'::jsonb
--   )$$
-- );

-- Deadline nudges: daily at 9AM IST (3:30AM UTC)
-- SELECT cron.schedule('deadline-nudges', '30 3 * * *',
--   $$SELECT net.http_post(
--     url:='https://zxyisgkwyheejgpsxvpm.supabase.co/functions/v1/deadline-nudges',
--     headers:='{"Authorization":"Bearer SERVICE_ROLE_KEY"}'::jsonb
--   )$$
-- );

-- OTP session cleanup: every hour
-- SELECT cron.schedule('otp-cleanup', '0 * * * *',
--   $$DELETE FROM public.otp_sessions WHERE expires_at < now() - interval '1 hour'$$
-- );

-- To activate these, run in Supabase SQL Editor with your actual service role key.
-- The schedules are commented to prevent errors during local migration.
SELECT 1; -- no-op so migration file isn't empty

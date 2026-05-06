-- 021: Prune legacy fintech infrastructure tables
-- Strategic pivot to Planner requires only 8 core tables.

-- DROP tables that are no longer part of the "Tax In, Plan Out" utility
DROP TABLE IF EXISTS public.sip_mandates CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.holdings CASCADE;
DROP TABLE IF EXISTS public.mf_funds CASCADE;
DROP TABLE IF EXISTS public.risk_assessments CASCADE;
DROP TABLE IF EXISTS public.otp_sessions CASCADE;
DROP TABLE IF EXISTS public.admin_users CASCADE;
DROP TABLE IF EXISTS public.audit_log CASCADE;

-- We are left with:
-- 1. users
-- 2. salary_profiles
-- 3. life_situations
-- 4. existing_investments
-- 5. financial_goals
-- 6. tax_calculations
-- 7. investment_plans
-- 8. notifications

-- Clean up any unused extensions if necessary (optional)
-- Clean up pg_cron jobs if they were related to dropped tables
DELETE FROM cron.job WHERE jobname LIKE 'sync_holdings%';
DELETE FROM cron.job WHERE jobname LIKE 'check_sip%';

-- Add a comment to mark the completion of the pivot
COMMENT ON DATABASE postgres IS 'Money OS - Strategic Pivot: AI-Powered Financial Planning Tool';

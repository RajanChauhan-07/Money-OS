-- 018: Additional composite and partial indexes for performance
CREATE INDEX IF NOT EXISTS idx_salary_user_fy
  ON public.salary_profiles(user_id, financial_year) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_life_user_fy
  ON public.life_situations(user_id, financial_year);

CREATE INDEX IF NOT EXISTS idx_investments_user_fy
  ON public.existing_investments(user_id, financial_year);

CREATE INDEX IF NOT EXISTS idx_goals_user_active
  ON public.financial_goals(user_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_risk_current
  ON public.risk_assessments(user_id) WHERE is_current = true;

CREATE INDEX IF NOT EXISTS idx_plan_current
  ON public.investment_plans(user_id, financial_year) WHERE is_current = true;

CREATE INDEX IF NOT EXISTS idx_holdings_user
  ON public.holdings(user_id);

CREATE INDEX IF NOT EXISTS idx_sip_active
  ON public.sip_mandates(user_id, status) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_otp_cleanup
  ON public.otp_sessions(expires_at) WHERE verified_at IS NULL;

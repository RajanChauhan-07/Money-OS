-- 002: Users table — extends auth.users with financial identity layer
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  mobile_hash text UNIQUE NOT NULL,
  pan_encrypted text UNIQUE,
  pan_last4 char(4),
  full_name text NOT NULL DEFAULT '',
  dob date,
  gender text CHECK (gender IN ('male','female','other','prefer_not_to_say')),
  kyc_status text NOT NULL DEFAULT 'pending'
    CHECK (kyc_status IN ('pending','verified','expired','rejected')),
  kyc_verified_at timestamptz,
  kyc_expires_at timestamptz,
  onboarding_step int2 NOT NULL DEFAULT 0
    CHECK (onboarding_step BETWEEN 0 AND 7),
  is_onboarded boolean NOT NULL DEFAULT false,
  -- DPDP Act 2023 compliance fields
  dpdp_consent_at timestamptz NOT NULL DEFAULT now(),
  dpdp_consent_ip inet NOT NULL DEFAULT '0.0.0.0',
  dpdp_consent_version text NOT NULL DEFAULT '1.0',
  data_deletion_requested_at timestamptz,
  -- Notification preferences
  notification_prefs jsonb NOT NULL DEFAULT
    '{"sip":true,"tax":true,"goal":true,"planning":true,"system":true,"email":true,"sms":false}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can only read their own row
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own row but cannot remove DPDP consent
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND dpdp_consent_at IS NOT NULL);

-- INSERT is blocked for clients — only service role (via Edge Function) creates users
-- No INSERT policy = blocked by default with RLS enabled

COMMENT ON TABLE public.users IS 'Financial identity layer extending auth.users — DPDP compliant';
-- 003: OTP sessions — rate limiting and verification tracking
CREATE TABLE public.otp_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile_hash text NOT NULL,
  otp_hash text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  attempts int2 NOT NULL DEFAULT 0,
  verified_at timestamptz,
  ip_address inet NOT NULL DEFAULT '0.0.0.0',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_otp_mobile_hash ON public.otp_sessions(mobile_hash);
CREATE INDEX idx_otp_expires ON public.otp_sessions(expires_at);

-- RLS enabled — accessed only via service role
ALTER TABLE public.otp_sessions ENABLE ROW LEVEL SECURITY;
-- No policies = only service role can access

COMMENT ON TABLE public.otp_sessions IS 'SMS OTP rate limiting — never stores plaintext OTP or mobile';
-- 004: Audit log — immutable, append-only compliance log
CREATE TABLE public.audit_log (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES public.users(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  ip_address inet,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_user ON public.audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_action ON public.audit_log(action);

-- RLS — select own only, no UPDATE or DELETE ever
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_select_own" ON public.audit_log
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT only via service role — no client INSERT policy
-- No UPDATE policy = updates blocked
-- No DELETE policy = deletes blocked

COMMENT ON TABLE public.audit_log IS 'Append-only audit trail — DPDP + compliance. Never update or delete.';
-- 005: Salary profiles — one active per user per FY
CREATE TABLE public.salary_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  financial_year text NOT NULL,
  annual_ctc numeric(14,2) NOT NULL CHECK (annual_ctc > 0),
  basic_salary numeric(14,2) DEFAULT 0,
  hra_monthly numeric(14,2) DEFAULT 0,
  lta_annual numeric(14,2) DEFAULT 0,
  special_allowance numeric(14,2) DEFAULT 0,
  other_allowances numeric(14,2) DEFAULT 0,
  variable_pay_pct numeric(5,2) DEFAULT 0,
  is_metro_city boolean DEFAULT false,
  city_name text DEFAULT '',
  monthly_rent numeric(14,2) DEFAULT 0,
  epf_employee_pct numeric(5,2) DEFAULT 12,
  epf_employer_pct numeric(5,2) DEFAULT 12,
  has_employer_nps boolean DEFAULT false,
  employer_nps_pct numeric(5,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, financial_year, is_active)
);

ALTER TABLE public.salary_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salary_own" ON public.salary_profiles
  FOR ALL USING (auth.uid() = user_id);
-- 006: Life situations — home loan, rent, dependents, health insurance
CREATE TABLE public.life_situations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  financial_year text NOT NULL,
  is_renting boolean DEFAULT false,
  has_home_loan boolean DEFAULT false,
  home_loan_interest_annual numeric(14,2) DEFAULT 0,
  home_loan_principal_annual numeric(14,2) DEFAULT 0,
  dependent_children int2 DEFAULT 0,
  has_senior_parents boolean DEFAULT false,
  self_health_premium numeric(14,2) DEFAULT 0,
  family_health_premium numeric(14,2) DEFAULT 0,
  parent_health_premium numeric(14,2) DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, financial_year)
);

ALTER TABLE public.life_situations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "life_own" ON public.life_situations
  FOR ALL USING (auth.uid() = user_id);
-- 007: Existing investments — 80C/80D tracking
CREATE TABLE public.existing_investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  financial_year text NOT NULL,
  ppf_annual numeric(14,2) DEFAULT 0,
  lic_premium_annual numeric(14,2) DEFAULT 0,
  elss_annual numeric(14,2) DEFAULT 0,
  nsc_annual numeric(14,2) DEFAULT 0,
  ssy_annual numeric(14,2) DEFAULT 0,
  tuition_fees numeric(14,2) DEFAULT 0,
  nps_employee_annual numeric(14,2) DEFAULT 0,
  other_80c_annual numeric(14,2) DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, financial_year)
);

ALTER TABLE public.existing_investments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "investments_own" ON public.existing_investments
  FOR ALL USING (auth.uid() = user_id);
-- 008: Financial goals — drives SIP recommendations
CREATE TABLE public.financial_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  goal_type text NOT NULL
    CHECK (goal_type IN ('retirement','home','education','emergency','vehicle','travel','custom')),
  name text NOT NULL,
  target_amount numeric(16,2) NOT NULL CHECK (target_amount > 0),
  target_year int4 NOT NULL CHECK (target_year >= 2025),
  current_savings numeric(14,2) DEFAULT 0,
  priority int2 DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  monthly_sip_required numeric(14,2),
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "goals_own" ON public.financial_goals
  FOR ALL USING (auth.uid() = user_id);
-- 009: Risk assessments — SEBI-mandated risk profiling
CREATE TABLE public.risk_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  score int2 NOT NULL CHECK (score BETWEEN 0 AND 100),
  profile text NOT NULL
    CHECK (profile IN ('conservative','moderate','aggressive')),
  equity_pct int2 NOT NULL CHECK (equity_pct BETWEEN 0 AND 100),
  answers jsonb NOT NULL DEFAULT '[]',
  is_current boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "risk_own" ON public.risk_assessments
  FOR ALL USING (auth.uid() = user_id);
-- 010: Tax calculations — full audit trail, every recalculation stored
CREATE TABLE public.tax_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  financial_year text NOT NULL,
  version int4 NOT NULL DEFAULT 1,
  is_current boolean DEFAULT true,
  inputs_snapshot jsonb NOT NULL DEFAULT '{}',
  old_regime_result jsonb NOT NULL DEFAULT '{}',
  new_regime_result jsonb NOT NULL DEFAULT '{}',
  recommended_regime text NOT NULL
    CHECK (recommended_regime IN ('old','new')),
  savings_delta numeric(14,2) NOT NULL DEFAULT 0,
  deductions_detail jsonb NOT NULL DEFAULT '{}',
  tax_law_version text NOT NULL DEFAULT 'FY2025-26-v1',
  trigger_reason text DEFAULT 'initial'
    CHECK (trigger_reason IN ('initial','salary_update','law_change','manual','profile_update')),
  calculated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_taxcalc_user_fy ON public.tax_calculations(user_id, financial_year);
CREATE INDEX idx_taxcalc_current ON public.tax_calculations(user_id, financial_year, is_current)
  WHERE is_current = true;

-- RLS — select + insert own, no update/delete (immutable audit trail)
ALTER TABLE public.tax_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "taxcalc_select_own" ON public.tax_calculations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "taxcalc_insert_own" ON public.tax_calculations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- No UPDATE or DELETE policies = blocked
-- 011: Investment plans — linked to tax calculations
CREATE TABLE public.investment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tax_calculation_id uuid NOT NULL REFERENCES public.tax_calculations(id),
  financial_year text NOT NULL,
  version int4 NOT NULL DEFAULT 1,
  is_current boolean DEFAULT true,
  allocations jsonb NOT NULL DEFAULT '[]',
  monthly_plan jsonb NOT NULL DEFAULT '[]',
  total_annual_investment numeric(14,2) NOT NULL DEFAULT 0,
  projected_tax_saving numeric(14,2) NOT NULL DEFAULT 0,
  section_80c_used numeric(14,2) NOT NULL DEFAULT 0,
  section_80d_used numeric(14,2) NOT NULL DEFAULT 0,
  nps_used numeric(14,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_plan_user_fy ON public.investment_plans(user_id, financial_year);

ALTER TABLE public.investment_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan_select_own" ON public.investment_plans
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "plan_insert_own" ON public.investment_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);
-- 012: Mutual fund master data — synced daily from AMFI
CREATE TABLE public.mf_funds (
  scheme_code text PRIMARY KEY,
  isin_growth text UNIQUE,
  scheme_name text NOT NULL,
  amc_name text NOT NULL,
  category text NOT NULL DEFAULT 'Other',
  sub_category text,
  nav numeric(12,4) NOT NULL DEFAULT 0,
  nav_date date,
  returns_1y numeric(8,4),
  returns_3y numeric(8,4),
  returns_5y numeric(8,4),
  risk_level text DEFAULT 'Moderate',
  min_sip_amount numeric(10,2) DEFAULT 500,
  min_lumpsum numeric(10,2) DEFAULT 1000,
  exit_load text DEFAULT '',
  is_elss boolean DEFAULT false,
  is_active boolean DEFAULT true,
  search_vector tsvector,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_mf_search ON public.mf_funds USING GIN(search_vector);
CREATE INDEX idx_mf_category ON public.mf_funds(category, is_active);
CREATE INDEX idx_mf_elss ON public.mf_funds(is_elss, is_active);

-- Public read for all authenticated users
ALTER TABLE public.mf_funds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mf_public_read" ON public.mf_funds
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- INSERT/UPDATE only via service role (AMFI sync Edge Function)
-- No INSERT/UPDATE policies for regular users
-- 013: Holdings — user MF holdings
CREATE TABLE public.holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  scheme_code text NOT NULL REFERENCES public.mf_funds(scheme_code),
  units numeric(16,4) NOT NULL DEFAULT 0,
  avg_nav numeric(12,4) NOT NULL DEFAULT 0,
  invested_amount numeric(14,2) NOT NULL DEFAULT 0,
  goal_id uuid REFERENCES public.financial_goals(id),
  section text CHECK (section IN ('80C','Other')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, scheme_code)
);

ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "holdings_own" ON public.holdings
  FOR ALL USING (auth.uid() = user_id);
-- 014: Transactions — every investment order
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  scheme_code text NOT NULL REFERENCES public.mf_funds(scheme_code),
  type text NOT NULL CHECK (type IN ('SIP','Lumpsum','Redemption','Switch')),
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  units numeric(16,4),
  nav numeric(12,4),
  status text NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing','allotted','failed','cancelled')),
  order_id text UNIQUE,
  sip_id uuid,
  failure_reason text,
  transacted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_txn_user ON public.transactions(user_id, transacted_at DESC);
CREATE INDEX idx_txn_status ON public.transactions(status);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "txn_select_own" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "txn_insert_own" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
-- 015: SIP mandates — active SIPs with eNACH status
CREATE TABLE public.sip_mandates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  scheme_code text NOT NULL REFERENCES public.mf_funds(scheme_code),
  amount numeric(14,2) NOT NULL CHECK (amount >= 500),
  frequency text NOT NULL DEFAULT 'monthly'
    CHECK (frequency IN ('monthly','quarterly')),
  sip_date int2 NOT NULL CHECK (sip_date BETWEEN 1 AND 28),
  start_date date NOT NULL,
  next_debit_date date,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','paused','cancelled','mandate_expired')),
  mandate_id text,
  mandate_expires_at date,
  goal_id uuid REFERENCES public.financial_goals(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sip_mandates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sip_own" ON public.sip_mandates
  FOR ALL USING (auth.uid() = user_id);
-- 016: Notifications — in-app + push + email
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category text NOT NULL
    CHECK (category IN ('sip','tax','goal','planning','system')),
  title text NOT NULL,
  body text NOT NULL,
  action_url text,
  is_read boolean DEFAULT false,
  sent_via text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notif_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notif_unread ON public.notifications(user_id, is_read)
  WHERE is_read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_own" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);
-- 017: Admin users — ops team, separate from regular users
CREATE TABLE public.admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'readonly'
    CHECK (role IN ('super_admin','ops','support','readonly')),
  can_bulk_recalculate boolean DEFAULT false,
  can_send_notifications boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_select_self" ON public.admin_users
  FOR SELECT USING (auth.uid() = id);

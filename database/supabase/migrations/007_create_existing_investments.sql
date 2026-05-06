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

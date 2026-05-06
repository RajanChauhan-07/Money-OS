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

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

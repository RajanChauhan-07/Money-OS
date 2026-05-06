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

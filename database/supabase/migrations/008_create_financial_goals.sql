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

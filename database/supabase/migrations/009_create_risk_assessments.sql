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

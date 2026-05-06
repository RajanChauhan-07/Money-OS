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

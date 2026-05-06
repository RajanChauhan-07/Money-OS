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

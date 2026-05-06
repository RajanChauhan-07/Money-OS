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

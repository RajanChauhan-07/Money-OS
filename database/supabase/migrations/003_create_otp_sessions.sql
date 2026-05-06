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

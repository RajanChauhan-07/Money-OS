-- 002: Users table — extends auth.users with financial identity layer
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  mobile_hash text UNIQUE NOT NULL,
  pan_encrypted text UNIQUE,
  pan_last4 char(4),
  full_name text NOT NULL DEFAULT '',
  dob date,
  gender text CHECK (gender IN ('male','female','other','prefer_not_to_say')),
  kyc_status text NOT NULL DEFAULT 'pending'
    CHECK (kyc_status IN ('pending','verified','expired','rejected')),
  kyc_verified_at timestamptz,
  kyc_expires_at timestamptz,
  onboarding_step int2 NOT NULL DEFAULT 0
    CHECK (onboarding_step BETWEEN 0 AND 7),
  is_onboarded boolean NOT NULL DEFAULT false,
  -- DPDP Act 2023 compliance fields
  dpdp_consent_at timestamptz NOT NULL DEFAULT now(),
  dpdp_consent_ip inet NOT NULL DEFAULT '0.0.0.0',
  dpdp_consent_version text NOT NULL DEFAULT '1.0',
  data_deletion_requested_at timestamptz,
  -- Notification preferences
  notification_prefs jsonb NOT NULL DEFAULT
    '{"sip":true,"tax":true,"goal":true,"planning":true,"system":true,"email":true,"sms":false}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can only read their own row
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own row but cannot remove DPDP consent
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND dpdp_consent_at IS NOT NULL);

-- INSERT is blocked for clients — only service role (via Edge Function) creates users
-- No INSERT policy = blocked by default with RLS enabled

COMMENT ON TABLE public.users IS 'Financial identity layer extending auth.users — DPDP compliant';

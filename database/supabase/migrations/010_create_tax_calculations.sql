-- 010: Tax calculations — full audit trail, every recalculation stored
CREATE TABLE public.tax_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  financial_year text NOT NULL,
  version int4 NOT NULL DEFAULT 1,
  is_current boolean DEFAULT true,
  inputs_snapshot jsonb NOT NULL DEFAULT '{}',
  old_regime_result jsonb NOT NULL DEFAULT '{}',
  new_regime_result jsonb NOT NULL DEFAULT '{}',
  recommended_regime text NOT NULL
    CHECK (recommended_regime IN ('old','new')),
  savings_delta numeric(14,2) NOT NULL DEFAULT 0,
  deductions_detail jsonb NOT NULL DEFAULT '{}',
  tax_law_version text NOT NULL DEFAULT 'FY2025-26-v1',
  trigger_reason text DEFAULT 'initial'
    CHECK (trigger_reason IN ('initial','salary_update','law_change','manual','profile_update')),
  calculated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_taxcalc_user_fy ON public.tax_calculations(user_id, financial_year);
CREATE INDEX idx_taxcalc_current ON public.tax_calculations(user_id, financial_year, is_current)
  WHERE is_current = true;

-- RLS — select + insert own, no update/delete (immutable audit trail)
ALTER TABLE public.tax_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "taxcalc_select_own" ON public.tax_calculations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "taxcalc_insert_own" ON public.tax_calculations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- No UPDATE or DELETE policies = blocked

-- 012: Mutual fund master data — synced daily from AMFI
CREATE TABLE public.mf_funds (
  scheme_code text PRIMARY KEY,
  isin_growth text UNIQUE,
  scheme_name text NOT NULL,
  amc_name text NOT NULL,
  category text NOT NULL DEFAULT 'Other',
  sub_category text,
  nav numeric(12,4) NOT NULL DEFAULT 0,
  nav_date date,
  returns_1y numeric(8,4),
  returns_3y numeric(8,4),
  returns_5y numeric(8,4),
  risk_level text DEFAULT 'Moderate',
  min_sip_amount numeric(10,2) DEFAULT 500,
  min_lumpsum numeric(10,2) DEFAULT 1000,
  exit_load text DEFAULT '',
  is_elss boolean DEFAULT false,
  is_active boolean DEFAULT true,
  search_vector tsvector,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_mf_search ON public.mf_funds USING GIN(search_vector);
CREATE INDEX idx_mf_category ON public.mf_funds(category, is_active);
CREATE INDEX idx_mf_elss ON public.mf_funds(is_elss, is_active);

-- Public read for all authenticated users
ALTER TABLE public.mf_funds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mf_public_read" ON public.mf_funds
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- INSERT/UPDATE only via service role (AMFI sync Edge Function)
-- No INSERT/UPDATE policies for regular users

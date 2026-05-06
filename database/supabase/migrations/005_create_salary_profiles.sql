-- 005: Salary profiles — one active per user per FY
CREATE TABLE public.salary_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  financial_year text NOT NULL,
  annual_ctc numeric(14,2) NOT NULL CHECK (annual_ctc > 0),
  basic_salary numeric(14,2) DEFAULT 0,
  hra_monthly numeric(14,2) DEFAULT 0,
  lta_annual numeric(14,2) DEFAULT 0,
  special_allowance numeric(14,2) DEFAULT 0,
  other_allowances numeric(14,2) DEFAULT 0,
  variable_pay_pct numeric(5,2) DEFAULT 0,
  is_metro_city boolean DEFAULT false,
  city_name text DEFAULT '',
  monthly_rent numeric(14,2) DEFAULT 0,
  epf_employee_pct numeric(5,2) DEFAULT 12,
  epf_employer_pct numeric(5,2) DEFAULT 12,
  has_employer_nps boolean DEFAULT false,
  employer_nps_pct numeric(5,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, financial_year, is_active)
);

ALTER TABLE public.salary_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salary_own" ON public.salary_profiles
  FOR ALL USING (auth.uid() = user_id);

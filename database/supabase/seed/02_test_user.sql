-- Test user: Rahul Sharma — ₹18L CTC, Mumbai, renting, all profile data
-- Note: This seed requires an auth.users entry first. In dev, create via Supabase Dashboard.
-- The user_id below should match the auth.users entry.

-- To create a test auth user, run in Supabase SQL Editor:
-- INSERT INTO auth.users (id, email, phone, phone_confirmed_at, created_at, updated_at, instance_id, aud, role)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'rahul@test.moneyos.in', '+919876543210', now(), now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated');

DO $$
DECLARE
  test_uid uuid := '00000000-0000-0000-0000-000000000001';
  tc_id uuid;
BEGIN

-- Users row
INSERT INTO public.users (id, mobile_hash, full_name, dob, gender, kyc_status, kyc_verified_at, kyc_expires_at, onboarding_step, is_onboarded, dpdp_consent_at, dpdp_consent_ip, dpdp_consent_version)
VALUES (test_uid, 'e3b0c44298fc1c149afbf4c8996fb924sha256mock', 'Rahul Sharma', '1990-05-15', 'male', 'verified', now() - interval '30 days', now() + interval '5 years', 7, true, now() - interval '30 days', '192.168.1.1', '1.0')
ON CONFLICT (id) DO UPDATE SET full_name = 'Rahul Sharma';

-- Salary profile: ₹18L CTC, Mumbai
INSERT INTO public.salary_profiles (user_id, financial_year, annual_ctc, basic_salary, hra_monthly, lta_annual, special_allowance, other_allowances, variable_pay_pct, is_metro_city, city_name, monthly_rent, epf_employee_pct, epf_employer_pct, has_employer_nps, employer_nps_pct)
VALUES (test_uid, '2025-26', 1800000, 38825, 25000, 30000, 54000, 9600, 10, true, 'Mumbai', 25000, 12, 12, false, 0)
ON CONFLICT (user_id, financial_year, is_active) DO NOTHING;

-- Life situation: renting, no home loan, no senior parents
INSERT INTO public.life_situations (user_id, financial_year, is_renting, has_home_loan, home_loan_interest_annual, home_loan_principal_annual, dependent_children, has_senior_parents, self_health_premium, family_health_premium, parent_health_premium)
VALUES (test_uid, '2025-26', true, false, 0, 0, 0, false, 18000, 0, 0)
ON CONFLICT (user_id, financial_year) DO NOTHING;

-- Existing investments
INSERT INTO public.existing_investments (user_id, financial_year, ppf_annual, lic_premium_annual, elss_annual, nsc_annual, ssy_annual, tuition_fees, nps_employee_annual, other_80c_annual)
VALUES (test_uid, '2025-26', 0, 12000, 60000, 0, 0, 0, 0, 0)
ON CONFLICT (user_id, financial_year) DO NOTHING;

-- Financial goals
INSERT INTO public.financial_goals (user_id, goal_type, name, target_amount, target_year, current_savings, priority, monthly_sip_required) VALUES
(test_uid, 'retirement', 'Retirement Corpus', 50000000, 2050, 980000, 1, 24000),
(test_uid, 'emergency', 'Emergency Fund', 600000, 2026, 325000, 2, 12000),
(test_uid, 'home', 'Home Down Payment', 3000000, 2029, 640000, 3, 18500);

-- Risk assessment: moderate
INSERT INTO public.risk_assessments (user_id, score, profile, equity_pct, answers, is_current)
VALUES (test_uid, 55, 'moderate', 65, '[{"q":1,"a":"B","value":11},{"q":2,"a":"B","value":11},{"q":3,"a":"B","value":11},{"q":4,"a":"B","value":11},{"q":5,"a":"B","value":11}]'::jsonb, true);

-- Tax calculation
INSERT INTO public.tax_calculations (id, user_id, financial_year, inputs_snapshot, old_regime_result, new_regime_result, recommended_regime, savings_delta, deductions_detail, tax_law_version, trigger_reason)
VALUES (gen_random_uuid(), test_uid, '2025-26',
  '{"annualCTC":1800000}'::jsonb,
  '{"regime":"old","grossIncome":1800000,"totalDeductions":506550,"taxableIncome":1293450,"taxBeforeCess":178690,"cess":7148,"totalTax":185838,"monthlyTDS":15487}'::jsonb,
  '{"regime":"new","grossIncome":1800000,"totalDeductions":75000,"taxableIncome":1725000,"taxBeforeCess":211500,"cess":8460,"totalTax":219960,"monthlyTDS":18330}'::jsonb,
  'old', 34122,
  '{"section80C":92000,"section80D_self":18000,"hraExemption":232950,"section24b":0,"standardDeduction":50000}'::jsonb,
  'FY2025-26-v1', 'initial')
RETURNING id INTO tc_id;

-- Investment plan
INSERT INTO public.investment_plans (user_id, tax_calculation_id, financial_year, allocations, monthly_plan, total_annual_investment, projected_tax_saving, section_80c_used, section_80d_used, nps_used)
VALUES (test_uid, tc_id, '2025-26',
  '[{"instrument":"EPF","section":"80C","annualAmount":72000,"monthlyAmount":6000,"risk":"low","lockIn":0,"expectedReturn":8.1},{"instrument":"Axis ELSS Tax Saver Fund","section":"80C","annualAmount":60000,"monthlyAmount":5000,"risk":"high","lockIn":3,"expectedReturn":12.5},{"instrument":"Health Insurance","section":"80D","annualAmount":18000,"monthlyAmount":1500,"risk":"low","lockIn":1,"expectedReturn":0},{"instrument":"Parag Parikh Flexi Cap Fund","section":"Other","annualAmount":36000,"monthlyAmount":3000,"risk":"high","lockIn":0,"expectedReturn":13.0},{"instrument":"Bharat Bond FOF","section":"Other","annualAmount":36000,"monthlyAmount":3000,"risk":"low","lockIn":0,"expectedReturn":7.4}]'::jsonb,
  '[]'::jsonb, 222000, 34200, 92000, 18000, 0);

-- Holdings (mapped to seed funds)
INSERT INTO public.holdings (user_id, scheme_code, units, avg_nav, invested_amount, section) VALUES
(test_uid, '120503', 932.14, 70.72, 65930, '80C'),
(test_uid, '118825', 905.44, 94.95, 85950, 'Other'),
(test_uid, '122640', 743.82, 62.42, 46430, 'Other'),
(test_uid, '120505', 730.15, 173.56, 126700, 'Other'),
(test_uid, '130634', 2597.99, 23.09, 59990, 'Other');

-- SIP mandates
INSERT INTO public.sip_mandates (user_id, scheme_code, amount, frequency, sip_date, start_date, next_debit_date, status) VALUES
(test_uid, '120503', 5000, 'monthly', 5, '2025-05-05', '2026-05-05', 'active'),
(test_uid, '118825', 4000, 'monthly', 7, '2025-05-07', '2026-05-07', 'active'),
(test_uid, '122640', 3000, 'monthly', 10, '2025-05-10', '2026-05-10', 'active'),
(test_uid, '120505', 2500, 'monthly', 12, '2025-05-12', '2026-05-12', 'active'),
(test_uid, '130634', 3000, 'monthly', 18, '2025-05-18', '2026-05-18', 'active');

-- Sample transactions
INSERT INTO public.transactions (user_id, scheme_code, type, amount, units, nav, status, order_id, transacted_at) VALUES
(test_uid, '120503', 'SIP', 5000, 57.40, 87.11, 'allotted', 'ORD-ELSS-1', '2025-09-05'),
(test_uid, '120503', 'SIP', 5000, 57.90, 86.71, 'allotted', 'ORD-ELSS-2', '2025-10-05'),
(test_uid, '120503', 'SIP', 5000, 58.40, 86.31, 'allotted', 'ORD-ELSS-3', '2025-11-05'),
(test_uid, '118825', 'SIP', 4000, 35.80, 111.42, 'allotted', 'ORD-LC-1', '2025-09-05'),
(test_uid, '118825', 'SIP', 4000, 36.20, 111.22, 'allotted', 'ORD-LC-2', '2025-10-05'),
(test_uid, '122640', 'Lumpsum', 20000, 269.12, 74.31, 'allotted', 'ORD-PPFAS-1', '2025-06-15');

-- Notifications
INSERT INTO public.notifications (user_id, category, title, body, action_url, is_read, sent_via, created_at) VALUES
(test_uid, 'sip', 'SIP processed successfully', 'Your Axis ELSS SIP for ₹5,000 was allotted at NAV 86.12.', '/history', false, '{in_app}', now() - interval '2 hours'),
(test_uid, 'tax', '80C headroom available', 'You can invest ₹58,000 more before March 31 to maximize deductions.', '/plan/summary', false, '{in_app}', now() - interval '1 day'),
(test_uid, 'goal', 'Emergency fund at 54%', 'You crossed the halfway mark for your emergency fund target.', '/plan/goals', true, '{in_app}', now() - interval '2 days'),
(test_uid, 'planning', 'Salary hike? Update your plan', 'Update your salary structure to refresh your tax plan.', '/settings', true, '{in_app}', now() - interval '4 days'),
(test_uid, 'system', 'Budget update available', 'New slab changes are live. Recalculate your plan.', '/tax', true, '{in_app}', now() - interval '7 days');

END $$;

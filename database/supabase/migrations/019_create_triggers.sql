-- 019: Triggers — updated_at, version auto-increment, search vector

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER salary_updated_at
  BEFORE UPDATE ON public.salary_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER life_updated_at
  BEFORE UPDATE ON public.life_situations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER investments_updated_at
  BEFORE UPDATE ON public.existing_investments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER goals_updated_at
  BEFORE UPDATE ON public.financial_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER holdings_updated_at
  BEFORE UPDATE ON public.holdings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER sip_updated_at
  BEFORE UPDATE ON public.sip_mandates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Tax calculation version auto-increment
-- When a new tax_calculations row is inserted, set the old is_current=false
-- and auto-increment the version number
CREATE OR REPLACE FUNCTION increment_tax_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark previous current calculation as not current
  UPDATE public.tax_calculations
  SET is_current = false
  WHERE user_id = NEW.user_id
    AND financial_year = NEW.financial_year
    AND is_current = true
    AND id != NEW.id;

  -- Auto-increment version
  SELECT COALESCE(MAX(version), 0) + 1 INTO NEW.version
  FROM public.tax_calculations
  WHERE user_id = NEW.user_id
    AND financial_year = NEW.financial_year;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tax_version_increment
  BEFORE INSERT ON public.tax_calculations
  FOR EACH ROW EXECUTE FUNCTION increment_tax_version();

-- Investment plan version sync with tax calc
CREATE OR REPLACE FUNCTION increment_plan_version()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.investment_plans
  SET is_current = false
  WHERE user_id = NEW.user_id
    AND financial_year = NEW.financial_year
    AND is_current = true
    AND id != NEW.id;

  SELECT COALESCE(MAX(version), 0) + 1 INTO NEW.version
  FROM public.investment_plans
  WHERE user_id = NEW.user_id
    AND financial_year = NEW.financial_year;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER plan_version_increment
  BEFORE INSERT ON public.investment_plans
  FOR EACH ROW EXECUTE FUNCTION increment_plan_version();

-- MF funds search vector auto-update
CREATE OR REPLACE FUNCTION update_mf_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.scheme_name, '') || ' ' ||
    COALESCE(NEW.amc_name, '') || ' ' ||
    COALESCE(NEW.category, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mf_search_vector_update
  BEFORE INSERT OR UPDATE ON public.mf_funds
  FOR EACH ROW EXECUTE FUNCTION update_mf_search_vector();

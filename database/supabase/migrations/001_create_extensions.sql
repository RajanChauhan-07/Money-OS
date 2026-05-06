-- 001: Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
-- pg_net and pg_cron are pre-installed on Supabase hosted
-- CREATE EXTENSION IF NOT EXISTS "pg_net";
-- CREATE EXTENSION IF NOT EXISTS "pg_cron";

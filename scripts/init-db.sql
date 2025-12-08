-- ===========================================
-- LMS PERÚ - Database Initialization Script
-- ===========================================
-- This script runs when PostgreSQL container starts
-- for the first time.
-- ===========================================

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas for multi-tenant isolation (optional)
-- CREATE SCHEMA IF NOT EXISTS tenant_template;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE lms_peru TO postgres;

-- Log success
DO $$
BEGIN
  RAISE NOTICE 'LMS Peru database initialized successfully!';
END $$;

-- ============================================================================
-- Drop base tables (run with caution in production)
-- Note: tenants table is NOT dropped as it's part of ERP core
-- ============================================================================

DROP TABLE IF EXISTS backups CASCADE;
DROP TABLE IF EXISTS schema_migrations CASCADE;

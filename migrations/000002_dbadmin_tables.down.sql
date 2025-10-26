-- ============================================================================
-- DBAdmin Module - Rollback Migration
-- Migration: 001_dbadmin_tables.down.sql
-- ============================================================================

-- Drop triggers and functions
DROP TRIGGER IF EXISTS trigger_update_alert_email_config_updated_at ON alert_email_config;
DROP FUNCTION IF EXISTS update_alert_email_config_updated_at();
DROP FUNCTION IF EXISTS cleanup_expired_sessions();

-- Drop views
DROP VIEW IF EXISTS recent_failed_actions;

-- Drop tables (order matters due to foreign key constraints)
DROP TABLE IF EXISTS alert_config_audit;
DROP TABLE IF EXISTS alert_email_config;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS user_backup_codes;
DROP TABLE IF EXISTS user_mfa_secrets;
DROP TABLE IF EXISTS mfa_policies;
DROP TABLE IF EXISTS audit_logs;

-- Note: Indexes on existing tables (tenants, backups, etc.) are not dropped
-- as they may be used by other parts of the system. If you need to drop them:
-- DROP INDEX IF EXISTS idx_tenants_subscription_plan;
-- DROP INDEX IF EXISTS idx_tenants_created_at;
-- etc.

-- ============================================================================
-- DBAdmin Module - Consolidated Migration
-- Combines: MFA tables, performance indexes, audit logging, sessions, alerts
-- Migration: 001_dbadmin_tables.up.sql
-- ============================================================================

-- ============================================================================
-- MFA (Multi-Factor Authentication) Support
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_mfa_secrets (
    user_id UUID PRIMARY KEY,
    secret VARCHAR(255) NOT NULL,
    enabled BOOLEAN DEFAULT false,
    backup_codes_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    enabled_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_backup_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    used BOOLEAN DEFAULT false,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mfa_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name VARCHAR(100) NOT NULL UNIQUE,
    mfa_required BOOLEAN DEFAULT false,
    grace_period_days INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO mfa_policies (role_name, mfa_required, grace_period_days) 
VALUES 
    ('super_admin', true, 0),
    ('admin', true, 7),
    ('operator', false, 0),
    ('viewer', false, 0)
ON CONFLICT (role_name) DO NOTHING;

-- ============================================================================
-- Performance Optimization Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tenants_subscription_plan ON tenants(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_tenants_created_at ON tenants(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tenants_status_plan ON tenants(subscription_status, subscription_plan);
CREATE INDEX IF NOT EXISTS idx_tenants_industry ON tenants(industry);

CREATE INDEX IF NOT EXISTS idx_backups_tenant_id ON backups(tenant_id);
CREATE INDEX IF NOT EXISTS idx_backups_status ON backups(status);
CREATE INDEX IF NOT EXISTS idx_backups_backup_type ON backups(backup_type);
CREATE INDEX IF NOT EXISTS idx_backups_created_at ON backups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backups_status_created ON backups(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_migrations_applied_at ON schema_migrations(applied_at DESC);

CREATE INDEX IF NOT EXISTS idx_tenants_subscription_active 
    ON tenants(created_at DESC) 
    WHERE subscription_status = 'active';

CREATE INDEX IF NOT EXISTS idx_tenants_trial 
    ON tenants(created_at DESC) 
    WHERE subscription_plan = 'trial';

CREATE INDEX IF NOT EXISTS idx_backups_completed 
    ON backups(created_at DESC) 
    WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_backups_in_progress 
    ON backups(created_at DESC) 
    WHERE status = 'in_progress';

CREATE INDEX IF NOT EXISTS idx_backups_failed 
    ON backups(created_at DESC) 
    WHERE status = 'failed';

-- ============================================================================
-- Enhanced Audit Logging
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    tenant_id UUID,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    error TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_failed ON audit_logs(created_at DESC) WHERE success = false;

CREATE OR REPLACE VIEW recent_failed_actions AS
SELECT 
    id,
    user_id,
    action,
    resource,
    resource_id,
    error,
    ip_address,
    created_at
FROM audit_logs
WHERE success = false
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- ============================================================================
-- User Sessions Management
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT false,
    revoked_at TIMESTAMP,
    revoked_reason VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(user_id, last_active_at DESC) 
    WHERE NOT revoked;

CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM user_sessions 
    WHERE expires_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Alert Email Configuration
-- ============================================================================

CREATE TABLE IF NOT EXISTS alert_email_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    alert_types TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    CONSTRAINT alert_email_config_email_valid CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_alert_email_config_active ON alert_email_config(is_active);
CREATE INDEX idx_alert_email_config_email ON alert_email_config(email);
CREATE INDEX idx_alert_email_config_alert_types ON alert_email_config USING GIN(alert_types);

CREATE TABLE IF NOT EXISTS alert_config_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_email_config_id UUID REFERENCES alert_email_config(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alert_config_audit_config_id ON alert_config_audit(alert_email_config_id);
CREATE INDEX idx_alert_config_audit_changed_by ON alert_config_audit(changed_by);
CREATE INDEX idx_alert_config_audit_created_at ON alert_config_audit(created_at DESC);

CREATE OR REPLACE FUNCTION update_alert_email_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_alert_email_config_updated_at
    BEFORE UPDATE ON alert_email_config
    FOR EACH ROW
    EXECUTE FUNCTION update_alert_email_config_updated_at();

-- ============================================================================
-- Add MFA-related indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_backup_codes_user_id ON user_backup_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_backup_codes_used ON user_backup_codes(used) WHERE NOT used;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE user_mfa_secrets IS 'Stores TOTP secrets for multi-factor authentication';
COMMENT ON TABLE user_backup_codes IS 'Backup recovery codes for MFA';
COMMENT ON TABLE mfa_policies IS 'MFA enforcement policies per role';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all system actions';
COMMENT ON TABLE user_sessions IS 'Active user sessions with automatic expiry';
COMMENT ON TABLE alert_email_config IS 'Stores email addresses that should receive system alerts';
COMMENT ON TABLE alert_config_audit IS 'Audit log for changes to alert email configurations';

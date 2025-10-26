-- ============================================================================
-- DBAdmin Module - Base Tables Migration
-- Creates required base tables for dbadmin module to work
-- ============================================================================

-- Track database migrations (hybrid schema supporting both systems)
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    execution_time_ms INTEGER,
    checksum VARCHAR(64),
    applied_by VARCHAR(255) DEFAULT 'system',
    dirty BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied_at ON schema_migrations(applied_at DESC);

-- Database backups table (matches dbadmin schema)
-- Note: tenants table already exists in ERP core migrations
CREATE TABLE IF NOT EXISTS backups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    backup_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    compressed BOOLEAN NOT NULL DEFAULT false,
    encrypted BOOLEAN NOT NULL DEFAULT false,
    storage_providers TEXT[] NOT NULL DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_backup_type CHECK (backup_type IN ('full', 'tenant')),
    CONSTRAINT chk_backup_status CHECK (status IN ('pending', 'in_progress', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_backups_tenant ON backups(tenant_id);
CREATE INDEX IF NOT EXISTS idx_backups_type ON backups(backup_type);
CREATE INDEX IF NOT EXISTS idx_backups_status ON backups(status);
CREATE INDEX IF NOT EXISTS idx_backups_created ON backups(created_at DESC);

COMMENT ON TABLE schema_migrations IS 'Tracks database migration history';
COMMENT ON TABLE backups IS 'Database backup records';

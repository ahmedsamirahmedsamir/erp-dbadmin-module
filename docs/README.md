# DBAdmin ERP Module

Database Administration module for the LinearBits ERP system. Provides comprehensive database management capabilities including backups, migrations, database browsing, and audit logging.

## Features

### 🔄 Database Backups
- Create automatic and manual database backups
- Support for multiple storage backends (Local, S3, Linode Object Storage, Cloudflare R2)
- Backup compression and encryption
- Scheduled backup automation
- Backup restoration with rollback support

### 🚀 Migration Management
- Apply database migrations
- Rollback migrations
- Track migration status
- Automatic backup before migration
- Validation of migration files

### 👁️ Database Browser
- Browse all database tables
- View table data with pagination
- View table schemas and indexes
- Query database structure
- Export table data

### 📋 Audit Logging
- Comprehensive audit trail of all actions
- Filter audit logs by user, action, resource
- Export audit logs
- Real-time monitoring of failed actions
- Audit statistics and analytics

### 🏢 Tenant Management
- Create and manage database tenants
- Suspend and activate tenants
- Monitor tenant status
- Multi-tenant isolation

## Installation

### Prerequisites
- ERP Backend running
- PostgreSQL database
- (Optional) Redis for caching
- (Optional) Storage backend configured (S3, Linode, Cloudflare)

### Install Module

1. Place the module in your workspace root:
```bash
# The module directory should be: erp-dbadmin-module/
```

2. The ERP system will automatically detect and load the module on startup.

3. Install the module for a tenant:
```bash
# Via API
curl -X POST http://localhost:8080/api/v1/modules/dbadmin/install \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-ID: YOUR_TENANT_ID"
```

## Configuration

Add the following environment variables to your ERP backend configuration:

```bash
# Storage Configuration
STORAGE_LOCAL_ENABLED=true
STORAGE_LOCAL_PATH=/path/to/backups

# Optional: AWS S3
STORAGE_S3_ENABLED=false
STORAGE_S3_BUCKET=your-backup-bucket
STORAGE_S3_REGION=us-east-1

# Optional: Linode Object Storage
STORAGE_LINODE_ENABLED=false
STORAGE_LINODE_BUCKET=your-backup-bucket
STORAGE_LINODE_REGION=us-east-1

# Optional: Cloudflare R2
STORAGE_CLOUDFLARE_ENABLED=false
STORAGE_CLOUDFLARE_BUCKET=your-backup-bucket
STORAGE_CLOUDFLARE_ACCOUNT_ID=your-account-id

# Backup Configuration
BACKUP_RETENTION_DAYS=30
BACKUP_COMPRESSION=true

# Encryption (required for encrypted backups)
ENCRYPTION_KEY=your-32-byte-encryption-key

# Email Alerts (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-app-password
ALERT_EMAILS=admin@example.com,ops@example.com

# Audit Configuration
AUDIT_RETENTION_DAYS=90
```

## API Endpoints

### Backups

```bash
# List all backups
GET /api/v1/dbadmin/backups

# Create a new backup
POST /api/v1/dbadmin/backups
{
  "backup_type": "full",
  "description": "Weekly backup"
}

# Get backup details
GET /api/v1/dbadmin/backups/{id}

# Download backup
GET /api/v1/dbadmin/backups/{id}/download

# Restore from backup
POST /api/v1/dbadmin/backups/{id}/restore

# Delete backup
DELETE /api/v1/dbadmin/backups/{id}
```

### Migrations

```bash
# Get migration status
GET /api/v1/dbadmin/migrations/status

# Apply pending migrations
POST /api/v1/dbadmin/migrations/apply

# Rollback last migration
POST /api/v1/dbadmin/migrations/rollback
```

### Database Browser

```bash
# List all tables
GET /api/v1/dbadmin/database/tables

# Get table data
GET /api/v1/dbadmin/database/tables/{name}?page=1&page_size=50

# Get table schema
GET /api/v1/dbadmin/database/tables/{name}/schema
```

### Audit Logs

```bash
# List audit logs
GET /api/v1/dbadmin/audit-logs?user_id=xxx&action=login&limit=100

# Get audit stats
GET /api/v1/dbadmin/audit-logs/stats

# Get recent failed actions
GET /api/v1/dbadmin/audit-logs/recent-failed

# Export audit logs
GET /api/v1/dbadmin/audit-logs/export?format=csv
```

### Tenants

```bash
# List all tenants
GET /api/v1/dbadmin/tenants

# Create tenant
POST /api/v1/dbadmin/tenants
{
  "tenant_code": "acme-corp",
  "company_name": "ACME Corporation",
  "subscription_plan": "enterprise"
}

# Get tenant
GET /api/v1/dbadmin/tenants/{id}

# Update tenant
PATCH /api/v1/dbadmin/tenants/{id}

# Suspend tenant
POST /api/v1/dbadmin/tenants/{id}/suspend

# Activate tenant
POST /api/v1/dbadmin/tenants/{id}/activate
```

## Permissions

The module defines the following permissions:

- `dbadmin.backups.view` - View backups
- `dbadmin.backups.create` - Create backups
- `dbadmin.backups.restore` - Restore backups
- `dbadmin.backups.delete` - Delete backups
- `dbadmin.migrations.view` - View migration status
- `dbadmin.migrations.apply` - Apply migrations
- `dbadmin.migrations.rollback` - Rollback migrations
- `dbadmin.database.view` - View database
- `dbadmin.database.browse` - Browse tables
- `dbadmin.audit.view` - View audit logs
- `dbadmin.audit.export` - Export audit logs
- `dbadmin.tenants.view` - View tenants
- `dbadmin.tenants.create` - Create tenants
- `dbadmin.tenants.edit` - Edit tenants
- `dbadmin.tenants.manage` - Manage tenant status

## Frontend Routes

Access the module features through the following routes:

- `/dbadmin` - Dashboard
- `/dbadmin/backups` - Backup management
- `/dbadmin/migrations` - Migration management  
- `/dbadmin/database` - Database browser
- `/dbadmin/audit-logs` - Audit logs viewer
- `/dbadmin/tenants` - Tenant management

## Architecture

This module wraps the dbadmin standalone application and integrates it with the ERP system:

- **Authentication**: Uses ERP's JWT authentication
- **Multi-tenancy**: Fully tenant-aware, all operations are scoped to the current tenant
- **Database**: Uses ERP's PostgreSQL database
- **Storage**: Backups stored using configured storage backends
- **Audit**: All actions logged to audit_logs table

## Security

- All operations are tenant-scoped for multi-tenant security
- Audit logging tracks all administrative actions
- Backup encryption support with encryption key
- Role-based permissions control access
- Session management with automatic expiry

## Development

### Module Structure

```
erp-dbadmin-module/
├── module.yml          # Module manifest
├── handlers/           # Go handlers (wraps dbadmin services)
├── migrations/         # Database migrations
├── components/         # React components
└── README.md          # This file
```

### Integration with DBAdmin

The module references the original dbadmin codebase (located at `/dbadmin/`) without modifying it:

- Handlers reference dbadmin services
- Migrations come from dbadmin
- Services are imported from dbadmin packages

## Troubleshooting

### Backups not working
- Check storage backend configuration
- Verify storage path permissions
- Check backup retention settings

### Migrations failing
- Verify migration files exist
- Check database permissions
- Review migration logs

### Audit logs not showing
- Check `audit_logs` table exists
- Verify audit logging is enabled in settings
- Check retention period

## License

MIT License - Part of the LinearBits ERP system

## Support

For issues and feature requests, please use the ERP system's support channels.

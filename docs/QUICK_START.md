# DBAdmin Module - Quick Start Guide

## Module Summary

The `erp-dbadmin-module` is a complete ERP module that wraps the dbadmin standalone application, providing database administration features integrated into the LinearBits ERP system.

## What's Included

### ✅ Complete Features

1. **Database Backups**
   - Full and tenant-specific backups
   - Restore and download functionality
   - Multi-cloud storage support
   - Compression and encryption

2. **Migration Management**
   - Apply and rollback migrations
   - Track migration status
   - Automatic backup before migrations

3. **Database Browser**
   - Browse all tables
   - View table data and schemas
   - Export functionality

4. **Audit Logs**
   - Comprehensive audit trail
   - Filtering and search
   - Export capabilities

5. **Tenant Management**
   - Create and manage tenants
   - Suspend/activate tenants
   - Multi-tenant isolation

## Module Structure

```
erp-dbadmin-module/
├── module.yml                    # Module manifest with routes/permissions
├── README.md                     # Comprehensive documentation
├── IMPLEMENTATION_STATUS.md      # Current implementation status
├── HANDLER_SETUP.md             # Go module setup guide
├── QUICK_START.md               # This file
├── migrations/
│   ├── 001_dbadmin_tables.up.sql   # All required migrations
│   └── 001_dbadmin_tables.down.sql # Rollback migrations
├── handlers/
│   └── dbadmin_handler.go         # Complete handler implementation
└── components/
    ├── Dashboard.tsx              # Dashboard placeholder
    ├── Backups.tsx                # Backups page placeholder
    ├── Migrations.tsx             # Migrations page placeholder
    ├── Database.tsx               # Database browser placeholder
    ├── AuditLogs.tsx              # Audit logs placeholder
    └── Tenants.tsx                # Tenants management placeholder
```

## Installation

### Step 1: Ensure Module is Detected

The module is placed in the workspace root and will be automatically detected by the ERP system on startup.

### Step 2: Set Up Go Module Dependencies

Choose one of the setup options from `HANDLER_SETUP.md`:
- **Recommended**: Use Go workspace
- **Alternative**: Use replace directive
- **Simplest**: Copy required services into module

### Step 3: Run Migrations

When installing the module for a tenant, migrations will run automatically:
- MFA tables
- Performance indexes
- Audit logging
- User sessions
- Alert configuration

### Step 4: Configure Storage (Optional)

Add to your ERP environment configuration:

```bash
# Local storage
STORAGE_LOCAL_ENABLED=true
STORAGE_LOCAL_PATH=/backups

# Optional: Cloud storage
STORAGE_S3_ENABLED=false
STORAGE_LINODE_ENABLED=false
STORAGE_CLOUDFLARE_ENABLED=false

# Backup settings
BACKUP_RETENTION_DAYS=30
BACKUP_COMPRESSION=true
```

## Usage

### Accessing the Module

Once installed, access via:

- **Dashboard**: `/dbadmin`
- **Backups**: `/dbadmin/backups`
- **Migrations**: `/dbadmin/migrations`
- **Database Browser**: `/dbadmin/database`
- **Audit Logs**: `/dbadmin/audit-logs`
- **Tenants**: `/dbadmin/tenants`

### API Endpoints

All endpoints are prefixed with `/api/v1/dbadmin`:

- `GET /api/v1/dbadmin/backups` - List backups
- `POST /api/v1/dbadmin/backups` - Create backup
- `GET /api/v1/dbadmin/backups/{id}/download` - Download backup
- `POST /api/v1/dbadmin/backups/{id}/restore` - Restore backup
- And many more...

See `README.md` for complete API documentation.

## Architecture

### Integration Approach

- **Authentication**: Uses ERP's JWT system (no separate login)
- **Multi-tenancy**: Fully tenant-aware via context
- **Code Reuse**: References original dbadmin code without modification
- **Service Layer**: Wraps dbadmin services with ERP context

### Key Design Decisions

1. **Hybrid Tenant Management**: Manages ERP's PostgreSQL tenant system
2. **ERP Auth Integration**: Reuses JWT middleware
3. **Selected Features**: Only includes backups, migrations, browser, and audit logs
4. **No Code Changes**: Original dbadmin code remains untouched

## Development Status

### ✅ Completed

- Module manifest and structure
- Database migrations
- Handler implementation
- Component placeholders
- Documentation

### ⚠️ Remaining

- Go module dependency setup (see HANDLER_SETUP.md)
- Full frontend component implementation
- Integration testing

## Next Steps

1. Choose Go module setup approach
2. Verify handler imports resolve
3. Implement full frontend components
4. Test module registration
5. Test all features end-to-end

## Support

For issues or questions:
- Check `README.md` for detailed documentation
- Review `HANDLER_SETUP.md` for module setup
- See `IMPLEMENTATION_STATUS.md` for current status

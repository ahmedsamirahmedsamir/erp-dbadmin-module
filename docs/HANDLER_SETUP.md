# DBAdmin Module Handler Setup Guide

## Overview

The `handlers/dbadmin_handler.go` file provides a complete implementation wrapping dbadmin services for ERP integration. However, it requires proper Go module configuration to resolve imports.

## Current Issue

The handler imports from multiple packages that need proper resolution:
- `erp-backend/internal/api/middleware/auth` (ERP auth middleware)
- `github.com/linearbits/dbadmin/...` (dbadmin services)

## Setup Options

### Option 1: Use Go Workspace (Recommended)

Create a `go.work` file in the workspace root:

```go
go 1.23

use (
    ./erp/backend
    ./dbadmin
    ./erp-dbadmin-module
)
```

This allows all modules to reference each other seamlessly.

### Option 2: Use Replace Directive

In the ERP backend's `go.mod`, add:

```go
replace github.com/linearbits/dbadmin => ../dbadmin

module erp-backend
```

And set up the module to import dbadmin packages directly.

### Option 3: Copy Required Services

If workspace/replace directives don't work, copy the necessary dbadmin service files into this module and adapt imports.

## Handler Structure

The handler follows the same pattern as `erp-inventory-module/handlers/inventory_handler.go`:

1. **Package**: `package handlers`
2. **Imports**: References both ERP and dbadmin packages
3. **Structure**: Unified handler with all endpoint methods
4. **Auth Integration**: Uses ERP's JWT middleware via `erpauth.GetTenantIDFromContext()`

## Registration

The handler will be registered by the ERP module system when:
- Module manifest (`module.yml`) is loaded
- Handler package is found
- Routes are registered by the module registry

## Required Packages

The handler imports and uses:
- `github.com/go-chi/chi/v5` - Router
- `github.com/jmoiron/sqlx` - Database
- `github.com/google/uuid` - UUID handling
- `go.uber.org/zap` - Logging
- `github.com/linearbits/dbadmin/...` - All dbadmin services

## Next Steps

1. Set up Go workspace or module replacement
2. Run `go mod tidy` in the module directory
3. Verify imports resolve correctly
4. Test handler initialization

## Alternative: Simplified Handler

If setup is complex, a simpler approach is to:
1. Copy only the dbadmin services needed into the module
2. Remove dependencies on `github.com/linearbits/dbadmin`
3. Use direct database queries instead of service layer

This increases code duplication but simplifies module setup.

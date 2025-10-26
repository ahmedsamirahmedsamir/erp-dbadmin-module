# Workspace Setup Guide

This guide explains how to set up the Go workspace to properly reference both the dbadmin module and ERP backend.

## Problem

The `erp-dbadmin-module` needs to import packages from:
1. `github.com/linearbits/dbadmin` (dbadmin code)
2. `erp-backend/internal/api/middleware/auth` (ERP auth middleware)

## Solution: Create Go Workspace

The best approach is to use a Go workspace (go.work).

### Step 1: Create go.work File

Create a `go.work` file in the workspace root (`/Users/ahmedsamir/ai-workspace/linearbits-erp/`):

```go
go 1.23.0

use (
    ./erp/backend
    ./dbadmin
    ./erp-dbadmin-module
)
```

### Step 2: Initialize Workspace

Run from workspace root:

```bash
cd /Users/ahmedsamir/ai-workspace/linearbits-erp
go work init ./erp/backend ./dbadmin ./erp-dbadmin-module
```

This creates the `go.work` file automatically.

### Step 3: Update Module Imports

The module's `go.mod` should reference dbadmin via replace directive (already done):

```go
replace github.com/linearbits/dbadmin => ../dbadmin
```

### Step 4: Import ERP Backend

In the handler (`handlers/dbadmin_handler.go`), import ERP auth:

```go
import (
    // ... other imports
    "erp-backend/internal/api/middleware/auth"
)
```

Then run:

```bash
cd erp-dbadmin-module
go mod tidy
```

## Alternative: Use GOPATH

If workspace doesn't work, use GOPATH:

```bash
export GOPATH=/Users/ahmedsamir/ai-workspace/linearbits-erp
```

Then modules can reference each other directly.

## Verify Setup

Test imports work:

```bash
cd erp-dbadmin-module
go build ./handlers/...
```

If successful, imports are resolved correctly.

## Troubleshooting

### Error: cannot find package

**Solution**: Ensure `go.work` includes all three directories (erp/backend, dbadmin, erp-dbadmin-module)

### Error: ambiguous import

**Solution**: Use full import path for conflicting packages

### Module not found

**Solution**: Run `go mod tidy` in the module directory and verify `replace` directive in `go.mod`

## Next Steps

Once imports resolve:
1. Test handler compilation
2. Test module registration in ERP
3. Test API endpoints

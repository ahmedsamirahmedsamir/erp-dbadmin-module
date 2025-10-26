module github.com/linearbits/erp-dbadmin-module

go 1.21

require (
	github.com/go-chi/chi/v5 v5.2.3
	github.com/jmoiron/sqlx v1.3.5
	github.com/linearbits/erp-backend/pkg/module-sdk v0.0.0
	go.uber.org/zap v1.26.0
)

require go.uber.org/multierr v1.10.0 // indirect

replace github.com/linearbits/erp-backend/pkg/module-sdk => ../erp/backend/pkg/module-sdk

package main

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/jmoiron/sqlx"
	sdk "github.com/linearbits/erp-backend/pkg/module-sdk"
	"go.uber.org/zap"
)

// DBAdminPlugin implements the ModulePlugin interface
type DBAdminPlugin struct {
	db      *sqlx.DB
	logger  *zap.Logger
	handler *DBAdminHandler
}

// NewDBAdminPlugin creates a new plugin instance
func NewDBAdminPlugin() sdk.ModulePlugin {
	return &DBAdminPlugin{}
}

// Initialize initializes the plugin
func (p *DBAdminPlugin) Initialize(db *sqlx.DB, logger *zap.Logger) error {
	p.db = db
	p.logger = logger
	p.handler = NewDBAdminHandler(db, logger)
	p.logger.Info("DBAdmin module initialized")
	return nil
}

// GetModuleCode returns the module code
func (p *DBAdminPlugin) GetModuleCode() string {
	return "dbadmin"
}

// GetModuleVersion returns the module version
func (p *DBAdminPlugin) GetModuleVersion() string {
	return "1.0.0"
}

// Cleanup performs cleanup
func (p *DBAdminPlugin) Cleanup() error {
	p.logger.Info("Cleaning up dbadmin module")
	return nil
}

// GetHandler returns a handler function for a given route and method
func (p *DBAdminPlugin) GetHandler(route string, method string) (http.HandlerFunc, error) {
	route = strings.TrimPrefix(route, "/")
	method = strings.ToUpper(method)

	handlers := map[string]http.HandlerFunc{
		"GET /tables": p.handler.GetTables,
		"POST /query": p.handler.ExecuteQuery,
		"GET /stats":  p.handler.GetDatabaseStats,
	}

	key := method + " " + route
	if handler, ok := handlers[key]; ok {
		return handler, nil
	}

	return nil, fmt.Errorf("handler not found for route: %s %s", method, route)
}

// Handler is the exported symbol
var Handler = NewDBAdminPlugin

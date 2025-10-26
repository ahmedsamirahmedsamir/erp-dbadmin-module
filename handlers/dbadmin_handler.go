package main

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jmoiron/sqlx"
	"go.uber.org/zap"
)

// DBAdminHandler wraps all dbadmin handlers
type DBAdminHandler struct {
	db     *sqlx.DB
	logger *zap.Logger
}

// NewDBAdminHandler creates a new DBAdmin handler
func NewDBAdminHandler(db *sqlx.DB, logger *zap.Logger) *DBAdminHandler {
	return &DBAdminHandler{
		db:     db,
		logger: logger,
	}
}

// Helper: Respond with JSON
func (h *DBAdminHandler) respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// Helper: Respond with error
func (h *DBAdminHandler) respondError(w http.ResponseWriter, status int, message string) {
	h.respondJSON(w, status, map[string]string{"error": message})
}

// Placeholder methods - these will be implemented with direct database calls

// Backups
func (h *DBAdminHandler) CreateBackup(w http.ResponseWriter, r *http.Request) {
	h.respondJSON(w, http.StatusOK, map[string]string{"message": "Backup creation - implementation pending"})
}

func (h *DBAdminHandler) ListBackups(w http.ResponseWriter, r *http.Request) {
	h.respondJSON(w, http.StatusOK, map[string]interface{}{"backups": []interface{}{}, "count": 0})
}

func (h *DBAdminHandler) GetBackup(w http.ResponseWriter, r *http.Request) {
	h.respondJSON(w, http.StatusOK, map[string]string{"message": "Backup details - implementation pending"})
}

// Migrations
func (h *DBAdminHandler) GetMigrationStatus(w http.ResponseWriter, r *http.Request) {
	h.respondJSON(w, http.StatusOK, map[string]string{"message": "Migration status - implementation pending"})
}

func (h *DBAdminHandler) ApplyMigration(w http.ResponseWriter, r *http.Request) {
	h.respondJSON(w, http.StatusOK, map[string]string{"message": "Apply migration - implementation pending"})
}

func (h *DBAdminHandler) RollbackMigration(w http.ResponseWriter, r *http.Request) {
	h.respondJSON(w, http.StatusOK, map[string]string{"message": "Rollback migration - implementation pending"})
}

// Database Browser
func (h *DBAdminHandler) GetTables(w http.ResponseWriter, r *http.Request) {
	// Query database for tables
	rows, err := h.db.Query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name")
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	var tables []string
	for rows.Next() {
		var table string
		if err := rows.Scan(&table); err == nil {
			tables = append(tables, table)
		}
	}

	h.respondJSON(w, http.StatusOK, map[string]interface{}{
		"tables": tables,
		"count":  len(tables),
	})
}

func (h *DBAdminHandler) GetTableData(w http.ResponseWriter, r *http.Request) {
	tableName := chi.URLParam(r, "name")
	h.respondJSON(w, http.StatusOK, map[string]string{"message": "Table data - implementation pending", "table": tableName})
}

func (h *DBAdminHandler) GetTableSchema(w http.ResponseWriter, r *http.Request) {
	tableName := chi.URLParam(r, "name")
	h.respondJSON(w, http.StatusOK, map[string]string{"message": "Table schema - implementation pending", "table": tableName})
}

// Audit Logs
func (h *DBAdminHandler) ListAuditLogs(w http.ResponseWriter, r *http.Request) {
	var logs []interface{}
	var count int
	err := h.db.QueryRow("SELECT COUNT(*) FROM audit_logs").Scan(&count)
	if err != nil {
		count = 0
	}

	h.respondJSON(w, http.StatusOK, map[string]interface{}{
		"logs":  logs,
		"count": count,
	})
}

func (h *DBAdminHandler) GetAuditStats(w http.ResponseWriter, r *http.Request) {
	h.respondJSON(w, http.StatusOK, map[string]string{"message": "Audit stats - implementation pending"})
}

// Tenants
func (h *DBAdminHandler) ListTenants(w http.ResponseWriter, r *http.Request) {
	var tenants []interface{}
	h.respondJSON(w, http.StatusOK, map[string]interface{}{
		"tenants": tenants,
		"count":   len(tenants),
	})
}

func (h *DBAdminHandler) CreateTenant(w http.ResponseWriter, r *http.Request) {
	h.respondJSON(w, http.StatusCreated, map[string]string{"message": "Create tenant - implementation pending"})
}

func (h *DBAdminHandler) GetTenant(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.respondJSON(w, http.StatusOK, map[string]string{"message": "Tenant details - implementation pending", "id": id})
}

func (h *DBAdminHandler) UpdateTenant(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.respondJSON(w, http.StatusOK, map[string]string{"message": "Update tenant - implementation pending", "id": id})
}

func (h *DBAdminHandler) DeleteTenant(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	h.respondJSON(w, http.StatusOK, map[string]string{"message": "Delete tenant - implementation pending", "id": id})
}

// ExecuteQuery executes a custom SQL query (admin only)
func (h *DBAdminHandler) ExecuteQuery(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Query string `json:"query"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Query == "" {
		h.respondError(w, http.StatusBadRequest, "Query is required")
		return
	}

	// Execute query
	rows, err := h.db.Query(req.Query)
	if err != nil {
		h.logger.Error("Failed to execute query", zap.Error(err))
		h.respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	// Get column names
	columns, err := rows.Columns()
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Read rows
	var results []map[string]interface{}
	for rows.Next() {
		// Create a slice of interface{}'s to represent each column
		values := make([]interface{}, len(columns))
		valuePtrs := make([]interface{}, len(columns))
		for i := range columns {
			valuePtrs[i] = &values[i]
		}

		if err := rows.Scan(valuePtrs...); err != nil {
			h.logger.Error("Failed to scan row", zap.Error(err))
			continue
		}

		// Create map for this row
		rowMap := make(map[string]interface{})
		for i, col := range columns {
			val := values[i]
			// Handle byte arrays
			if b, ok := val.([]byte); ok {
				rowMap[col] = string(b)
			} else {
				rowMap[col] = val
			}
		}
		results = append(results, rowMap)
	}

	h.respondJSON(w, http.StatusOK, map[string]interface{}{
		"columns": columns,
		"rows":    results,
		"count":   len(results),
	})
}

// GetDatabaseStats retrieves comprehensive database statistics
func (h *DBAdminHandler) GetDatabaseStats(w http.ResponseWriter, r *http.Request) {
	type DatabaseStats struct {
		DatabaseName    string    `json:"database_name"`
		DatabaseSize    string    `json:"database_size"`
		TableCount      int       `json:"table_count"`
		ConnectionCount int       `json:"connection_count"`
		GeneratedAt     time.Time `json:"generated_at"`
	}

	var stats DatabaseStats
	stats.GeneratedAt = time.Now()

	// Get database name
	err := h.db.QueryRow("SELECT current_database()").Scan(&stats.DatabaseName)
	if err != nil {
		h.logger.Error("Failed to get database name", zap.Error(err))
		stats.DatabaseName = "unknown"
	}

	// Get database size
	err = h.db.QueryRow("SELECT pg_size_pretty(pg_database_size(current_database()))").Scan(&stats.DatabaseSize)
	if err != nil {
		h.logger.Error("Failed to get database size", zap.Error(err))
		stats.DatabaseSize = "0 MB"
	}

	// Get table count
	err = h.db.QueryRow("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'").Scan(&stats.TableCount)
	if err != nil {
		h.logger.Error("Failed to get table count", zap.Error(err))
		stats.TableCount = 0
	}

	// Get active connections
	err = h.db.QueryRow("SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active'").Scan(&stats.ConnectionCount)
	if err != nil {
		h.logger.Error("Failed to get connection count", zap.Error(err))
		stats.ConnectionCount = 0
	}

	h.respondJSON(w, http.StatusOK, stats)
}

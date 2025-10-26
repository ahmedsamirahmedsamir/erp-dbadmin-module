package main

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/jmoiron/sqlx"
	sdk "github.com/linearbits/erp-backend/pkg/module-sdk"
	"go.uber.org/zap"
)

// DBAdminHandler handles database admin operations
type DBAdminHandler struct {
	db     *sqlx.DB
	logger *zap.Logger
}

// NewDBAdminHandler creates a new DB admin handler
func NewDBAdminHandler(db *sqlx.DB, logger *zap.Logger) *DBAdminHandler {
	return &DBAdminHandler{db: db, logger: logger}
}

// GetTables retrieves all tables in the database
func (h *DBAdminHandler) GetTables(w http.ResponseWriter, r *http.Request) {
	query := `
		SELECT 
			schemaname || '.' || tablename as table_name,
			n_tup_ins - n_tup_del as row_count,
			pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size
		FROM pg_stat_user_tables
		ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
	`

	rows, err := h.db.Query(query)
	if err != nil {
		h.logger.Error("Failed to fetch tables", zap.Error(err))
		sdk.WriteInternalError(w, "Failed to fetch tables")
		return
	}
	defer rows.Close()

	var tables []TableInfo
	for rows.Next() {
		var table TableInfo
		err := rows.Scan(&table.TableName, &table.RowCount, &table.TotalSize)
		if err != nil {
			continue
		}
		tables = append(tables, table)
	}

	sdk.WriteSuccess(w, map[string]interface{}{
		"tables": tables,
		"count":  len(tables),
	})
}

// ExecuteQuery executes a read-only query
func (h *DBAdminHandler) ExecuteQuery(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Query string `json:"query"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sdk.WriteBadRequest(w, "Invalid request body")
		return
	}

	if err := sdk.MustNotBeEmpty("query", req.Query); err != nil {
		sdk.WriteBadRequest(w, err.Error())
		return
	}

	// Security: only allow SELECT queries
	if !containsPrefix(req.Query, "SELECT", "WITH") {
		sdk.WriteBadRequest(w, "Only SELECT queries are allowed")
		return
	}

	startTime := time.Now()
	rows, err := h.db.Query(req.Query)
	if err != nil {
		h.logger.Error("Query execution failed", zap.Error(err))
		sdk.WriteError(w, http.StatusBadRequest, "Query execution failed: "+err.Error())
		return
	}
	defer rows.Close()

	// Get column names
	columns, err := rows.Columns()
	if err != nil {
		sdk.WriteInternalError(w, "Failed to get columns")
		return
	}

	// Fetch results
	var results []map[string]interface{}
	for rows.Next() {
		values := make([]interface{}, len(columns))
		valuePtrs := make([]interface{}, len(columns))
		for i := range values {
			valuePtrs[i] = &values[i]
		}

		if err := rows.Scan(valuePtrs...); err != nil {
			continue
		}

		row := make(map[string]interface{})
		for i, col := range columns {
			row[col] = values[i]
		}
		results = append(results, row)
	}

	executionTime := time.Since(startTime).Seconds()

	sdk.WriteSuccess(w, QueryResult{
		Columns:       columns,
		Rows:          results,
		RowCount:      len(results),
		ExecutionTime: executionTime,
	})
}

// GetDatabaseStats retrieves database statistics
func (h *DBAdminHandler) GetDatabaseStats(w http.ResponseWriter, r *http.Request) {
	var stats DatabaseStats
	stats.GeneratedAt = time.Now()

	// Get database name and size
	err := h.db.QueryRow(`
		SELECT current_database(), pg_size_pretty(pg_database_size(current_database()))
	`).Scan(&stats.DatabaseName, &stats.DatabaseSize)
	if err != nil {
		h.logger.Error("Failed to fetch database stats", zap.Error(err))
		sdk.WriteInternalError(w, "Failed to fetch database stats")
		return
	}

	// Get table count
	h.db.Get(&stats.TableCount, "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'")

	// Get connection count
	h.db.Get(&stats.ConnectionCount, "SELECT COUNT(*) FROM pg_stat_activity")

	sdk.WriteSuccess(w, stats)
}

func containsPrefix(s string, prefixes ...string) bool {
	s = trimSpace(s)
	for _, prefix := range prefixes {
		if len(s) >= len(prefix) && toUpper(s[:len(prefix)]) == toUpper(prefix) {
			return true
		}
	}
	return false
}

func trimSpace(s string) string {
	start := 0
	end := len(s)
	for start < end && (s[start] == ' ' || s[start] == '\t' || s[start] == '\n' || s[start] == '\r') {
		start++
	}
	for end > start && (s[end-1] == ' ' || s[end-1] == '\t' || s[end-1] == '\n' || s[end-1] == '\r') {
		end--
	}
	return s[start:end]
}

func toUpper(s string) string {
	result := make([]byte, len(s))
	for i := 0; i < len(s); i++ {
		if s[i] >= 'a' && s[i] <= 'z' {
			result[i] = s[i] - 32
		} else {
			result[i] = s[i]
		}
	}
	return string(result)
}

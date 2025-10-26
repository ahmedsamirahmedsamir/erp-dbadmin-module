package main

import "time"

// TableInfo represents database table information
type TableInfo struct {
	TableName string `json:"table_name"`
	RowCount  int64  `json:"row_count"`
	TableSize string `json:"table_size"`
	IndexSize string `json:"index_size"`
	TotalSize string `json:"total_size"`
}

// QueryResult represents the result of a database query
type QueryResult struct {
	Columns       []string                 `json:"columns"`
	Rows          []map[string]interface{} `json:"rows"`
	RowCount      int                      `json:"row_count"`
	ExecutionTime float64                  `json:"execution_time"`
}

// DatabaseStats represents overall database statistics
type DatabaseStats struct {
	DatabaseName    string    `json:"database_name"`
	DatabaseSize    string    `json:"database_size"`
	TableCount      int       `json:"table_count"`
	ConnectionCount int       `json:"connection_count"`
	QueryCount      int64     `json:"query_count"`
	GeneratedAt     time.Time `json:"generated_at"`
}

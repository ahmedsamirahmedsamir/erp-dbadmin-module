import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Database as DatabaseIcon, Table, Eye, Search } from 'lucide-react'
import { api, DataTable, LoadingSpinner, EmptyState } from '@erp-modules/shared'

interface TableInfo {
  table_name: string
  row_count: number
  size: string
  last_modified: string
}

interface TableData {
  columns: string[]
  rows: Record<string, any>[]
  total: number
}

export default function Database() {
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const { data: tables, isLoading: tablesLoading } = useQuery({
    queryKey: ['db-tables'],
    queryFn: async () => {
      const response = await api.get<{ data: TableInfo[] }>('/api/v1/dbadmin/database/tables')
      return response.data.data
    },
  })

  const { data: tableData, isLoading: dataLoading } = useQuery({
    queryKey: ['db-table-data', selectedTable],
    queryFn: async () => {
      const response = await api.get<{ data: TableData }>(`/api/v1/dbadmin/database/tables/${selectedTable}`)
      return response.data.data
    },
    enabled: !!selectedTable,
  })

  const filteredTables = tables?.filter(table => 
    table.table_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const tableColumns = [
    {
      accessorKey: 'table_name',
      header: 'Table Name',
      cell: ({ row }: any) => (
        <div className="flex items-center">
          <Table className="h-4 w-4 text-blue-600 mr-2" />
          <button
            onClick={() => setSelectedTable(row.getValue('table_name'))}
            className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
          >
            {row.getValue('table_name')}
          </button>
        </div>
      ),
    },
    {
      accessorKey: 'row_count',
      header: 'Rows',
      cell: ({ row }: any) => (
        <span className="text-sm text-gray-600">
          {row.getValue('row_count').toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'size',
      header: 'Size',
      cell: ({ row }: any) => (
        <span className="text-sm text-gray-600">{row.getValue('size')}</span>
      ),
    },
    {
      accessorKey: 'last_modified',
      header: 'Last Modified',
      cell: ({ row }: any) => (
        <span className="text-sm text-gray-600">
          {new Date(row.getValue('last_modified')).toLocaleString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <button
          onClick={() => setSelectedTable(row.original.table_name)}
          className="p-1 text-blue-600 hover:text-blue-800"
          title="View Data"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ]

  // Dynamic columns for table data
  const dataColumns = tableData?.columns.map(col => ({
    accessorKey: col,
    header: col,
    cell: ({ row }: any) => {
      const value = row.getValue(col)
      return (
        <span className="text-sm text-gray-900">
          {value === null ? <span className="text-gray-400 italic">NULL</span> : String(value)}
        </span>
      )
    },
  })) || []

  if (tablesLoading) {
    return <LoadingSpinner text="Loading database tables..." />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Database Browser</h1>
          <p className="text-gray-600 mt-1">Browse and inspect database tables</p>
        </div>
        {selectedTable && (
          <button
            onClick={() => setSelectedTable(null)}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Back to Tables
          </button>
        )}
      </div>

      {!selectedTable ? (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Tables List */}
          {filteredTables && filteredTables.length > 0 ? (
            <DataTable
              data={filteredTables}
              columns={tableColumns}
              enablePagination={true}
              enableSorting={true}
            />
          ) : (
            <EmptyState
              icon={DatabaseIcon}
              title="No tables found"
              description="No database tables match your search"
            />
          )}
        </>
      ) : (
        <>
          {/* Table Data View */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <Table className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-900">
                Viewing table: <span className="font-mono">{selectedTable}</span>
              </span>
              <span className="ml-4 text-sm text-blue-700">
                {tableData?.total || 0} rows
              </span>
            </div>
          </div>

          {dataLoading ? (
            <LoadingSpinner text="Loading table data..." />
          ) : tableData && tableData.rows.length > 0 ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {tableData.columns.map(col => (
                        <th
                          key={col}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tableData.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        {tableData.columns.map(col => (
                          <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {row[col] === null ? (
                              <span className="text-gray-400 italic">NULL</span>
                            ) : (
                              String(row[col])
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={Table}
              title="No data found"
              description="This table has no data"
            />
          )}
        </>
      )}
    </div>
  )
}

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  FileText, Download, Filter, AlertCircle, 
  CheckCircle, XCircle, User, Calendar 
} from 'lucide-react'
import { 
  api, DataTable, LoadingSpinner, StatusBadge, FilterBar 
} from '@erp-modules/shared'

interface AuditLog {
  id: string
  action: string
  user_id: string
  user_email: string
  resource_type: string
  resource_id: string
  status: 'success' | 'failure' | 'warning'
  ip_address: string
  user_agent: string
  timestamp: string
  details: string
}

export default function AuditLogs() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs', searchQuery, statusFilter, actionFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (statusFilter) params.append('status', statusFilter)
      if (actionFilter) params.append('action', actionFilter)
      
      const response = await api.get<{ data: AuditLog[] }>(
        `/api/v1/dbadmin/audit-logs?${params.toString()}`
      )
      return response.data.data
    },
  })

  const { data: stats } = useQuery({
    queryKey: ['audit-stats'],
    queryFn: async () => {
      const response = await api.get<{ data: any }>('/api/v1/dbadmin/audit-logs/stats')
      return response.data.data
    },
  })

  const exportLogs = async () => {
    try {
      const response = await api.get('/api/v1/dbadmin/audit-logs/export', {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `audit-logs-${new Date().toISOString()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Failed to export logs', error)
    }
  }

  const columns = [
    {
      accessorKey: 'timestamp',
      header: 'Timestamp',
      cell: ({ row }: any) => (
        <span className="text-sm text-gray-600">
          {new Date(row.getValue('timestamp')).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'user_email',
      header: 'User',
      cell: ({ row }: any) => (
        <div className="flex items-center">
          <User className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm">{row.getValue('user_email')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }: any) => (
        <span className="text-sm font-medium text-gray-900">{row.getValue('action')}</span>
      ),
    },
    {
      accessorKey: 'resource_type',
      header: 'Resource',
      cell: ({ row }: any) => (
        <span className="text-sm text-gray-600">
          {row.getValue('resource_type')}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => {
        const status = row.getValue('status')
        return (
          <div className="flex items-center">
            {status === 'success' && <CheckCircle className="h-4 w-4 text-green-600 mr-2" />}
            {status === 'failure' && <XCircle className="h-4 w-4 text-red-600 mr-2" />}
            {status === 'warning' && <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />}
            <StatusBadge status={status} />
          </div>
        )
      },
    },
    {
      accessorKey: 'ip_address',
      header: 'IP Address',
      cell: ({ row }: any) => (
        <span className="text-sm font-mono text-gray-600">{row.getValue('ip_address')}</span>
      ),
    },
  ]

  if (isLoading) {
    return <LoadingSpinner text="Loading audit logs..." />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-1">Monitor system activity and user actions</p>
        </div>
        <button
          onClick={exportLogs}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Logs
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Events</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.total_events?.toLocaleString() || 0}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Success Rate</p>
                <p className="text-2xl font-semibold text-green-600">
                  {stats.success_rate || 0}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Failed Events</p>
                <p className="text-2xl font-semibold text-red-600">
                  {stats.failed_events || 0}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search logs by user, action, or resource..."
        onClear={() => {
          setSearchQuery('')
          setStatusFilter('')
          setActionFilter('')
        }}
      >
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Statuses</option>
          <option value="success">Success</option>
          <option value="failure">Failure</option>
          <option value="warning">Warning</option>
        </select>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Actions</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="LOGIN">Login</option>
          <option value="LOGOUT">Logout</option>
        </select>
      </FilterBar>

      {/* Logs Table */}
      {logs && logs.length > 0 && (
        <DataTable
          data={logs}
          columns={columns}
          enablePagination={true}
          enableSorting={true}
          pageSize={20}
        />
      )}
    </div>
  )
}

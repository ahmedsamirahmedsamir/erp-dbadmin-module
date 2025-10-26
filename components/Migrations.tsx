import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Upload, Download, RefreshCw, CheckCircle, 
  XCircle, Clock, AlertTriangle, Play 
} from 'lucide-react'
import { 
  api, DataTable, LoadingSpinner, StatusBadge, ConfirmDialog 
} from '@erp-modules/shared'
import toast from 'react-hot-toast'

interface Migration {
  id: string
  version: number
  name: string
  status: 'pending' | 'applied' | 'failed'
  applied_at: string | null
  execution_time: string | null
}

export default function Migrations() {
  const [showApplyDialog, setShowApplyDialog] = useState(false)
  const [showRollbackDialog, setShowRollbackDialog] = useState(false)
  const queryClient = useQueryClient()

  const { data: migrations, isLoading } = useQuery({
    queryKey: ['migrations'],
    queryFn: async () => {
      const response = await api.get<{ data: Migration[] }>('/api/v1/dbadmin/migrations/status')
      return response.data.data
    },
  })

  const applyMigrations = useMutation({
    mutationFn: async () => {
      const response = await api.post('/api/v1/dbadmin/migrations/apply')
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['migrations'] })
      toast.success('Migrations applied successfully')
      setShowApplyDialog(false)
    },
    onError: () => {
      toast.error('Failed to apply migrations')
    },
  })

  const rollbackMigrations = useMutation({
    mutationFn: async () => {
      const response = await api.post('/api/v1/dbadmin/migrations/rollback')
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['migrations'] })
      toast.success('Migrations rolled back successfully')
      setShowRollbackDialog(false)
    },
    onError: () => {
      toast.error('Failed to rollback migrations')
    },
  })

  const columns = [
    {
      accessorKey: 'version',
      header: 'Version',
      cell: ({ row }: any) => (
        <span className="font-mono text-sm font-medium">
          {String(row.getValue('version')).padStart(6, '0')}
        </span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Migration Name',
      cell: ({ row }: any) => (
        <span className="text-sm">{row.getValue('name')}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => {
        const status = row.getValue('status')
        return (
          <div className="flex items-center">
            {status === 'applied' && <CheckCircle className="h-4 w-4 text-green-600 mr-2" />}
            {status === 'pending' && <Clock className="h-4 w-4 text-yellow-600 mr-2" />}
            {status === 'failed' && <XCircle className="h-4 w-4 text-red-600 mr-2" />}
            <StatusBadge status={status} />
          </div>
        )
      },
    },
    {
      accessorKey: 'applied_at',
      header: 'Applied At',
      cell: ({ row }: any) => {
        const appliedAt = row.getValue('applied_at')
        return appliedAt ? (
          <span className="text-sm text-gray-600">
            {new Date(appliedAt).toLocaleString()}
          </span>
        ) : (
          <span className="text-sm text-gray-400">Not applied</span>
        )
      },
    },
    {
      accessorKey: 'execution_time',
      header: 'Execution Time',
      cell: ({ row }: any) => {
        const time = row.getValue('execution_time')
        return time ? (
          <span className="text-sm text-gray-600">{time}</span>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )
      },
    },
  ]

  if (isLoading) {
    return <LoadingSpinner text="Loading migrations..." />
  }

  const pendingCount = migrations?.filter(m => m.status === 'pending').length || 0
  const appliedCount = migrations?.filter(m => m.status === 'applied').length || 0
  const failedCount = migrations?.filter(m => m.status === 'failed').length || 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Database Migrations</h1>
          <p className="text-gray-600 mt-1">Manage database schema migrations</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowRollbackDialog(true)}
            disabled={appliedCount === 0}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4 mr-2" />
            Rollback
          </button>
          <button
            onClick={() => setShowApplyDialog(true)}
            disabled={pendingCount === 0}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="h-4 w-4 mr-2" />
            Apply Migrations
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-semibold text-yellow-600">{pendingCount}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Applied</p>
              <p className="text-2xl font-semibold text-green-600">{appliedCount}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Failed</p>
              <p className="text-2xl font-semibold text-red-600">{failedCount}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Migrations Table */}
      {migrations && migrations.length > 0 && (
        <DataTable
          data={migrations}
          columns={columns}
          enablePagination={true}
          enableSorting={true}
        />
      )}

      {/* Apply Migrations Dialog */}
      <ConfirmDialog
        isOpen={showApplyDialog}
        onClose={() => setShowApplyDialog(false)}
        onConfirm={() => applyMigrations.mutate()}
        title="Apply Pending Migrations"
        message={`This will apply ${pendingCount} pending migration(s) to the database. Make sure you have a backup before proceeding.`}
        confirmText="Apply Migrations"
        variant="warning"
        isLoading={applyMigrations.isPending}
      />

      {/* Rollback Dialog */}
      <ConfirmDialog
        isOpen={showRollbackDialog}
        onClose={() => setShowRollbackDialog(false)}
        onConfirm={() => rollbackMigrations.mutate()}
        title="Rollback Last Migration"
        message="This will rollback the last applied migration. This action may result in data loss. Make sure you have a backup before proceeding."
        confirmText="Rollback"
        variant="danger"
        isLoading={rollbackMigrations.isPending}
      />
    </div>
  )
}

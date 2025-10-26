import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Plus, Download, Trash2, RefreshCw, HardDrive, 
  AlertCircle, CheckCircle, Clock, Database 
} from 'lucide-react'
import { 
  api, DataTable, LoadingSpinner, StatusBadge, 
  ActionButtons, ConfirmDialog, EmptyState 
} from '@erp-modules/shared'
import toast from 'react-hot-toast'

interface Backup {
  id: string
  filename: string
  size: string
  created_at: string
  status: 'completed' | 'in_progress' | 'failed'
  type: 'full' | 'incremental' | 'differential'
  compressed: boolean
}

export default function Backups() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [deleteBackupId, setDeleteBackupId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: backups, isLoading } = useQuery({
    queryKey: ['backups'],
    queryFn: async () => {
      const response = await api.get<{ data: Backup[] }>('/api/v1/dbadmin/backups')
      return response.data.data
    },
  })

  const createBackup = useMutation({
    mutationFn: async () => {
      const response = await api.post('/api/v1/dbadmin/backups', {
        type: 'full',
        compressed: true,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] })
      toast.success('Backup created successfully')
      setShowCreateDialog(false)
    },
    onError: () => {
      toast.error('Failed to create backup')
    },
  })

  const deleteBackup = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/dbadmin/backups/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] })
      toast.success('Backup deleted successfully')
      setDeleteBackupId(null)
    },
    onError: () => {
      toast.error('Failed to delete backup')
    },
  })

  const downloadBackup = async (id: string, filename: string) => {
    try {
      const response = await api.get(`/api/v1/dbadmin/backups/${id}/download`, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Backup download started')
    } catch (error) {
      toast.error('Failed to download backup')
    }
  }

  const columns = [
    {
      accessorKey: 'filename',
      header: 'Filename',
      cell: ({ row }: any) => (
        <div className="flex items-center">
          <HardDrive className="h-4 w-4 text-blue-600 mr-2" />
          <span className="font-medium">{row.getValue('filename')}</span>
        </div>
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
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }: any) => {
        const type = row.getValue('type')
        return (
          <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
            {type}
          </span>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => (
        <StatusBadge status={row.getValue('status')} />
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }: any) => (
        <span className="text-sm text-gray-600">
          {new Date(row.getValue('created_at')).toLocaleString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => downloadBackup(row.original.id, row.original.filename)}
            className="p-1 text-blue-600 hover:text-blue-800"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeleteBackupId(row.original.id)}
            className="p-1 text-red-600 hover:text-red-800"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  if (isLoading) {
    return <LoadingSpinner text="Loading backups..." />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Backup Management</h1>
          <p className="text-gray-600 mt-1">Create and manage database backups</p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Backup
        </button>
      </div>

      {/* Backups Table */}
      {backups && backups.length > 0 ? (
        <DataTable
          data={backups}
          columns={columns}
          enablePagination={true}
          enableSorting={true}
        />
      ) : (
        <EmptyState
          icon={HardDrive}
          title="No backups found"
          description="Create your first database backup to get started"
          action={{
            label: 'Create Backup',
            onClick: () => setShowCreateDialog(true),
          }}
        />
      )}

      {/* Create Backup Dialog */}
      <ConfirmDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onConfirm={() => createBackup.mutate()}
        title="Create Database Backup"
        message="This will create a full backup of the entire database. This may take several minutes depending on the database size."
        confirmText="Create Backup"
        variant="info"
        isLoading={createBackup.isPending}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteBackupId}
        onClose={() => setDeleteBackupId(null)}
        onConfirm={() => deleteBackupId && deleteBackup.mutate(deleteBackupId)}
        title="Delete Backup"
        message="Are you sure you want to delete this backup? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={deleteBackup.isPending}
      />
    </div>
  )
}

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Plus, Edit, Pause, Play, Building, Users 
} from 'lucide-react'
import { 
  api, DataTable, LoadingSpinner, StatusBadge, 
  ActionButtons, ConfirmDialog, EmptyState 
} from '@erp-modules/shared'
import toast from 'react-hot-toast'

interface Tenant {
  id: string
  name: string
  slug: string
  status: 'active' | 'suspended' | 'inactive'
  user_count: number
  database_size: string
  created_at: string
  last_active: string
}

export default function Tenants() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [suspendTenantId, setSuspendTenantId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const response = await api.get<{ data: Tenant[] }>('/api/v1/dbadmin/tenants')
      return response.data.data
    },
  })

  const suspendTenant = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/api/v1/dbadmin/tenants/${id}/suspend`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      toast.success('Tenant suspended successfully')
      setSuspendTenantId(null)
    },
    onError: () => {
      toast.error('Failed to suspend tenant')
    },
  })

  const activateTenant = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/api/v1/dbadmin/tenants/${id}/activate`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      toast.success('Tenant activated successfully')
    },
    onError: () => {
      toast.error('Failed to activate tenant')
    },
  })

  const columns = [
    {
      accessorKey: 'name',
      header: 'Tenant Name',
      cell: ({ row }: any) => (
        <div className="flex items-center">
          <Building className="h-4 w-4 text-blue-600 mr-2" />
          <div>
            <div className="font-medium text-gray-900">{row.getValue('name')}</div>
            <div className="text-sm text-gray-500">{row.original.slug}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => (
        <StatusBadge status={row.getValue('status')} />
      ),
    },
    {
      accessorKey: 'user_count',
      header: 'Users',
      cell: ({ row }: any) => (
        <div className="flex items-center">
          <Users className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-600">{row.getValue('user_count')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'database_size',
      header: 'DB Size',
      cell: ({ row }: any) => (
        <span className="text-sm text-gray-600">{row.getValue('database_size')}</span>
      ),
    },
    {
      accessorKey: 'last_active',
      header: 'Last Active',
      cell: ({ row }: any) => (
        <span className="text-sm text-gray-600">
          {new Date(row.getValue('last_active')).toLocaleDateString()}
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }: any) => (
        <span className="text-sm text-gray-600">
          {new Date(row.getValue('created_at')).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedTenant(row.original)}
            className="p-1 text-blue-600 hover:text-blue-800"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          {row.original.status === 'active' ? (
            <button
              onClick={() => setSuspendTenantId(row.original.id)}
              className="p-1 text-red-600 hover:text-red-800"
              title="Suspend"
            >
              <Pause className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => activateTenant.mutate(row.original.id)}
              className="p-1 text-green-600 hover:text-green-800"
              title="Activate"
            >
              <Play className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ]

  if (isLoading) {
    return <LoadingSpinner text="Loading tenants..." />
  }

  const activeCount = tenants?.filter(t => t.status === 'active').length || 0
  const suspendedCount = tenants?.filter(t => t.status === 'suspended').length || 0
  const totalUsers = tenants?.reduce((sum, t) => sum + t.user_count, 0) || 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tenant Management</h1>
          <p className="text-gray-600 mt-1">Manage system tenants and organizations</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Tenant
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Tenants</p>
              <p className="text-2xl font-semibold text-green-600">{activeCount}</p>
            </div>
            <Building className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Suspended</p>
              <p className="text-2xl font-semibold text-red-600">{suspendedCount}</p>
            </div>
            <Pause className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-semibold text-blue-600">{totalUsers}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Tenants Table */}
      {tenants && tenants.length > 0 ? (
        <DataTable
          data={tenants}
          columns={columns}
          enablePagination={true}
          enableSorting={true}
        />
      ) : (
        <EmptyState
          icon={Building}
          title="No tenants found"
          description="Create your first tenant to get started"
          action={{
            label: 'Create Tenant',
            onClick: () => setShowCreateForm(true),
          }}
        />
      )}

      {/* Suspend Confirmation */}
      <ConfirmDialog
        isOpen={!!suspendTenantId}
        onClose={() => setSuspendTenantId(null)}
        onConfirm={() => suspendTenantId && suspendTenant.mutate(suspendTenantId)}
        title="Suspend Tenant"
        message="Are you sure you want to suspend this tenant? Users will not be able to access the system."
        confirmText="Suspend"
        variant="danger"
        isLoading={suspendTenant.isPending}
      />

      {/* Create/Edit Form - Simplified placeholder */}
      {(showCreateForm || selectedTenant) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {selectedTenant ? 'Edit Tenant' : 'Create Tenant'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Tenant form would go here with name, slug, and configuration fields.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowCreateForm(false)
                  setSelectedTenant(null)
                }}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false)
                  setSelectedTenant(null)
                  toast.success(selectedTenant ? 'Tenant updated' : 'Tenant created')
                }}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                {selectedTenant ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import React from 'react'
import { CheckCircle, AlertTriangle } from 'lucide-react'

interface OverviewTabProps {
  stats?: {
    database_size: string
    table_count: number
    active_connections: number
    backup_count: number
    migration_status: string
    tenant_count: number
    audit_log_count: number
    last_backup: string
    system_health: 'healthy' | 'warning' | 'critical'
  }
}

export function OverviewTab({ stats }: OverviewTabProps) {
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      {/* System Health */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
          <div className={`flex items-center px-4 py-2 rounded-lg ${getHealthColor(stats?.system_health || 'healthy')}`}>
            {stats?.system_health === 'healthy' ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <AlertTriangle className="h-5 w-5 mr-2" />
            )}
            <span className="font-medium">{stats?.system_health || 'Unknown'}</span>
          </div>
        </div>

        {/* Health Metrics */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Database Performance</span>
              <span className="text-sm font-medium text-gray-900">95%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '95%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Storage Usage</span>
              <span className="text-sm font-medium text-gray-900">67%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '67%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Backup Health</span>
              <span className="text-sm font-medium text-gray-900">100%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
        <dl className="space-y-3">
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500">Migration Status</dt>
            <dd className="text-sm font-medium text-gray-900">{stats?.migration_status || 'Unknown'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500">Tenant Count</dt>
            <dd className="text-sm font-medium text-gray-900">{stats?.tenant_count || 0}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500">Audit Logs</dt>
            <dd className="text-sm font-medium text-gray-900">{stats?.audit_log_count || 0}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500">Last Backup</dt>
            <dd className="text-sm font-medium text-gray-900">
              {stats?.last_backup ? new Date(stats.last_backup).toLocaleString() : 'Never'}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}


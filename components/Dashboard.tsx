import React from 'react'
import { Database, HardDrive, Activity, FileText, Users, Server } from 'lucide-react'
import { ModuleDashboard, useModuleQuery } from '@erp-modules/shared'
import { OverviewTab } from './tabs/OverviewTab'
import { BackupsTab } from './tabs/BackupsTab'
import { MigrationsTab } from './tabs/MigrationsTab'
import { DatabaseTab } from './tabs/DatabaseTab'
import { AuditLogsTab } from './tabs/AuditLogsTab'
import { TenantsTab } from './tabs/TenantsTab'

interface SystemStats {
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

export default function Dashboard() {
  const { data: stats } = useModuleQuery<{ data: SystemStats }>(
    ['dbadmin-stats'],
    '/api/v1/dbadmin/stats'
  )

  const systemStats = stats?.data

  return (
    <ModuleDashboard
      title="Database Administration"
      icon={Database}
      description="System overview and health monitoring"
      kpis={[
        {
          id: 'db-size',
          label: 'Database Size',
          value: systemStats?.database_size || '0 MB',
          icon: Database,
          color: 'blue',
        },
        {
          id: 'tables',
          label: 'Tables',
          value: systemStats?.table_count || 0,
          icon: FileText,
          color: 'green',
        },
        {
          id: 'connections',
          label: 'Active Connections',
          value: systemStats?.active_connections || 0,
          icon: Activity,
          color: 'purple',
        },
        {
          id: 'backups',
          label: 'Backups',
          value: systemStats?.backup_count || 0,
          icon: HardDrive,
          color: 'orange',
        },
      ]}
      actions={[
        {
          id: 'create-backup',
          label: 'Create Backup',
          icon: HardDrive,
          onClick: () => {},
          variant: 'secondary',
        },
        {
          id: 'run-migration',
          label: 'Run Migration',
          icon: Activity,
          onClick: () => {},
          variant: 'primary',
        },
      ]}
      tabs={[
        {
          id: 'overview',
          label: 'Overview',
          icon: Server,
          content: <OverviewTab stats={systemStats} />,
        },
        {
          id: 'backups',
          label: 'Backups',
          icon: HardDrive,
          content: <BackupsTab />,
        },
        {
          id: 'migrations',
          label: 'Migrations',
          icon: Activity,
          content: <MigrationsTab />,
        },
        {
          id: 'database',
          label: 'Database Browser',
          icon: Database,
          content: <DatabaseTab />,
        },
        {
          id: 'audit-logs',
          label: 'Audit Logs',
          icon: FileText,
          content: <AuditLogsTab />,
        },
        {
          id: 'tenants',
          label: 'Tenants',
          icon: Users,
          content: <TenantsTab />,
        },
      ]}
      defaultTab="overview"
    />
  )
}

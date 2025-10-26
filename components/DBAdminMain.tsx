import React from 'react'
import { Database, HardDrive, Upload, Table, FileText, Building } from 'lucide-react'
import { TabContainer } from '@erp-modules/shared'
import Dashboard from './Dashboard'
import Backups from './Backups'
import Migrations from './Migrations'
import Database from './Database'
import AuditLogs from './AuditLogs'
import Tenants from './Tenants'

export function DBAdminMain() {
  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Database,
      content: <Dashboard />,
    },
    {
      id: 'backups',
      label: 'Backups',
      icon: HardDrive,
      content: <Backups />,
    },
    {
      id: 'migrations',
      label: 'Migrations',
      icon: Upload,
      content: <Migrations />,
    },
    {
      id: 'database',
      label: 'Database Browser',
      icon: Table,
      content: <Database />,
    },
    {
      id: 'audit',
      label: 'Audit Logs',
      icon: FileText,
      content: <AuditLogs />,
    },
    {
      id: 'tenants',
      label: 'Tenants',
      icon: Building,
      content: <Tenants />,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <TabContainer tabs={tabs} defaultTab="dashboard" urlParam="tab" />
      </div>
    </div>
  )
}

export default DBAdminMain


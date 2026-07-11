import { DEPARTMENTS, themedInputStyle } from '../../data/constants'
import type { Company, Department, Order, Theme } from '../../types'

export function OrdersToolbar({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  companyFilter,
  onCompanyFilterChange,
  deptFilter,
  onDeptFilterChange,
  theme,
}: {
  search: string
  onSearchChange: (value: string) => void
  filter: 'All' | Order['overallStatus']
  onFilterChange: (value: 'All' | Order['overallStatus']) => void
  companyFilter: 'All' | Company
  onCompanyFilterChange: (value: 'All' | Company) => void
  deptFilter: 'All' | Department
  onDeptFilterChange: (value: 'All' | Department) => void
  theme: Theme
}) {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
      <input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search orders, clients..."
        style={{ ...themedInputStyle(theme), width: 220 }}
      />
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {(['All', 'In Progress', 'On Hold', 'Completed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => onFilterChange(status)}
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              border: '1px solid',
              borderColor: filter === status ? theme.primary : theme.border,
              background: filter === status ? theme.primary : theme.surface,
              color: filter === status ? theme.primaryText : theme.textMuted,
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {status}
          </button>
        ))}
      </div>
      <select
        value={companyFilter}
        onChange={(event) => onCompanyFilterChange(event.target.value as 'All' | Company)}
        style={{ ...themedInputStyle(theme), width: 150 }}
      >
        <option value="All">All Factories</option>
        {(['CSM', 'Oriental'] as const).map((company) => (
          <option key={company}>{company}</option>
        ))}
      </select>
      <select
        value={deptFilter}
        onChange={(event) => onDeptFilterChange(event.target.value as 'All' | Department)}
        style={{ ...themedInputStyle(theme), width: 160 }}
      >
        <option value="All">All Departments</option>
        {DEPARTMENTS.map((department) => (
          <option key={department}>{department}</option>
        ))}
      </select>
    </div>
  )
}

import type { Theme } from '../../types'

export function StatsGrid({
  stats,
  theme,
}: {
  stats: { total: number; inProgress: number; onHold: number; completed: number }
  theme: Theme
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12,
        marginBottom: 24,
      }}
    >
      {[
        { label: 'Total Orders', value: stats.total, color: '#1E3A5F' },
        { label: 'In Progress', value: stats.inProgress, color: '#3B82F6' },
        { label: 'On Hold', value: stats.onHold, color: '#EF4444' },
        { label: 'Completed', value: stats.completed, color: '#10B981' },
      ].map((stat) => (
        <div
          key={stat.label}
          style={{
            background: theme.surface,
            borderRadius: 12,
            padding: '16px 20px',
            boxShadow: theme.shadow,
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 900, color: stat.color }}>{stat.value}</div>
          <div
            style={{
              fontSize: 11,
              color: theme.textSoft,
              fontWeight: 600,
              letterSpacing: '0.05em',
              marginTop: 2,
            }}
          >
            {stat.label.toUpperCase()}
          </div>
        </div>
      ))}
    </div>
  )
}

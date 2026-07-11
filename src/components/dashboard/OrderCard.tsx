import { PRIORITY_META, STATUS_META } from '../../data/constants'
import type { Order, Theme } from '../../types'
import { daysLeft, progressPct } from '../../utils/orders'
import { Badge, DeptPipeline } from '../common/OrderVisuals'

export function OrderCard({
  order,
  theme,
  onSelect,
}: {
  order: Order
  theme: Theme
  onSelect: (order: Order) => void
}) {
  const pct = progressPct(order.tasks)
  const dl = daysLeft(order.deadline)
  const holdTasks = order.tasks.filter((task) => task.status === 'On Hold')
  const activeTasks = order.tasks.filter((task) => task.status === 'In Progress')
  const statusMeta = STATUS_META[order.overallStatus]
  const priority = PRIORITY_META[order.priority]

  return (
    <div
      onClick={() => onSelect(order)}
      style={{
        background: theme.surface,
        borderRadius: 14,
        padding: '18px 22px',
        boxShadow: theme.shadow,
        cursor: 'pointer',
        border: `1.5px solid ${theme.border}`,
        transition: 'border-color 0.15s, box-shadow 0.15s',
        borderLeft: `4px solid ${statusMeta.dot}`,
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.boxShadow = theme.hoverShadow
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.boxShadow = theme.shadow
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: theme.textSoft, fontWeight: 700, letterSpacing: '0.07em' }}>
              {order.id}
            </span>
            <Badge label={order.company} meta={{ bg: '#E6FFFB', color: '#0F766E' }} />
            <Badge label={order.priority} meta={priority} />
            <Badge label={order.overallStatus} meta={{ bg: statusMeta.bg, color: statusMeta.color }} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: theme.text, marginTop: 4 }}>
            {order.client}
          </div>
          <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>{order.product}</div>
          {order.description && (
            <div style={{ fontSize: 11, color: theme.textSoft, marginTop: 4 }}>
              {order.description}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div
            style={{
              fontSize: 11,
              color: dl <= 3 ? '#DC2626' : dl <= 7 ? '#B45309' : '#6B7280',
              fontWeight: 700,
            }}
          >
            {dl < 0 ? `${Math.abs(dl)}d overdue` : `${dl}d left`}
          </div>
          <div style={{ fontSize: 10, color: theme.textSoft }}>{order.deadline}</div>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: theme.textSoft, fontWeight: 600 }}>PRODUCTION COMPLETENESS</span>
          <span style={{ fontSize: 11, color: theme.textMuted, fontWeight: 700 }}>{pct}%</span>
        </div>
        <DeptPipeline tasks={order.tasks} theme={theme} />
      </div>

      {(activeTasks.length > 0 || holdTasks.length > 0) && (
        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {activeTasks.map((task) => (
            <div
              key={task.dept}
              style={{
                background: '#EFF6FF',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 11,
                color: '#1D4ED8',
                fontWeight: 600,
              }}
            >
              {task.dept}: {task.assignee || 'Unassigned'}
              {task.remark ? ` - ${task.remark.slice(0, 45)}${task.remark.length > 45 ? '...' : ''}` : ''}
            </div>
          ))}
          {holdTasks.map((task) => (
            <div
              key={task.dept}
              style={{
                background: '#FEF2F2',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 11,
                color: '#DC2626',
                fontWeight: 600,
              }}
            >
              {task.dept} on hold
              {task.holdReason
                ? `: ${task.holdReason.slice(0, 50)}${task.holdReason.length > 50 ? '...' : ''}`
                : ''}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

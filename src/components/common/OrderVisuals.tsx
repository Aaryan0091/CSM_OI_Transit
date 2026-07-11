import { STATUS_META } from '../../data/constants'
import type { Status, Task, Theme } from '../../types'

export function Badge({ label, meta }: { label: string; meta: { bg: string; color: string } }) {
  return (
    <span
      style={{
        background: meta.bg,
        color: meta.color,
        padding: '2px 10px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.03em',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}

export function StatusDot({ status }: { status: Status }) {
  const meta = STATUS_META[status]
  return (
    <span
      style={{
        width: 9,
        height: 9,
        borderRadius: '50%',
        background: meta.dot,
        display: 'inline-block',
        marginRight: 6,
        flexShrink: 0,
      }}
    />
  )
}

export function DeptPipeline({ tasks, theme }: { tasks: Task[]; theme: Theme }) {
  const activeIndex = tasks.findIndex((task) => task.status === 'In Progress' || task.status === 'On Hold')
  const completedCount = tasks.filter((task) => task.status === 'Completed' || task.status === 'Dispatched').length
  const progressPercent = tasks.length > 1 ? (completedCount / (tasks.length - 1)) * 100 : 0

  return (
    <div style={{ position: 'relative', padding: '16px 8px 10px 8px', marginTop: 10 }}>
      <div
        style={{
          position: 'absolute',
          left: 20,
          right: 20,
          top: 24,
          height: 4,
          background: theme.border,
          borderRadius: 2,
          zIndex: 1,
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 20,
          top: 24,
          height: 4,
          background: '#10B981',
          width: `calc(${progressPercent}% - 4px)`,
          borderRadius: 2,
          zIndex: 1,
          transition: 'width 0.4s ease-out',
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
        {tasks.map((task, index) => {
          const isCompleted = task.status === 'Completed' || task.status === 'Dispatched'
          const isInProgress = task.status === 'In Progress'
          const isOnHold = task.status === 'On Hold'
          const isActive = index === activeIndex || (activeIndex === -1 && index === tasks.length - 1 && isCompleted)

          let dotColor = '#E5E7EB'
          let borderColor = theme.border
          let labelColor = theme.textSoft
          let scale = 1
          let pulseClass = false

          if (isCompleted) {
            dotColor = '#10B981'
            borderColor = '#10B981'
            labelColor = theme.text
          } else if (isInProgress) {
            dotColor = '#3B82F6'
            borderColor = '#3B82F6'
            labelColor = '#3B82F6'
            scale = 1.15
            pulseClass = true
          } else if (isOnHold) {
            dotColor = '#EF4444'
            borderColor = '#EF4444'
            labelColor = '#EF4444'
            scale = 1.15
            pulseClass = true
          }

          let shortName = ''
          if (task.dept === 'Sales') shortName = 'SL'
          else if (task.dept === 'Design') shortName = 'DS'
          else if (task.dept === 'Procurement') shortName = 'PR'
          else if (task.dept === 'Production') shortName = 'PD'
          else if (task.dept === 'QC') shortName = 'QC'
          else if (task.dept === 'Dispatch') shortName = 'DP'

          return (
            <div
              key={task.dept}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
              }}
            >
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    top: -24,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap',
                    background: isOnHold ? '#EF4444' : isInProgress ? '#3B82F6' : '#10B981',
                    color: '#fff',
                    fontSize: 8,
                    fontWeight: 900,
                    padding: '2px 6px',
                    borderRadius: 4,
                    textTransform: 'uppercase',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    zIndex: 3,
                    animation: pulseClass ? 'bounce-active 1.5s infinite alternate ease-in-out' : 'none',
                  }}
                >
                  {isOnHold ? 'ON HOLD' : isInProgress ? 'CURRENTLY HERE' : 'DISPATCHED'}
                </div>
              )}

              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: dotColor,
                  border: `2.5px solid ${isActive ? '#fff' : borderColor}`,
                  boxShadow: isActive ? '0 0 10px rgba(0,0,0,0.15)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  fontWeight: 900,
                  color: isCompleted ? '#fff' : isActive ? '#fff' : theme.textSoft,
                  transform: `scale(${scale})`,
                  transition: 'all 0.3s ease',
                  zIndex: 2,
                }}
              >
                {isCompleted ? (
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ display: 'block' }}
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  shortName
                )}
              </div>

              <span
                style={{
                  fontSize: 9,
                  fontWeight: isActive ? 800 : 600,
                  color: labelColor,
                  marginTop: 6,
                  letterSpacing: '0.02em',
                }}
              >
                {task.dept}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

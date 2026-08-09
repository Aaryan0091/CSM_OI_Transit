import { useOrderActivity } from '../../hooks/useOrderActivity'
import type { Theme } from '../../types'

function formatActivityTime(value: string) {
  if (!value) {
    return 'Saving time...'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function OrderActivityTimeline({ orderId, theme }: { orderId: string; theme: Theme }) {
  const { activity, error, hasLoaded } = useOrderActivity(orderId)

  return (
    <section aria-labelledby="order-activity-title" style={{ marginTop: 8 }}>
      <div
        id="order-activity-title"
        style={{ fontSize: 12, fontWeight: 800, color: theme.text, marginBottom: 10 }}
      >
        Activity History
      </div>

      {!hasLoaded && <div style={{ fontSize: 12, color: theme.textSoft }}>Loading activity...</div>}
      {error && <div style={{ fontSize: 12, color: '#B91C1C' }}>{error}</div>}
      {hasLoaded && !error && activity.length === 0 && (
        <div style={{ fontSize: 12, color: theme.textSoft }}>
          No recorded activity yet. History starts with the next saved change.
        </div>
      )}

      {activity.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {activity.map((entry) => (
            <article
              key={entry.id}
              style={{
                border: `1px solid ${theme.border}`,
                borderLeft: '4px solid #0F766E',
                borderRadius: 10,
                padding: '10px 12px',
                background: theme.surfaceAlt,
              }}
            >
              <div style={{ fontSize: 12, color: theme.text, fontWeight: 700 }}>
                {entry.actorName} ({entry.actorDept})
              </div>
              <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4, lineHeight: 1.45 }}>
                {entry.summary}
              </div>
              <time
                dateTime={entry.createdAt}
                style={{ display: 'block', fontSize: 10, color: theme.textSoft, marginTop: 6 }}
              >
                {formatActivityTime(entry.createdAt)}
              </time>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

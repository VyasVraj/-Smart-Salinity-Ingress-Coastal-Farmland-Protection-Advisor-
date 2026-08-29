import { formatTime } from '../lib/utils.js'

const TYPE_COLOR = {
  info:     'rgba(59,130,246,0.08)',
  success:  'rgba(34,197,94,0.08)',
  danger:   'rgba(228,87,86,0.08)',
  critical: 'rgba(168,85,247,0.08)',
  warning:  'rgba(230,162,60,0.08)',
}
const TYPE_BORDER = {
  info:     'rgba(59,130,246,0.25)',
  success:  'rgba(34,197,94,0.25)',
  danger:   'rgba(228,87,86,0.25)',
  critical: 'rgba(168,85,247,0.25)',
  warning:  'rgba(230,162,60,0.25)',
}

export function ActivityTimeline({ events = [] }) {
  if (!events.length) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        <p>No activity yet.</p>
        <p style={{ fontSize: '0.75rem', marginTop: 4 }}>Events will appear here when readings are submitted.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 384, overflowY: 'auto', paddingRight: 4 }}>
      {events.map(event => (
        <div
          key={event.id}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
            padding: '0.625rem 0.75rem', borderRadius: 8,
            background: TYPE_COLOR[event.type] || TYPE_COLOR.info,
            border: `1px solid ${TYPE_BORDER[event.type] || TYPE_BORDER.info}`,
            fontSize: '0.875rem',
          }}
        >
          <span style={{ fontSize: '1.125rem', lineHeight: 1, marginTop: 2, flexShrink: 0 }}>{event.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{event.message}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{formatTime(event.timestamp)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

import { formatTime } from '../lib/utils.js'

const TYPE_STYLES = {
  info: 'border-blue-500/30 bg-blue-500/5',
  success: 'border-green-500/30 bg-green-500/5',
  danger: 'border-red-500/30 bg-red-500/5',
  critical: 'border-purple-500/30 bg-purple-500/5',
  warning: 'border-amber-500/30 bg-amber-500/5',
}

export function ActivityTimeline({ events = [] }) {
  if (!events.length) {
    return (
      <div className="text-center py-8 text-gray-600 text-sm">
        <p>No activity yet.</p>
        <p className="text-xs mt-1">Events will appear here when readings are submitted.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
      {events.map(event => (
        <div
          key={event.id}
          className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border ${TYPE_STYLES[event.type] || TYPE_STYLES.info} text-sm`}
        >
          <span className="text-lg leading-none mt-0.5 flex-shrink-0">{event.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-gray-300">{event.message}</p>
            <p className="text-xs text-gray-600 mt-0.5">{formatTime(event.timestamp)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

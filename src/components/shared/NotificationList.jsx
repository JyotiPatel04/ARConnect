import { AlertCircle, Bell, CheckCheck } from 'lucide-react'
import Button from '../ui/Button'
import EmptyState from '../ui/EmptyState'
import { formatRelativeTime } from '../../lib/format'

export default function NotificationList({ notifications, unreadCount, loading, error, markAsRead, markAllAsRead }) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-navy-500">
          {loading ? 'Loading...' : `${notifications.length} notification${notifications.length === 1 ? '' : 's'}`}
        </p>
        {!loading && unreadCount > 0 && (
          <Button size="sm" variant="secondary" icon={CheckCheck} onClick={markAllAsRead}>
            Mark all read
          </Button>
        )}
      </div>

      {loading && <p className="py-8 text-center text-sm text-navy-400">Loading notifications...</p>}

      {!loading && error && (
        <EmptyState
          icon={AlertCircle}
          tone="error"
          title="Couldn't load notifications"
          subtitle="Please check your connection and try again."
        />
      )}

      {!loading && !error && notifications.length === 0 && (
        <EmptyState icon={Bell} title="No notifications yet" subtitle="Updates about your applications will show up here." />
      )}

      {!loading && !error && notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => !n.read && markAsRead(n.id)}
              className={`w-full rounded-2xl border p-3.5 text-left shadow-soft transition-colors ${
                n.read ? 'border-slate-100 bg-white' : 'border-primary-100 bg-primary-50/40'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className={`text-[13px] ${n.read ? 'font-semibold text-navy-700' : 'font-bold text-navy-900'}`}>{n.title}</p>
                {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary-600" aria-label="Unread" />}
              </div>
              <p className="mt-1 text-xs text-navy-500">{n.message}</p>
              <p className="mt-1.5 text-[10.5px] text-navy-400">{formatRelativeTime(n.createdAt?.toDate?.())}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

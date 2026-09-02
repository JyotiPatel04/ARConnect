import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function NotificationBell({ to, unreadCount = 0 }) {
  return (
    <Link
      to={to}
      className="relative flex h-8 w-8 items-center justify-center rounded-full text-navy-400 hover:bg-slate-100 hover:text-navy-700"
      aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
      title="Notifications"
    >
      <Bell size={17} />
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  )
}

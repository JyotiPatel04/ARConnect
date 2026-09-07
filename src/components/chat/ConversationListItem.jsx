import { Link } from 'react-router-dom'
import { formatRelativeTime, getInitials } from '../../lib/format'

// Shared row for both the candidate and employer conversation lists —
// `title` is whichever name is relevant to the viewer (the employer/company
// for a candidate, the candidate for an employer), `subtitle` is always
// the job title, matching how ApplicationRow/CandidateApplicationsPage
// already identify a conversation's context.
export default function ConversationListItem({ to, title, subtitle, preview, lastMessageAt, unread }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-2xl border p-3.5 shadow-soft transition-colors ${
        unread ? 'border-primary-100 bg-primary-50/40' : 'border-slate-100 bg-white'
      }`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-900 text-[11px] font-bold text-white">
        {getInitials(title) || title?.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className={`truncate text-[13px] ${unread ? 'font-bold text-navy-900' : 'font-semibold text-navy-700'}`}>
            {title}
          </p>
          {lastMessageAt && (
            <span className="shrink-0 text-[10.5px] text-navy-400">{formatRelativeTime(lastMessageAt)}</span>
          )}
        </div>
        <p className="truncate text-xs text-navy-500">{subtitle}</p>
        <p className={`truncate text-xs ${unread ? 'font-semibold text-navy-700' : 'text-navy-400'}`}>
          {preview || 'No messages yet'}
        </p>
      </div>
      {unread && <span className="h-2 w-2 shrink-0 rounded-full bg-primary-600" aria-label="Unread" />}
    </Link>
  )
}

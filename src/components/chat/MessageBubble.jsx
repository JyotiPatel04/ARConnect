import { formatRelativeTime } from '../../lib/format'

export default function MessageBubble({ message, isMine }) {
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 shadow-soft ${
          isMine ? 'bg-primary-600 text-white' : 'border border-slate-100 bg-white text-navy-800'
        }`}
      >
        <p className="whitespace-pre-wrap break-words text-[13px]">{message.text}</p>
        <p className={`mt-1 text-[10px] ${isMine ? 'text-primary-100' : 'text-navy-400'}`}>
          {formatRelativeTime(message.createdAt?.toDate?.()) || 'Sending...'}
        </p>
      </div>
    </div>
  )
}

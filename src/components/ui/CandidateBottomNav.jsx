import { Home, Search, ClipboardList, MessageCircle, User } from 'lucide-react'

const items = [
  { icon: Home, label: 'Home' },
  { icon: Search, label: 'Search' },
  { icon: ClipboardList, label: 'Applications' },
  { icon: MessageCircle, label: 'Chat' },
  { icon: User, label: 'Profile' },
]

export default function CandidateBottomNav({ active = 'Home' }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-slate-100 bg-white px-3 py-2">
      {items.map(({ icon: Icon, label }) => {
        const isActive = label === active
        return (
          <div key={label} className="flex flex-1 flex-col items-center gap-0.5">
            <Icon
              size={17}
              strokeWidth={2.25}
              className={isActive ? 'text-primary-600' : 'text-navy-400'}
            />
            <span
              className={`text-[8.5px] font-semibold ${
                isActive ? 'text-primary-600' : 'text-navy-400'
              }`}
            >
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

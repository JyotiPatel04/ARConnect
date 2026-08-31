import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'

const threads = [
  { company: 'ABC Pvt Ltd', preview: "Great! I've scheduled it for 29 Aug, 11:30 AM.", time: '10:45 AM', unread: true },
  { company: 'QuickServe', preview: 'Please bring your Aadhaar card for verification.', time: 'Yesterday', unread: false },
  { company: 'TechNova Solutions', preview: 'Thank you for applying. We will get back soon.', time: '2 days ago', unread: false },
]

export default function CandidateChatPage() {
  useDocumentTitle('Chat')

  return (
    <div>
      <PageHeader title="Chat" subtitle="Conversations with recruiters" />
      <div className="space-y-2">
        {threads.map((t) => (
          <div
            key={t.company}
            className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-soft"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-900 text-[11px] font-bold text-white">
              {t.company.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-bold text-navy-900">{t.company}</p>
                <span className="text-[10.5px] text-navy-400">{t.time}</span>
              </div>
              <p className="truncate text-xs text-navy-500">{t.preview}</p>
            </div>
            {t.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-primary-600" />}
          </div>
        ))}
      </div>
    </div>
  )
}

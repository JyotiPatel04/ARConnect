import { Briefcase, ShieldCheck, Sparkles, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import useDocumentTitle from '../../hooks/useDocumentTitle'

const points = [
  { icon: ShieldCheck, label: 'Verified employers only' },
  { icon: Sparkles, label: 'AI-matched job recommendations' },
  { icon: MessageCircle, label: 'Chat with recruiters — Coming Soon' },
]

export default function CandidateOnboardingPage() {
  useDocumentTitle('Welcome')

  return (
    <div className="flex flex-col items-center gap-6 py-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-900">
        <Briefcase size={28} className="text-white" />
      </div>
      <div>
        <h1 className="text-xl font-extrabold text-navy-900">
          Welcome to AR<span className="text-primary-600">Connect</span>
        </h1>
        <p className="mt-1.5 max-w-xs text-sm text-navy-500">
          Find verified jobs near you and get hired faster with AI matching.
        </p>
      </div>

      <div className="w-full max-w-xs space-y-2.5">
        {points.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-white px-3.5 py-2.5 text-left shadow-soft"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <Icon size={15} strokeWidth={2.25} />
            </span>
            <span className="text-[12.5px] font-semibold text-navy-700">{label}</span>
          </div>
        ))}
      </div>

      <div className="w-full max-w-xs space-y-2.5 pt-2">
        <Link to="/candidate/home">
          <Button className="w-full">Continue with Mobile Number</Button>
        </Link>
        <Link to="/employer" className="block text-center text-[12.5px] font-semibold text-navy-500">
          I&apos;m an Employer →
        </Link>
      </div>
    </div>
  )
}

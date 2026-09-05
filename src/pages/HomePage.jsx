import { Briefcase, Users, ShieldCheck, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import useAuth from '../hooks/useAuth'
import useDocumentTitle from '../hooks/useDocumentTitle'

export default function HomePage() {
  useDocumentTitle('Home')
  const { user, role } = useAuth()
  // A brand-new visitor clicking this should land somewhere that actually
  // starts sign-up, not a protected route that just bounces them to a
  // login wall. An already-authenticated candidate skips registration and
  // goes straight to their own dashboard instead.
  const candidateCtaTarget = user && role === 'candidate' ? '/candidate/home' : '/auth/register'

  return (
    <div className="min-h-screen bg-[#f4f5f9]">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900">
              <Briefcase size={16} className="text-white" />
            </div>
            <span className="text-sm font-extrabold text-navy-900">
              AR<span className="text-primary-600">Connect</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth/login">
              <Button size="sm" variant="secondary">Log In</Button>
            </Link>
            <Link to="/auth/register">
              <Button size="sm">Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-16 text-center sm:py-24">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3.5 py-1.5 text-xs font-bold text-primary-600">
          <Sparkles size={13} /> AI-Powered Verified Job Platform
        </span>
        <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-navy-900 sm:text-5xl">
          Find verified jobs. Connect directly. Get hired.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-navy-500 sm:text-[15px]">
          An AI-powered job marketplace that connects blue &amp; grey-collar candidates with
          verified employers — with smart matching, direct chat, and safe hiring built in.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link to={candidateCtaTarget}>
            <Button icon={Users}>I&apos;m looking for a job</Button>
          </Link>
          <Link to="/employer">
            <Button icon={Briefcase} variant="secondary">I&apos;m hiring</Button>
          </Link>
        </div>

        <div className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, label: 'Verified Employers Only' },
            { icon: Sparkles, label: 'AI Job Matching' },
            { icon: Users, label: 'Direct Chat with Recruiters' },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <Icon size={16} strokeWidth={2.25} />
              </span>
              <span className="text-xs font-semibold text-navy-700">{label}</span>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-slate-200 py-6 text-center">
        <Link to="/prototype" className="text-xs font-semibold text-navy-400 hover:text-primary-600">
          View the full design prototype →
        </Link>
      </footer>
    </div>
  )
}

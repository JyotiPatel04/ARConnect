import { Briefcase } from 'lucide-react'
import Overview from './components/sections/Overview'
import CandidateApp from './components/sections/CandidateApp'
import DiscoveryFlow from './components/sections/DiscoveryFlow'
import EmployerPortal from './components/sections/EmployerPortal'
import AiMatching from './components/sections/AiMatching'
import AdminDashboard from './components/sections/AdminDashboard'
import TrustSafety from './components/sections/TrustSafety'
import ChatInterview from './components/sections/ChatInterview'
import DesignSystem from './components/sections/DesignSystem'

const navLinks = [
  { href: '#overview', label: 'Overview' },
  { href: '#candidate-app', label: 'Candidate App' },
  { href: '#discovery-flow', label: 'Job Flow' },
  { href: '#employer-portal', label: 'Employer Portal' },
  { href: '#ai-matching', label: 'AI Matching' },
  { href: '#admin-dashboard', label: 'Admin' },
  { href: '#trust-safety', label: 'Trust & Safety' },
  { href: '#chat-interview', label: 'Chat' },
  { href: '#design-system', label: 'Design System' },
]

function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900">
            <Briefcase size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-extrabold leading-tight text-navy-900">
              ARConnect <span className="font-semibold text-navy-400">— UI/UX Prototype</span>
            </p>
            <p className="text-[10.5px] text-navy-400">
              Product design board · Prepared for mentor review · 29 Aug 2026
            </p>
          </div>
        </div>
        <nav className="no-scrollbar hidden max-w-[55%] items-center gap-4 overflow-x-auto lg:flex">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="whitespace-nowrap text-[12px] font-semibold text-navy-500 hover:text-primary-600"
            >
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="mx-auto max-w-[1400px] px-5 pb-14 pt-6 text-center sm:px-8">
      <p className="text-xs font-semibold text-navy-400">
        ARConnect — AI-Powered Verified Job Platform · UI/UX Prototype v1.0
      </p>
      <p className="mt-1 text-[11px] text-navy-400">
        Built with React · Vite · Tailwind CSS · Lucide Icons — for mentor design review only.
      </p>
    </footer>
  )
}

function App() {
  return (
    <div className="min-h-screen bg-[#f4f5f9] bg-dot-grid">
      <TopBar />
      <main className="mx-auto flex max-w-[1400px] flex-col gap-16 px-5 pt-12 sm:px-8 lg:gap-20">
        <Overview />
        <CandidateApp />
        <DiscoveryFlow />
        <EmployerPortal />
        <AiMatching />
        <AdminDashboard />
        <TrustSafety />
        <ChatInterview />
        <DesignSystem />
      </main>
      <Footer />
    </div>
  )
}

export default App

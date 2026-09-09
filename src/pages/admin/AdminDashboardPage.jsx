import { Users, GraduationCap, Building2, Briefcase, Zap, Lock, Award, ClipboardList, CalendarDays, ShieldAlert, AlertCircle } from 'lucide-react'
import DashboardCard from '../../components/ui/DashboardCard'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useAdminStats from '../../hooks/useAdminStats'
import { APPLICATION_STATUSES } from '../../services/employerApplicationService'

const CARDS = [
  { key: 'totalUsers', label: 'Total Users', icon: Users, tone: 'default' },
  { key: 'totalCandidates', label: 'Candidates', icon: GraduationCap, tone: 'default' },
  { key: 'totalEmployers', label: 'Employers', icon: Building2, tone: 'default' },
  { key: 'totalJobs', label: 'Total Jobs', icon: Briefcase, tone: 'default' },
  { key: 'activeJobs', label: 'Active Jobs', icon: Zap, tone: 'success' },
  { key: 'closedJobs', label: 'Closed Jobs', icon: Lock, tone: 'default' },
  { key: 'totalApplications', label: 'Applications', icon: ClipboardList, tone: 'warning' },
  { key: 'totalInterviews', label: 'Interviews', icon: CalendarDays, tone: 'default' },
  { key: 'totalHired', label: 'Hired / Selected', icon: Award, tone: 'success' },
  { key: 'pendingVerifications', label: 'Pending Verifications', icon: ShieldAlert, tone: 'warning' },
]

export default function AdminDashboardPage() {
  useDocumentTitle('Dashboard')
  const { stats, loading, error } = useAdminStats()

  return (
    <div>
      <PageHeader title="Platform Overview" subtitle="Real-time counts from Firestore" />

      {loading && <p className="py-8 text-center text-sm text-navy-400">Loading platform statistics...</p>}

      {!loading && error && (
        <EmptyState
          icon={AlertCircle}
          tone="error"
          title="Couldn't load platform statistics"
          subtitle="Please check your connection and try again."
        />
      )}

      {!loading && !error && stats && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {CARDS.map((c) => (
              <DashboardCard key={c.key} label={c.label} value={stats[c.key]} icon={c.icon} tone={c.tone} />
            ))}
          </div>

          {/* A simple status-count summary over applications platform-wide
              -- same chip-row pattern as EmployerDashboardPage's Candidate
              Pipeline, not a new UI system. 'withdrawn' isn't included,
              same scope as APPLICATION_STATUSES' existing usage elsewhere. */}
          <div className="mt-5">
            <h2 className="text-[13px] font-bold text-navy-900">Applications by Status</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {APPLICATION_STATUSES.map((status) => (
                <div
                  key={status}
                  className="flex items-center gap-1.5 rounded-full border border-slate-100 bg-white py-1 pl-1 pr-2.5 shadow-soft"
                >
                  <StatusBadge status={status} />
                  <span className="text-[11px] font-bold text-navy-700">{stats.applicationsByStatus[status]}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

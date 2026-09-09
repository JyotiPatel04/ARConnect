import { Users, GraduationCap, Building2, Briefcase, Zap, ClipboardList, ShieldAlert, AlertCircle } from 'lucide-react'
import DashboardCard from '../../components/ui/DashboardCard'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useAdminStats from '../../hooks/useAdminStats'

const CARDS = [
  { key: 'totalUsers', label: 'Total Users', icon: Users, tone: 'default' },
  { key: 'totalCandidates', label: 'Candidates', icon: GraduationCap, tone: 'default' },
  { key: 'totalEmployers', label: 'Employers', icon: Building2, tone: 'default' },
  { key: 'totalJobs', label: 'Total Jobs', icon: Briefcase, tone: 'default' },
  { key: 'activeJobs', label: 'Active Jobs', icon: Zap, tone: 'success' },
  { key: 'totalApplications', label: 'Applications', icon: ClipboardList, tone: 'warning' },
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CARDS.map((c) => (
            <DashboardCard key={c.key} label={c.label} value={stats[c.key]} icon={c.icon} tone={c.tone} />
          ))}
        </div>
      )}
    </div>
  )
}

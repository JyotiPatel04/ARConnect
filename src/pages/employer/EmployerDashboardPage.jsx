import { useMemo, useState } from 'react'
import { Briefcase, ClipboardList, AlertTriangle, Users, Plus, AlertCircle, ArrowRight, Building2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import DashboardCard from '../../components/ui/DashboardCard'
import ApplicationRow from '../../components/employer/ApplicationRow'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/PageHeader'
import Button from '../../components/ui/Button'
import useAuth from '../../hooks/useAuth'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useEmployerJobs from '../../hooks/useEmployerJobs'
import useEmployerApplications from '../../hooks/useEmployerApplications'
import useCompanyProfile from '../../hooks/useCompanyProfile'
import { calculateCompanyProfileCompletion } from '../../lib/companyProfileCompletion'

export default function EmployerDashboardPage() {
  useDocumentTitle('Dashboard')
  const { profile } = useAuth()
  const { jobs, loading: jobsLoading, error: jobsError } = useEmployerJobs()
  const {
    applications,
    interviewsByApplicationId,
    loading: appsLoading,
    error: appsError,
    updateStatus,
    refetch: refetchApplications,
  } = useEmployerApplications()
  const { profile: companyProfile, loading: companyProfileLoading } = useCompanyProfile()
  const [updatingId, setUpdatingId] = useState(null)
  const companyCompletion = calculateCompanyProfileCompletion(companyProfile)

  const loading = jobsLoading || appsLoading
  const error = jobsError || appsError

  const stats = useMemo(() => {
    const activeJobs = jobs.filter((j) => j.status === 'active').length
    const jobIdsNeedingAttention = new Set(
      applications.filter((a) => a.status === 'applied').map((a) => a.jobId)
    )
    return {
      activeJobs,
      totalApplications: applications.length,
      needingAttention: jobIdsNeedingAttention.size,
    }
  }, [jobs, applications])

  const recentApplications = applications.slice(0, 5)

  async function handleStatusChange(applicationId, status) {
    setUpdatingId(applicationId)
    try {
      await updateStatus(applicationId, status)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Employer Dashboard"
        subtitle={`Welcome back, ${profile?.full_name || 'there'}`}
        action={
          <Link to="/employer/jobs/new">
            <Button size="sm" icon={Plus}>
              Post a Job
            </Button>
          </Link>
        }
      />

      {loading && <p className="py-8 text-center text-sm text-navy-400">Loading dashboard...</p>}

      {!loading && error && (
        <EmptyState icon={AlertCircle} tone="error" title="Couldn't load dashboard" subtitle="Please check your connection and try again." />
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <DashboardCard label="Active Jobs" value={stats.activeJobs} icon={Briefcase} />
            <DashboardCard label="Total Applications" value={stats.totalApplications} icon={ClipboardList} />
            <DashboardCard
              label="Jobs Needing Attention"
              value={stats.needingAttention}
              icon={AlertTriangle}
              tone={stats.needingAttention > 0 ? 'warning' : 'default'}
            />
          </div>

          {!companyProfileLoading && (
            <Link
              to="/employer/company"
              className="mt-5 flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-soft hover:border-primary-200"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  <Building2 size={16} strokeWidth={2.25} />
                </span>
                <div>
                  <p className="text-[13px] font-bold text-navy-900">Company Profile</p>
                  <p className="text-xs text-navy-500">
                    {companyCompletion.percent}% complete
                    {companyCompletion.percent < 100 ? ' — complete your profile' : ''}
                  </p>
                </div>
              </div>
              <ArrowRight size={16} className="text-navy-400" />
            </Link>
          )}

          <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
            <h2 className="text-[13px] font-bold text-navy-900">Recent Applications</h2>
            {recentApplications.length === 0 ? (
              <div className="mt-3">
                <EmptyState icon={Users} title="No applications yet" subtitle="They'll show up here as candidates apply." />
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {recentApplications.map((a) => (
                  <ApplicationRow
                    key={a.id}
                    application={a}
                    interview={interviewsByApplicationId.get(a.id) ?? null}
                    onInterviewChange={refetchApplications}
                    onStatusChange={handleStatusChange}
                    updating={updatingId === a.id}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

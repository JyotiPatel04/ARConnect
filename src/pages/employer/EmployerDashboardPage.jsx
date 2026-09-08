import { useMemo, useState } from 'react'
import {
  Briefcase,
  ClipboardList,
  AlertTriangle,
  Users,
  Plus,
  AlertCircle,
  ArrowRight,
  Building2,
  Star,
  CalendarDays,
  Bell,
  MessageCircle,
  ExternalLink,
  MapPin,
  Video,
  Phone,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import DashboardCard from '../../components/ui/DashboardCard'
import ApplicationRow from '../../components/employer/ApplicationRow'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/PageHeader'
import Button from '../../components/ui/Button'
import StatusBadge from '../../components/ui/StatusBadge'
import useAuth from '../../hooks/useAuth'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useEmployerJobs from '../../hooks/useEmployerJobs'
import useEmployerApplications from '../../hooks/useEmployerApplications'
import useEmployerInterviews from '../../hooks/useEmployerInterviews'
import useCompanyProfile from '../../hooks/useCompanyProfile'
import useNotifications from '../../hooks/useNotifications'
import useConversations from '../../hooks/useConversations'
import { calculateCompanyProfileCompletion } from '../../lib/companyProfileCompletion'
import { selectUpcomingInterviews } from '../../lib/upcomingInterviews'
import { INTERVIEW_TYPE_LABELS } from '../../lib/interviewForm'

// Every status an application can actually carry (employer-set statuses
// from employerApplicationService.APPLICATION_STATUSES, plus the
// candidate-set 'withdrawn') -- no invented statuses. StatusBadge already
// owns the label/color for each one, reused directly below rather than
// duplicating label text a third time in this file.
const PIPELINE_STATUSES = ['applied', 'reviewing', 'shortlisted', 'interview', 'rejected', 'hired', 'withdrawn']

const INTERVIEW_TYPE_ICONS = { online: Video, phone: Phone, in_person: MapPin }

function UpcomingInterviewRow({ interview }) {
  const Icon = INTERVIEW_TYPE_ICONS[interview.interviewType] || CalendarDays
  const date = interview.scheduledAt?.toDate?.()
  return (
    <Link
      to="/employer/interviews"
      className="block rounded-xl border border-slate-100 bg-white p-3.5 shadow-soft hover:border-primary-200"
    >
      <p className="truncate text-[13px] font-bold text-navy-900">{interview.candidateName || 'Candidate'}</p>
      <p className="text-xs text-navy-500">{interview.jobTitle || 'Job'}</p>
      {date && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-navy-500">
          <CalendarDays size={13} className="text-primary-600" />
          {date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
          {' · '}
          {date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
        </p>
      )}
      <p className="mt-1 flex items-center gap-1.5 text-[11px] text-navy-500">
        <Icon size={13} className="text-primary-600" /> {INTERVIEW_TYPE_LABELS[interview.interviewType]}
        {interview.interviewType === 'online' && interview.meetingLink && (
          <span className="inline-flex items-center gap-1 text-primary-600">
            <ExternalLink size={12} /> Meeting link ready
          </span>
        )}
        {interview.interviewType === 'in_person' && interview.location && <span>· {interview.location}</span>}
      </p>
    </Link>
  )
}

function QuickLinkCard({ to, icon: Icon, label, detail, badgeCount }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3.5 shadow-soft hover:border-primary-200"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
          <Icon size={14} />
          {badgeCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
              {badgeCount > 9 ? '9+' : badgeCount}
            </span>
          )}
        </span>
        <div className="min-w-0">
          <p className="text-[12.5px] font-bold text-navy-900">{label}</p>
          <p className="truncate text-[11px] text-navy-500">{detail}</p>
        </div>
      </div>
      <ArrowRight size={14} className="shrink-0 text-navy-400" />
    </Link>
  )
}

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
  const { interviews, loading: interviewsLoading, error: interviewsError } = useEmployerInterviews()
  const { profile: companyProfile, loading: companyProfileLoading } = useCompanyProfile()
  const { unreadCount: notificationsUnread, loading: notificationsLoading } = useNotifications()
  const { unreadCount: chatUnread, loading: chatLoading } = useConversations()
  const [updatingId, setUpdatingId] = useState(null)
  const companyCompletion = calculateCompanyProfileCompletion(companyProfile)

  // The 4 primary stat cards live in one shared block (same as the
  // page's original design) -- extending the existing jobs+applications
  // gate to also include interviews keeps all 4 numbers appearing
  // together atomically, rather than mixing loaded and not-yet-loaded
  // stats in the same row.
  const loading = jobsLoading || appsLoading || interviewsLoading
  const error = jobsError || appsError || interviewsError

  const stats = useMemo(() => {
    const activeJobs = jobs.filter((j) => j.status === 'active').length
    const jobIdsNeedingAttention = new Set(
      applications.filter((a) => a.status === 'applied').map((a) => a.jobId)
    )
    const shortlisted = applications.filter((a) => a.status === 'shortlisted').length
    return {
      activeJobs,
      totalApplications: applications.length,
      needingAttention: jobIdsNeedingAttention.size,
      shortlisted,
    }
  }, [jobs, applications])

  // Lazy initializer runs once at mount -- same pattern already used by
  // CandidateHomePage/CandidateInterviewsPage for the identical "what
  // counts as upcoming" question.
  const [now] = useState(() => Date.now())
  // Full sorted upcoming list (no cap) so the stat card's count and the
  // section's displayed list (sliced to 3 below) can never disagree.
  const upcomingInterviewsAll = useMemo(
    () => selectUpcomingInterviews(interviews, now, Infinity),
    [interviews, now]
  )
  const upcomingInterviewsTop3 = upcomingInterviewsAll.slice(0, 3)

  const activeJobsTop3 = useMemo(() => jobs.filter((j) => j.status === 'active').slice(0, 3), [jobs])

  const pipelineCounts = useMemo(() => {
    const counts = {}
    for (const status of PIPELINE_STATUSES) counts[status] = 0
    for (const a of applications) {
      if (counts[a.status] != null) counts[a.status] += 1
    }
    return counts
  }, [applications])

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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <DashboardCard label="Active Jobs" value={stats.activeJobs} icon={Briefcase} />
            <DashboardCard label="Total Applications" value={stats.totalApplications} icon={ClipboardList} />
            <DashboardCard label="Shortlisted" value={stats.shortlisted} icon={Star} />
            <DashboardCard label="Upcoming Interviews" value={upcomingInterviewsAll.length} icon={CalendarDays} />
          </div>

          {/* Jobs Needing Attention -- same calculation as before, moved out
              of the primary 4-stat row (now reserved for the 4 required
              stats) into its own compact secondary card. */}
          <div className="mt-3 sm:max-w-xs">
            <DashboardCard
              label="Jobs Needing Attention"
              value={stats.needingAttention}
              icon={AlertTriangle}
              tone={stats.needingAttention > 0 ? 'warning' : 'default'}
            />
          </div>

          {/* Quick Actions */}
          <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <Link to="/employer/jobs/new" className="block">
              <Button variant="secondary" icon={Plus} className="w-full">
                Post New Job
              </Button>
            </Link>
            <Link to="/employer/jobs" className="block">
              <Button variant="secondary" icon={Briefcase} className="w-full">
                Manage Jobs
              </Button>
            </Link>
            <Link to="/employer/applications" className="block">
              <Button variant="secondary" icon={ClipboardList} className="w-full">
                View Applications
              </Button>
            </Link>
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

          {/* Active Jobs mini-list -- reuses the same jobs already loaded
              above, no new query. */}
          {activeJobsTop3.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-bold text-navy-900">Active Jobs</h2>
                <Link to="/employer/jobs" className="text-xs font-semibold text-primary-600">
                  See all
                </Link>
              </div>
              <div className="mt-3 space-y-2">
                {activeJobsTop3.map((job) => (
                  <Link
                    key={job.id}
                    to={`/employer/jobs/${job.id}`}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-white p-3.5 shadow-soft hover:border-primary-200"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-bold text-navy-900">{job.title}</p>
                      <p className="text-xs text-navy-500">{job.location}</p>
                    </div>
                    <span className="shrink-0 text-[11px] font-semibold text-navy-500">
                      {job.applicationCount || 0} application{job.applicationCount === 1 ? '' : 's'}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Candidate Pipeline -- a simple status-count summary over
              already-loaded applications, not a Kanban board. */}
          {applications.length > 0 && (
            <div className="mt-5">
              <h2 className="text-[13px] font-bold text-navy-900">Candidate Pipeline</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {PIPELINE_STATUSES.map((status) => (
                  <div
                    key={status}
                    className="flex items-center gap-1.5 rounded-full border border-slate-100 bg-white py-1 pl-1 pr-2.5 shadow-soft"
                  >
                    <StatusBadge status={status} />
                    <span className="text-[11px] font-bold text-navy-700">{pipelineCounts[status]}</span>
                  </div>
                ))}
              </div>
            </div>
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

          {/* Upcoming Interviews -- distinct from application.status ===
              'interview' (the stat card above counts application pipeline
              stage; this is the actual interviews collection, filtered to
              status === 'scheduled' and still in the future). */}
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-navy-900">Upcoming Interviews</h2>
              <Link to="/employer/interviews" className="text-xs font-semibold text-primary-600">
                See all
              </Link>
            </div>
            <div className="mt-3">
              {upcomingInterviewsTop3.length === 0 ? (
                <EmptyState icon={CalendarDays} title="No upcoming interviews" subtitle="Interviews you schedule with candidates will show up here." />
              ) : (
                <div className="space-y-2">
                  {upcomingInterviewsTop3.map((iv) => (
                    <UpcomingInterviewRow key={iv.id} interview={iv} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notifications / Chat quick links */}
          <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <QuickLinkCard
              to="/employer/notifications"
              icon={Bell}
              label="Notifications"
              detail={notificationsLoading ? 'Loading...' : notificationsUnread > 0 ? `${notificationsUnread} unread` : 'All caught up'}
              badgeCount={notificationsUnread}
            />
            <QuickLinkCard
              to="/employer/chat"
              icon={MessageCircle}
              label="Chat"
              detail={chatLoading ? 'Loading...' : chatUnread > 0 ? `${chatUnread} unread` : 'All caught up'}
              badgeCount={chatUnread}
            />
          </div>
        </>
      )}
    </div>
  )
}

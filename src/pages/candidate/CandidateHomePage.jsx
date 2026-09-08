import { useMemo, useState } from 'react'
import {
  Search,
  Sparkles,
  AlertCircle,
  User,
  ArrowRight,
  ClipboardList,
  Clock,
  CalendarDays,
  CheckCircle2,
  Bell,
  MessageCircle,
  ExternalLink,
  MapPin,
  Video,
  Phone,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import JobCard from '../../components/ui/JobCard'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/PageHeader'
import DashboardCard from '../../components/ui/DashboardCard'
import StatusBadge from '../../components/ui/StatusBadge'
import MatchBadge from '../../components/ui/MatchBadge'
import useAuth from '../../hooks/useAuth'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useJobs from '../../hooks/useJobs'
import useSavedJobs from '../../hooks/useSavedJobs'
import useCandidateProfile from '../../hooks/useCandidateProfile'
import useMyApplications from '../../hooks/useMyApplications'
import useCandidateInterviews from '../../hooks/useCandidateInterviews'
import useNotifications from '../../hooks/useNotifications'
import useConversations from '../../hooks/useConversations'
import useJobAlertPreferences from '../../hooks/useJobAlertPreferences'
import useRecommendedJobs from '../../hooks/useRecommendedJobs'
import { toJobCardProps, formatRelativeTime } from '../../lib/format'
import { JOB_TYPES } from '../../lib/jobOptions'
import { calculateProfileCompletion } from '../../lib/profileCompletion'
import { computeApplicationStats } from '../../lib/applicationStats'
import { selectUpcomingInterviews } from '../../lib/upcomingInterviews'
import { INTERVIEW_TYPE_LABELS } from '../../lib/interviewForm'

const INTERVIEW_TYPE_ICONS = { online: Video, phone: Phone, in_person: MapPin }

function UpcomingInterviewRow({ interview }) {
  const Icon = INTERVIEW_TYPE_ICONS[interview.interviewType] || CalendarDays
  const date = interview.scheduledAt?.toDate?.()
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-soft">
      <p className="truncate text-[13px] font-bold text-navy-900">{interview.jobTitle || 'Interview'}</p>
      {interview.companyName && <p className="text-xs text-navy-500">{interview.companyName}</p>}
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
      </p>
      {interview.interviewType === 'online' && interview.meetingLink && (
        <a
          href={interview.meetingLink}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-primary-600 hover:underline"
        >
          <ExternalLink size={13} /> Join meeting
        </a>
      )}
    </div>
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

export default function CandidateHomePage() {
  useDocumentTitle('Home')
  const { profile } = useAuth()
  const { jobs, loading: jobsLoading, error: jobsError } = useJobs()
  const { isSaved, saveJob, unsaveJob } = useSavedJobs()
  const { profile: candidateProfile, loading: candidateProfileLoading } = useCandidateProfile()
  const { applications, loading: applicationsLoading, error: applicationsError } = useMyApplications()
  const { interviews, loading: interviewsLoading, error: interviewsError } = useCandidateInterviews()
  const { notifications, unreadCount: notificationsUnread, loading: notificationsLoading } = useNotifications()
  const { unreadCount: chatUnread, loading: chatLoading } = useConversations()
  const { preferences: jobAlertPreferences, loading: jobAlertsLoading } = useJobAlertPreferences()
  const [saveError, setSaveError] = useState('')

  const completion = calculateProfileCompletion(candidateProfile)
  const stats = useMemo(() => computeApplicationStats(applications), [applications])
  const recentApplications = applications.slice(0, 5)

  // Lazy initializer runs once at mount -- same pattern already used by
  // CandidateInterviewsPage for the identical "what counts as upcoming"
  // question, so a candidate looking at both pages in the same session
  // sees a consistent cutoff rather than it silently drifting mid-visit.
  const [now] = useState(() => Date.now())
  const upcomingInterviews = useMemo(() => selectUpcomingInterviews(interviews, now, 3), [interviews, now])

  const appliedJobIds = useMemo(() => new Set(applications.map((a) => a.jobId)), [applications])
  // appliedJobIds is only trustworthy once applications has actually
  // finished loading -- gating on jobs/profile alone let a just-applied
  // job race back into its own recommendations for one render.
  const { recommendations, loading: recommendationsLoading } = useRecommendedJobs(
    jobs,
    candidateProfile,
    appliedJobIds,
    jobsLoading || candidateProfileLoading || applicationsLoading
  )

  // Job Alerts already writes its match notifications into this same,
  // already-loaded notifications array (type: 'job_alert_match') -- no
  // second query, no new collection read, just a client-side filter.
  const jobAlertMatchCount = useMemo(
    () => notifications.filter((n) => n.type === 'job_alert_match' && !n.read).length,
    [notifications]
  )

  const recent = jobs.slice(0, 4)

  async function handleToggleSave(job) {
    setSaveError('')
    try {
      if (isSaved(job.id)) {
        await unsaveJob(job.id)
      } else {
        await saveJob(job)
      }
    } catch (err) {
      setSaveError(err.message || 'Something went wrong. Please try again.')
    }
  }

  return (
    <div>
      <PageHeader title={`Welcome back, ${profile?.full_name || 'there'}`} subtitle="Find your next opportunity." />

      {/* Application Statistics -- an error here doesn't block the rest of
          the page; every section below manages its own loading/error
          state independently. */}
      {applicationsLoading && <p className="py-4 text-center text-sm text-navy-400">Loading your applications...</p>}
      {!applicationsLoading && applicationsError && (
        <EmptyState
          icon={AlertCircle}
          tone="error"
          title="Couldn't load your applications"
          subtitle="Please check your connection and try again."
        />
      )}
      {!applicationsLoading && !applicationsError && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <DashboardCard label="Total Applications" value={stats.total} icon={ClipboardList} />
          <DashboardCard label="Active / Under Review" value={stats.active} icon={Clock} />
          <DashboardCard label="Interviews" value={stats.interviews} icon={CalendarDays} />
          <DashboardCard label="Selected" value={stats.selected} icon={CheckCircle2} tone="success" />
        </div>
      )}

      {/* Profile Completion */}
      {!candidateProfileLoading && (
        <Link
          to="/candidate/profile"
          className="mt-3 flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-soft hover:border-primary-200"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <User size={16} strokeWidth={2.25} />
            </span>
            <div>
              <p className="text-[13px] font-bold text-navy-900">Profile Completion</p>
              <p className="text-xs text-navy-500">
                {completion.percent}% complete
                {completion.percent < 100 ? ' — help employers find you' : ''}
              </p>
            </div>
          </div>
          <ArrowRight size={16} className="text-navy-400" />
        </Link>
      )}

      {/* Recent Applications */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-navy-900">Recent Applications</h2>
          <Link to="/candidate/applications" className="text-xs font-semibold text-primary-600">
            See all
          </Link>
        </div>
        <div className="mt-3">
          {applicationsLoading && <p className="py-4 text-center text-sm text-navy-400">Loading...</p>}
          {!applicationsLoading && !applicationsError && recentApplications.length === 0 && (
            <EmptyState icon={ClipboardList} title="No applications yet" subtitle="Jobs you apply to will show up here." />
          )}
          {!applicationsLoading && !applicationsError && recentApplications.length > 0 && (
            <div className="space-y-2">
              {recentApplications.map((a) => (
                <Link
                  key={a.id}
                  to={`/candidate/jobs/${a.jobId}`}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-white p-3.5 shadow-soft"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-bold text-navy-900">{a.jobTitle}</p>
                    <p className="text-xs text-navy-500">{a.companyName}</p>
                    <p className="mt-0.5 text-[10.5px] text-navy-400">Applied {formatRelativeTime(a.appliedAt?.toDate?.())}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Interviews -- application.status === 'interview' (the
          stat card above) is a pipeline stage on the application; this
          section is the actual interviews collection, filtered to
          status === 'scheduled' and still in the future. The two counts
          can legitimately differ. */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-navy-900">Upcoming Interviews</h2>
          <Link to="/candidate/interviews" className="text-xs font-semibold text-primary-600">
            See all
          </Link>
        </div>
        <div className="mt-3">
          {interviewsLoading && <p className="py-4 text-center text-sm text-navy-400">Loading...</p>}
          {!interviewsLoading && interviewsError && (
            <EmptyState
              icon={AlertCircle}
              tone="error"
              title="Couldn't load interviews"
              subtitle="Please check your connection and try again."
            />
          )}
          {!interviewsLoading && !interviewsError && upcomingInterviews.length === 0 && (
            <EmptyState icon={CalendarDays} title="No upcoming interviews" subtitle="Interviews employers schedule with you will show up here." />
          )}
          {!interviewsLoading && !interviewsError && upcomingInterviews.length > 0 && (
            <div className="space-y-2">
              {upcomingInterviews.map((iv) => (
                <UpcomingInterviewRow key={iv.id} interview={iv} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recommended Jobs -- at most 3 computeMatch calls, chosen via a
          cheap client-side shortlist heuristic (see
          lib/dashboardRecommendations.js), never per active job. A job
          whose match call fails still renders via JobCard, just without a
          MatchBadge -- one failed score never hides the recommendation
          itself. */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-navy-900">
            <Sparkles size={14} className="text-primary-600" /> Recommended For You
          </h2>
          <Link to="/candidate/jobs" className="text-xs font-semibold text-primary-600">
            Browse all
          </Link>
        </div>
        <div className="mt-3 space-y-3">
          {recommendationsLoading && <p className="py-4 text-center text-sm text-navy-400">Finding jobs for you...</p>}
          {!recommendationsLoading && recommendations.length === 0 && (
            <EmptyState icon={Search} title="No recommendations yet" subtitle="Check back once more jobs are posted." />
          )}
          {!recommendationsLoading &&
            recommendations.map(({ job, match }) => (
              <div key={job.id}>
                <Link to={`/candidate/jobs/${job.id}`}>
                  <JobCard
                    job={toJobCardProps(job)}
                    compact
                    isSaved={isSaved(job.id)}
                    onToggleSave={(e) => {
                      e.preventDefault()
                      handleToggleSave(job)
                    }}
                  />
                </Link>
                {match?.score != null && (
                  <div className="mt-1.5 flex justify-end">
                    <MatchBadge value={match.score} />
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Job Alerts / Notifications / Chat quick links */}
      <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <QuickLinkCard
          to="/candidate/job-alerts"
          icon={Bell}
          label="Job Alerts"
          detail={
            jobAlertsLoading
              ? 'Loading...'
              : jobAlertPreferences?.enabled
                ? jobAlertMatchCount > 0
                  ? `On · ${jobAlertMatchCount} new match${jobAlertMatchCount === 1 ? '' : 'es'}`
                  : 'On'
                : 'Off'
          }
        />
        <QuickLinkCard
          to="/candidate/notifications"
          icon={Bell}
          label="Notifications"
          detail={notificationsLoading ? 'Loading...' : notificationsUnread > 0 ? `${notificationsUnread} unread` : 'All caught up'}
          badgeCount={notificationsUnread}
        />
        <QuickLinkCard
          to="/candidate/chat"
          icon={MessageCircle}
          label="Chat"
          detail={chatLoading ? 'Loading...' : chatUnread > 0 ? `${chatUnread} unread` : 'All caught up'}
          badgeCount={chatUnread}
        />
      </div>

      {/* Existing job discovery content, reorganized to appear after the
          dashboard sections above -- kept, not removed. */}
      <Link
        to="/candidate/jobs"
        className="mt-6 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-3 shadow-soft"
      >
        <Search size={16} className="text-navy-400" />
        <span className="text-sm text-navy-400">Search jobs, companies...</span>
      </Link>

      <div className="mt-3 rounded-2xl bg-primary-600 p-4 text-white shadow-soft">
        <p className="flex items-center gap-1.5 text-sm font-bold">
          <Sparkles size={14} /> {jobs.length} open jobs waiting for you
        </p>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
        {JOB_TYPES.map((t) => (
          <Link
            key={t}
            to={`/candidate/jobs?jobType=${encodeURIComponent(t)}`}
            className="whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-navy-700"
          >
            {t}
          </Link>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <h2 className="text-sm font-bold text-navy-900">Browse Jobs</h2>
        <Link to="/candidate/jobs" className="text-xs font-semibold text-primary-600">
          See all
        </Link>
      </div>

      <div className="mt-3 space-y-3">
        {saveError && (
          <p className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
            <AlertCircle size={13} /> {saveError}
          </p>
        )}

        {jobsLoading && <p className="py-8 text-center text-sm text-navy-400">Loading jobs...</p>}

        {!jobsLoading && jobsError && (
          <EmptyState
            icon={AlertCircle}
            tone="error"
            title="Couldn't load jobs right now"
            subtitle="Please check your connection and try again."
          />
        )}

        {!jobsLoading && !jobsError && recent.length === 0 && (
          <EmptyState icon={Search} title="No jobs posted yet" subtitle="Check back soon for new openings." />
        )}

        {!jobsLoading &&
          !jobsError &&
          recent.map((job) => (
            <Link key={job.id} to={`/candidate/jobs/${job.id}`}>
              <JobCard
                job={toJobCardProps(job)}
                compact
                isSaved={isSaved(job.id)}
                onToggleSave={() => handleToggleSave(job)}
              />
            </Link>
          ))}
      </div>
    </div>
  )
}

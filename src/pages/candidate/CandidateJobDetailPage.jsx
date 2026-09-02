import { useState } from 'react'
import { ArrowLeft, Bookmark, Flag, MapPin, Laptop, CheckCircle2, AlertCircle } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import VerifiedBadge from '../../components/ui/VerifiedBadge'
import StatusBadge from '../../components/ui/StatusBadge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import MatchScoreCard from '../../components/shared/MatchScoreCard'
import CompanyInfoCard from '../../components/shared/CompanyInfoCard'
import ReportJobDialog from '../../components/candidate/ReportJobDialog'
import useAuth from '../../hooks/useAuth'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useJob from '../../hooks/useJob'
import useJobMatch from '../../hooks/useJobMatch'
import useCompanySummary from '../../hooks/useCompanySummary'
import useMyApplications from '../../hooks/useMyApplications'
import useSavedJobs from '../../hooks/useSavedJobs'
import { createReport } from '../../services/reportService'
import { formatSalary, formatRelativeTime } from '../../lib/format'

export default function CandidateJobDetailPage() {
  const { jobId } = useParams()
  const { user } = useAuth()
  const { job, loading, error } = useJob(jobId)
  const { match, loading: matchLoading, error: matchError } = useJobMatch(jobId)
  const { summary: companySummary, loading: companySummaryLoading } = useCompanySummary(job?.employerId)
  const { hasApplied, getApplication, applyToJob } = useMyApplications()
  const { isSaved, saveJob, unsaveJob } = useSavedJobs()

  const [applying, setApplying] = useState(false)
  const [applyError, setApplyError] = useState('')
  const [savingBookmark, setSavingBookmark] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [reportError, setReportError] = useState('')
  const [reportSubmitted, setReportSubmitted] = useState(false)

  useDocumentTitle(job?.title || 'Job Details')

  async function handleApply() {
    if (!job) return
    setApplyError('')
    setApplying(true)
    try {
      await applyToJob(job)
    } catch (err) {
      setApplyError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setApplying(false)
    }
  }

  async function handleSubmitReport({ reason, description }) {
    if (!job || !user) return
    setReportSubmitting(true)
    setReportError('')
    try {
      await createReport({ reporterId: user.uid, targetType: 'job', targetId: job.id, reason, description })
      setReportOpen(false)
      setReportSubmitted(true)
    } catch (err) {
      setReportError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setReportSubmitting(false)
    }
  }

  async function handleToggleSave() {
    if (!job) return
    setSavingBookmark(true)
    try {
      if (isSaved(job.id)) {
        await unsaveJob(job.id)
      } else {
        await saveJob(job)
      }
    } finally {
      setSavingBookmark(false)
    }
  }

  if (loading) {
    return <p className="py-16 text-center text-sm text-navy-400">Loading job...</p>
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        tone="error"
        title="Couldn't load this job"
        subtitle="Please check your connection and try again."
      />
    )
  }

  if (!job) {
    return (
      <div>
        <Link to="/candidate/jobs" className="text-navy-900">
          <ArrowLeft size={19} />
        </Link>
        <div className="mt-6">
          <EmptyState title="Job not found" subtitle="This job may have been removed or is no longer active." />
        </div>
      </div>
    )
  }

  const applied = hasApplied(job.id)
  const application = getApplication(job.id)
  const saved = isSaved(job.id)

  return (
    <div>
      <div className="flex items-center justify-between">
        <Link to="/candidate/jobs" className="text-navy-900">
          <ArrowLeft size={19} />
        </Link>
        <span className="text-sm font-bold text-navy-900">Job Details</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            aria-label="Report this job"
            title="Report this job"
            className="text-navy-400 hover:text-red-500"
          >
            <Flag size={17} />
          </button>
          <button
            type="button"
            onClick={handleToggleSave}
            disabled={savingBookmark}
            aria-label={saved ? 'Unsave job' : 'Save job'}
            className={saved ? 'text-primary-600' : 'text-navy-400'}
          >
            <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {reportSubmitted && (
        <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-success-50 px-3 py-2 text-xs font-semibold text-success-700">
          <CheckCircle2 size={13} /> Report submitted. Our admin team will review it.
        </p>
      )}

      <div className="mt-4 flex items-center gap-3">
        {job.companyLogoUrl ? (
          <img
            src={job.companyLogoUrl}
            alt={job.companyName}
            className="h-12 w-12 shrink-0 rounded-xl object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-base font-bold text-primary-600">
            {job.companyName?.charAt(0)}
          </div>
        )}
        <div>
          <h1 className="text-base font-extrabold text-navy-900">{job.title}</h1>
          <p className="text-xs text-navy-500">{job.companyName}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {job.employerVerified && <VerifiedBadge />}
        {applied && <StatusBadge status={application?.status || 'applied'} />}
      </div>

      <p className="mt-3 text-xl font-extrabold text-navy-900">{formatSalary(job.salaryMin, job.salaryMax)}</p>
      <p className="mt-1 flex items-center gap-1 text-xs text-navy-500">
        <MapPin size={13} /> {job.location} · {job.jobType}
      </p>
      {job.workMode && (
        <p className="mt-1 flex items-center gap-1 text-xs text-navy-500">
          <Laptop size={13} /> {job.workMode} {job.experienceLevel && `· ${job.experienceLevel} experience`}
        </p>
      )}
      <p className="mt-1 text-[11px] text-navy-400">Posted {formatRelativeTime(job.createdAt?.toDate?.())}</p>

      <div className="mt-4">
        <MatchScoreCard match={match} loading={matchLoading} error={matchError} />
      </div>

      {job.skills?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {job.skills.map((skill) => (
            <span key={skill} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-navy-600">
              {skill}
            </span>
          ))}
        </div>
      )}

      {job.description && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <h2 className="text-[13px] font-bold text-navy-900">Job Description</h2>
          <p className="mt-2 text-[13px] leading-snug text-navy-500">{job.description}</p>
        </div>
      )}

      {job.responsibilities?.length > 0 && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <h2 className="text-[13px] font-bold text-navy-900">Responsibilities</h2>
          <ul className="mt-2 space-y-1.5 text-[13px] leading-snug text-navy-500">
            {job.responsibilities.map((r) => (
              <li key={r}>• {r}</li>
            ))}
          </ul>
        </div>
      )}

      {job.requirements?.length > 0 && (
        <div className="mt-5 border-t border-slate-100 pt-4 pb-4">
          <h2 className="text-[13px] font-bold text-navy-900">Requirements</h2>
          <ul className="mt-2 space-y-1.5 text-[13px] leading-snug text-navy-500">
            {job.requirements.map((r) => (
              <li key={r}>• {r}</li>
            ))}
          </ul>
        </div>
      )}

      <CompanyInfoCard summary={companySummary} loading={companySummaryLoading} />

      {applyError && (
        <p className="mb-3 flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
          <AlertCircle size={13} /> {applyError}
        </p>
      )}

      {applied ? (
        <Button className="w-full" variant="secondary" disabled icon={CheckCircle2}>
          Applied
        </Button>
      ) : job.status !== 'active' ? (
        <p className="rounded-lg bg-slate-100 px-3 py-2.5 text-center text-xs font-semibold text-navy-500">
          This job is no longer accepting applications.
        </p>
      ) : (
        <Button className="w-full" onClick={handleApply} disabled={applying}>
          {applying ? 'Applying...' : 'Apply Now'}
        </Button>
      )}

      <ReportJobDialog
        open={reportOpen}
        onSubmit={handleSubmitReport}
        onCancel={() => setReportOpen(false)}
        submitting={reportSubmitting}
        error={reportError}
      />
    </div>
  )
}

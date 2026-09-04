import { useState } from 'react'
import { ArrowLeft, AlertCircle, XCircle, RotateCcw, Users } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import JobForm from '../../components/employer/JobForm'
import { jobToFormValues } from '../../lib/jobForm'
import ApplicationRow from '../../components/employer/ApplicationRow'
import AuthAlert from '../../components/auth/AuthAlert'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import useAuth from '../../hooks/useAuth'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useJob from '../../hooks/useJob'
import useEmployerJobs from '../../hooks/useEmployerJobs'
import useEmployerApplications from '../../hooks/useEmployerApplications'

export default function EmployerJobDetailPage() {
  const { jobId } = useParams()
  const { user } = useAuth()
  const { job, loading, error, refetch } = useJob(jobId)
  const { updateJob, closeJob, reopenJob } = useEmployerJobs()
  const {
    forJob,
    interviewsByApplicationId,
    updateStatus,
    loading: appsLoading,
    refetch: refetchApplications,
  } = useEmployerApplications()

  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [confirmingClose, setConfirmingClose] = useState(false)
  const [statusBusy, setStatusBusy] = useState(false)
  const [updatingAppId, setUpdatingAppId] = useState(null)

  useDocumentTitle(job?.title || 'Edit Job')

  if (loading) {
    return <p className="py-16 text-center text-sm text-navy-400">Loading job...</p>
  }

  if (error) {
    return <EmptyState icon={AlertCircle} tone="error" title="Couldn't load this job" subtitle="Please check your connection and try again." />
  }

  if (!job) {
    return (
      <div>
        <Link to="/employer/jobs" className="text-navy-900">
          <ArrowLeft size={19} />
        </Link>
        <div className="mt-6">
          <EmptyState title="Job not found" subtitle="This job may have been deleted." />
        </div>
      </div>
    )
  }

  const isOwner = job.employerId === user?.uid

  if (!isOwner) {
    return (
      <div>
        <Link to="/employer/jobs" className="text-navy-900">
          <ArrowLeft size={19} />
        </Link>
        <div className="mt-6">
          <EmptyState
            icon={AlertCircle}
            tone="error"
            title="You don't have permission to manage this job"
            subtitle="This job belongs to a different employer account."
          />
        </div>
      </div>
    )
  }

  async function handleSubmit(fields) {
    setSubmitting(true)
    try {
      await updateJob(job.id, fields)
      setSuccess(true)
      refetch()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleStatus() {
    setStatusBusy(true)
    try {
      if (job.status === 'active') {
        await closeJob(job.id)
      } else {
        await reopenJob(job.id)
      }
      setConfirmingClose(false)
      refetch()
    } finally {
      setStatusBusy(false)
    }
  }

  async function handleStatusChange(applicationId, status) {
    setUpdatingAppId(applicationId)
    try {
      await updateStatus(applicationId, status)
    } finally {
      setUpdatingAppId(null)
    }
  }

  const jobApplications = forJob(job.id)

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <Link to="/employer/jobs" className="text-navy-900">
          <ArrowLeft size={19} />
        </Link>
        <span
          className={`rounded-full px-2.5 py-1 text-[10.5px] font-bold ${
            job.status === 'active' ? 'bg-success-50 text-success-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {job.status === 'active' ? 'Active' : 'Closed'}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <h1 className="text-lg font-extrabold text-navy-900">Edit Job</h1>
        {job.status === 'active' ? (
          <Button size="sm" variant="secondary" icon={XCircle} onClick={() => setConfirmingClose(true)}>
            Close Job
          </Button>
        ) : (
          <Button size="sm" variant="secondary" icon={RotateCcw} onClick={handleToggleStatus} disabled={statusBusy}>
            Reopen Job
          </Button>
        )}
      </div>

      {success && (
        <div className="mt-3">
          <AuthAlert type="success">Job updated successfully.</AuthAlert>
        </div>
      )}

      <div className="mt-4">
        <JobForm
          key={job.id}
          initialValues={jobToFormValues(job)}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitLabel="Save Changes"
        />
      </div>

      <div className="mt-6 border-t border-slate-100 pt-4">
        <h2 className="flex items-center gap-1.5 text-[13px] font-bold text-navy-900">
          <Users size={14} /> Applications ({jobApplications.length})
        </h2>
        {appsLoading ? (
          <p className="mt-3 text-sm text-navy-400">Loading applications...</p>
        ) : jobApplications.length === 0 ? (
          <div className="mt-3">
            <EmptyState icon={Users} title="No applications yet" subtitle="They'll show up here as candidates apply to this job." />
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {jobApplications.map((a) => (
              <ApplicationRow
                key={a.id}
                application={a}
                interview={interviewsByApplicationId.get(a.id) ?? null}
                onInterviewChange={refetchApplications}
                showJobTitle={false}
                onStatusChange={handleStatusChange}
                updating={updatingAppId === a.id}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmingClose}
        title="Close this job?"
        message={`"${job.title}" will no longer appear in candidate job discovery. You can reopen it anytime.`}
        confirmLabel="Close Job"
        confirming={statusBusy}
        onConfirm={handleToggleStatus}
        onCancel={() => setConfirmingClose(false)}
      />
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import JobForm from '../../components/employer/JobForm'
import AuthAlert from '../../components/auth/AuthAlert'
import Button from '../../components/ui/Button'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useEmployerJobs from '../../hooks/useEmployerJobs'
import useAuth from '../../hooks/useAuth'

export default function EmployerJobNewPage() {
  useDocumentTitle('Post a New Job')
  const { createJob } = useEmployerJobs()
  const { emailVerified, resendVerificationEmail, refreshEmailVerified } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [resendStatus, setResendStatus] = useState('')
  const [checking, setChecking] = useState(false)
  const [checkStatus, setCheckStatus] = useState('')

  async function handleSubmit(fields) {
    setSubmitting(true)
    try {
      const jobId = await createJob(fields)
      setSuccess(true)
      navigate(`/employer/jobs/${jobId}`, { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResend() {
    setResendStatus('')
    try {
      await resendVerificationEmail()
      setResendStatus('Verification email sent — check your inbox.')
    } catch {
      setResendStatus('Could not send the email right now. Please try again shortly.')
    }
  }

  // Reload really does hit Firebase Auth's servers each time (see
  // AuthContext.refreshEmailVerified) -- if this still comes back
  // unverified, that's a genuine, current answer, not stale local state.
  // The most common real-world cause is an email link that was
  // pre-fetched/consumed by an inbox's security scanner before the user
  // themselves clicked it (a well-known Gmail/Outlook gotcha, not specific
  // to this app) -- Resend issues a fresh, not-yet-consumed link. Without
  // this feedback, "still unverified" and "the check itself failed" were
  // indistinguishable from a silent no-op.
  async function handleRefresh() {
    setChecking(true)
    setCheckStatus('')
    try {
      const verified = await refreshEmailVerified()
      if (!verified) {
        setCheckStatus(
          "Still not verified. If you already clicked the link, try resending — some inboxes' " +
            'security scanners can use up a link before you click it yourself.'
        )
      }
    } catch {
      setCheckStatus("Couldn't check your verification status right now. Please try again.")
    } finally {
      setChecking(false)
    }
  }

  // Phase 17: posting a job is gated on a verified email — Firestore rules
  // enforce this too (the real, unbypassable check), this is just the
  // friendly UI-side version so an unverified employer sees a clear
  // explanation instead of a raw permission error after filling out the
  // whole form. Editing/closing/reopening a job the employer already has
  // is deliberately NOT gated — only posting a NEW one.
  if (!emailVerified) {
    return (
      <div className="max-w-md">
        <PageHeader title="Post a New Job" />
        <AuthAlert type="error">
          Please verify your email address before posting a job. We sent a verification link to
          your inbox when you registered.
        </AuthAlert>
        {resendStatus && <p className="mt-2 text-xs text-navy-500">{resendStatus}</p>}
        {checkStatus && <p className="mt-2 text-xs text-navy-500">{checkStatus}</p>}
        <div className="mt-3 flex gap-2">
          <Button type="button" variant="secondary" onClick={handleResend}>
            Resend verification email
          </Button>
          <Button type="button" onClick={handleRefresh} disabled={checking}>
            {checking ? 'Checking...' : "I've verified — refresh"}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md">
      <PageHeader title="Post a New Job" />
      {success && <AuthAlert type="success">Job published — redirecting...</AuthAlert>}
      <JobForm onSubmit={handleSubmit} submitting={submitting} submitLabel="Publish Job" />
    </div>
  )
}

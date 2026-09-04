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

  async function handleRefresh() {
    setChecking(true)
    try {
      await refreshEmailVerified()
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

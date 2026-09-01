import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import JobForm from '../../components/employer/JobForm'
import AuthAlert from '../../components/auth/AuthAlert'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useEmployerJobs from '../../hooks/useEmployerJobs'

export default function EmployerJobNewPage() {
  useDocumentTitle('Post a New Job')
  const { createJob } = useEmployerJobs()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

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

  return (
    <div className="max-w-md">
      <PageHeader title="Post a New Job" />
      {success && <AuthAlert type="success">Job published — redirecting...</AuthAlert>}
      <JobForm onSubmit={handleSubmit} submitting={submitting} submitLabel="Publish Job" />
    </div>
  )
}

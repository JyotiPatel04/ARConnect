import { ShieldCheck } from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'

export default function AdminVerificationsPage() {
  useDocumentTitle('Verifications')

  return (
    <div>
      <PageHeader title="Verifications" subtitle="Coming Soon" />
      <EmptyState
        icon={ShieldCheck}
        title="Verification workflow is not yet available"
        subtitle="Employer and job-post verification is planned for a future release. Check back later."
      />
    </div>
  )
}

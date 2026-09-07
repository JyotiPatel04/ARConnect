import { useState } from 'react'
import { ClipboardList, AlertCircle, MessageCircle, XCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useMyApplications from '../../hooks/useMyApplications'
import { getOrCreateConversation } from '../../services/chatService'
import { formatRelativeTime } from '../../lib/format'

// Mirrors the rule's own list of statuses a candidate may withdraw from —
// once an application is rejected, hired, or already withdrawn, the
// withdraw action is never offered.
const WITHDRAWABLE_STATUSES = ['applied', 'reviewing', 'shortlisted', 'interview']

export default function CandidateApplicationsPage() {
  useDocumentTitle('My Applications')
  const { applications, loading, error, withdraw } = useMyApplications()
  const navigate = useNavigate()
  const [confirmId, setConfirmId] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [messagingId, setMessagingId] = useState(null)
  const [message, setMessage] = useState(null)

  async function handleMessage(application) {
    setMessagingId(application.id)
    try {
      const conversation = await getOrCreateConversation(application)
      navigate(`/candidate/chat/${conversation.id}`)
    } catch (err) {
      setMessage({ id: application.id, type: 'error', text: err.message || 'Could not open chat. Please try again.' })
      setMessagingId(null)
    }
  }

  async function handleWithdrawConfirm() {
    const id = confirmId
    setBusyId(id)
    try {
      await withdraw(id)
      setConfirmId(null)
      setMessage({ id, type: 'success', text: 'Application withdrawn.' })
    } catch (err) {
      setMessage({ id, type: 'error', text: err.message || 'Something went wrong. Please try again.' })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="My Applications"
        subtitle={loading ? 'Loading...' : `${applications.length} jobs applied`}
      />

      {loading && <p className="py-8 text-center text-sm text-navy-400">Loading applications...</p>}

      {!loading && error && (
        <EmptyState
          icon={AlertCircle}
          tone="error"
          title="Couldn't load your applications"
          subtitle="Please check your connection and try again."
        />
      )}

      {!loading && !error && applications.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title="No applications yet"
          subtitle="Jobs you apply to will show up here with their status."
        />
      )}

      {!loading && !error && applications.length > 0 && (
        <div className="space-y-2.5">
          {applications.map((a) => {
            const withdrawable = WITHDRAWABLE_STATUSES.includes(a.status)
            return (
              <div key={a.id} className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-soft">
                <Link to={`/candidate/jobs/${a.jobId}`} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-navy-900">{a.jobTitle}</p>
                    <p className="text-xs text-navy-500">{a.companyName}</p>
                    <p className="mt-0.5 text-[10.5px] text-navy-400">
                      Applied {formatRelativeTime(a.appliedAt?.toDate?.())}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </Link>

                {message?.id === a.id && (
                  <p
                    className={`mt-2 text-[11px] font-semibold ${
                      message.type === 'error' ? 'text-red-600' : 'text-success-700'
                    }`}
                  >
                    {message.text}
                  </p>
                )}

                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={MessageCircle}
                    disabled={messagingId === a.id}
                    onClick={(e) => {
                      e.preventDefault()
                      handleMessage(a)
                    }}
                  >
                    Message
                  </Button>
                </div>

                {withdrawable && (
                  <Button
                    size="sm"
                    variant="danger"
                    icon={XCircle}
                    className="mt-2.5"
                    disabled={busyId === a.id}
                    onClick={(e) => {
                      e.preventDefault()
                      setConfirmId(a.id)
                    }}
                  >
                    Withdraw Application
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmId)}
        title="Withdraw this application?"
        message="The employer will be notified. This cannot be undone."
        confirmLabel="Withdraw Application"
        variant="danger"
        confirming={Boolean(busyId)}
        onConfirm={handleWithdrawConfirm}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  )
}

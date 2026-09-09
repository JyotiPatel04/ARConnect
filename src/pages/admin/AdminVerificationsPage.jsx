import { useState } from 'react'
import { AlertCircle, Building2, ExternalLink, ShieldCheck, ShieldX } from 'lucide-react'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import ModerationReasonInput from '../../components/admin/ModerationReasonInput'
import { isValidModerationReason } from '../../lib/moderationValidation'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useAdminVerifications from '../../hooks/useAdminVerifications'

export default function AdminVerificationsPage() {
  useDocumentTitle('Verifications')
  const { pending, loading, error, approve, reject } = useAdminVerifications()
  const [pendingAction, setPendingAction] = useState(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  function openAction(profile, nextStatus) {
    setPendingAction({ profile, nextStatus })
    setReason('')
    setActionError('')
  }

  async function handleConfirm() {
    if (!pendingAction || !isValidModerationReason(reason)) return
    setBusy(true)
    setActionError('')
    try {
      if (pendingAction.nextStatus === 'verified') {
        await approve(pendingAction.profile.id, reason)
      } else {
        await reject(pendingAction.profile.id, reason)
      }
      setPendingAction(null)
    } catch (err) {
      setActionError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Verifications"
        subtitle={loading ? 'Loading...' : `${pending.length} pending employer verification${pending.length === 1 ? '' : 's'}`}
      />

      {loading && <p className="py-8 text-center text-sm text-navy-400">Loading pending verifications...</p>}

      {!loading && error && (
        <EmptyState
          icon={AlertCircle}
          tone="error"
          title="Couldn't load pending verifications"
          subtitle="Please check your connection and try again."
        />
      )}

      {!loading && !error && pending.length === 0 && (
        <EmptyState
          icon={ShieldCheck}
          title="No pending verifications"
          subtitle="New employer company profiles will show up here for review."
        />
      )}

      {!loading && !error && pending.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {pending.map((profile) => (
            <div key={profile.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
              <div className="flex items-center gap-3">
                {profile.companyLogoUrl ? (
                  <img
                    src={profile.companyLogoUrl}
                    alt={profile.companyName}
                    className="h-10 w-10 shrink-0 rounded-xl object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                    <Building2 size={18} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-navy-900">{profile.companyName || 'Unnamed company'}</p>
                  {profile.industry && <p className="truncate text-xs text-navy-500">{profile.industry}</p>}
                </div>
              </div>

              <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-xs text-navy-500">
                {profile.contactEmail && <p>Contact: {profile.contactEmail}</p>}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex items-center gap-1 font-semibold text-primary-600 hover:underline"
                  >
                    {profile.website} <ExternalLink size={11} />
                  </a>
                )}
                {profile.about && <p className="text-navy-600">{profile.about}</p>}
              </div>

              <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                <Button size="sm" variant="success" icon={ShieldCheck} onClick={() => openAction(profile, 'verified')}>
                  Approve
                </Button>
                <Button size="sm" variant="danger" icon={ShieldX} onClick={() => openAction(profile, 'rejected')}>
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={pendingAction?.nextStatus === 'verified' ? 'Approve this company?' : 'Reject this company?'}
        message={
          pendingAction?.nextStatus === 'verified'
            ? `"${pendingAction?.profile.companyName || 'This company'}" will be marked Verified. New job posts from this employer will show a Verified Employer badge to candidates.`
            : `"${pendingAction?.profile.companyName || 'This company'}" will be marked Rejected. The employer can still use the platform and update their profile for a future review.`
        }
        confirmLabel={pendingAction?.nextStatus === 'verified' ? 'Approve' : 'Reject'}
        variant={pendingAction?.nextStatus === 'verified' ? 'primary' : 'danger'}
        confirming={busy}
        confirmDisabled={!isValidModerationReason(reason)}
        onConfirm={handleConfirm}
        onCancel={() => setPendingAction(null)}
      >
        {actionError && <p className="mb-2 text-xs font-semibold text-red-600">{actionError}</p>}
        <ModerationReasonInput
          value={reason}
          onChange={setReason}
          label={pendingAction?.nextStatus === 'verified' ? 'Approval note' : 'Rejection reason'}
        />
      </ConfirmDialog>
    </div>
  )
}

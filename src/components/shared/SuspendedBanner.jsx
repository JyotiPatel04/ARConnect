import { AlertTriangle } from 'lucide-react'
import useAuth from '../../hooks/useAuth'

// Phase 17 P2: suspension is already correctly enforced at the Firestore
// rules layer (see firestore.rules' isNotSuspended() -- unbypassable, not
// just a UI convenience) -- what was missing was WARNING the user before
// they hit a confusing generic "permission denied" on their next apply/
// post/save attempt. This shows proactively, on every page, rather than
// trying to special-case every mutation's catch block individually.
export default function SuspendedBanner() {
  const { profile } = useAuth()

  if (profile?.moderationStatus !== 'suspended') return null

  return (
    <div className="flex items-center justify-center gap-1.5 border-b border-red-100 bg-red-50 px-4 py-2 text-center text-[12px] font-semibold text-red-700">
      <AlertTriangle size={13} className="shrink-0" />
      Your account has been suspended. You can browse, but applying, posting, saving, and other
      account actions are disabled until an admin reactivates it.
    </div>
  )
}

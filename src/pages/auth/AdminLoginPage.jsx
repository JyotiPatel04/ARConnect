import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { ShieldCheck } from 'lucide-react'
import Button from '../../components/ui/Button'
import FormField from '../../components/auth/FormField'
import AuthAlert from '../../components/auth/AuthAlert'
import useAuth from '../../hooks/useAuth'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { db, isFirebaseConfigured } from '../../lib/firebase'
import { mapAuthError } from '../../lib/authErrors'

const UNAUTHORIZED_MESSAGE = 'This login is for administrators only.'

export default function AdminLoginPage() {
  useDocumentTitle('Admin Login')
  const { signIn, signOut } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const user = await signIn({ email, password })

      // Same direct, authoritative read used by the public LoginPage — never
      // trust anything cached on the client, always re-check Firestore.
      const profileSnap = await getDoc(doc(db, 'users', user.uid))
      const role = profileSnap.exists() ? profileSnap.data().role : undefined

      if (role !== 'admin') {
        // A missing users doc or a missing/non-admin role both land here.
        // The Firebase Auth session this signIn() just created is real, so
        // it must be torn down immediately — an unauthorized visitor should
        // never end up silently signed in just because they saw a rejection
        // message.
        await signOut()
        setError(UNAUTHORIZED_MESSAGE)
        return
      }

      navigate('/admin', { replace: true })
    } catch (err) {
      setError(mapAuthError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900">
          <ShieldCheck size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-navy-900">ARConnect Admin Portal</h1>
          <p className="text-xs text-navy-500">Restricted access — administrators only.</p>
        </div>
      </div>

      {!isFirebaseConfigured && (
        <div className="mt-4">
          <AuthAlert type="error">
            Firebase isn&apos;t configured yet — add the VITE_FIREBASE_* keys to .env to enable login.
          </AuthAlert>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        {error && <AuthAlert type="error">{error}</AuthAlert>}

        <FormField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@example.com"
          required
          autoComplete="email"
        />
        <FormField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
          autoComplete="current-password"
        />

        <Button type="submit" className="w-full" disabled={submitting || !isFirebaseConfigured}>
          {submitting ? 'Verifying...' : 'Admin Login'}
        </Button>
      </form>
    </div>
  )
}

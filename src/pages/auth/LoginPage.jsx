import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import FormField from '../../components/auth/FormField'
import AuthAlert from '../../components/auth/AuthAlert'
import useAuth from '../../hooks/useAuth'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { db, isFirebaseConfigured } from '../../lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { mapAuthError, roleRedirects, isPathAllowedForRole } from '../../lib/authErrors'

export default function LoginPage() {
  useDocumentTitle('Log In')
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [portal, setPortal] = useState('candidate')
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

      // Fetch the authoritative role directly rather than reading it off
      // AuthContext, whose state updates asynchronously via the auth
      // listener and could still be stale on this exact tick.
      const profileSnap = await getDoc(doc(db, 'users', user.uid))
      const actualRole = profileSnap.exists() ? profileSnap.data().role : undefined
      const from = location.state?.from?.pathname
      // Only honor `from` if it actually belongs to this account's own
      // role -- otherwise a visitor who clicked the wrong portal's link (or
      // is switching between their own candidate and employer accounts)
      // would log in successfully and still get bounced to /unauthorized.
      const destination = isPathAllowedForRole(from, actualRole) ? from : roleRedirects[actualRole] || '/'
      navigate(destination, { replace: true })
    } catch (err) {
      setError(mapAuthError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h1 className="text-lg font-bold text-navy-900">Welcome back</h1>
      <p className="mt-1 text-sm text-navy-500">Log in to continue to ARConnect.</p>

      {!isFirebaseConfigured && (
        <div className="mt-4">
          <AuthAlert type="error">
            Firebase isn&apos;t configured yet — add the VITE_FIREBASE_* keys to .env to enable
            login.
          </AuthAlert>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setPortal('candidate')}
          className={`rounded-lg border-2 px-3 py-2.5 text-[12.5px] font-bold ${
            portal === 'candidate' ? 'border-primary-600 bg-primary-50 text-primary-600' : 'border-slate-200 text-navy-600'
          }`}
        >
          Candidate
        </button>
        <button
          type="button"
          onClick={() => setPortal('employer')}
          className={`rounded-lg border-2 px-3 py-2.5 text-[12.5px] font-bold ${
            portal === 'employer' ? 'border-primary-600 bg-primary-50 text-primary-600' : 'border-slate-200 text-navy-600'
          }`}
        >
          Employer
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        {error && <AuthAlert type="error">{error}</AuthAlert>}

        <FormField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
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

        <div className="flex justify-end">
          <Link to="/auth/forgot-password" className="text-xs font-semibold text-primary-600">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={submitting || !isFirebaseConfigured}>
          {submitting ? 'Logging in...' : 'Log In'}
        </Button>
      </form>

      <p className="mt-5 text-center text-xs text-navy-500">
        Don&apos;t have an account?{' '}
        <Link to="/auth/register" className="font-bold text-primary-600">
          Sign up
        </Link>
      </p>
    </div>
  )
}

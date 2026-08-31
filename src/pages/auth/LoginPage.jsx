import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import FormField from '../../components/auth/FormField'
import AuthAlert from '../../components/auth/AuthAlert'
import useAuth from '../../hooks/useAuth'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { mapAuthError, roleRedirects } from '../../lib/authErrors'

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
      const { user } = await signIn({ email, password })

      // Fetch the authoritative role directly rather than reading it off
      // AuthContext, whose state updates asynchronously via the auth
      // listener and could still be stale on this exact tick.
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle()

      const actualRole = profileRow?.role
      const from = location.state?.from?.pathname
      navigate(from || roleRedirects[actualRole] || '/', { replace: true })
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

      {!isSupabaseConfigured && (
        <div className="mt-4">
          <AuthAlert type="error">
            Supabase isn&apos;t configured yet — add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
            to .env to enable login.
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

        <Button type="submit" className="w-full" disabled={submitting || !isSupabaseConfigured}>
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

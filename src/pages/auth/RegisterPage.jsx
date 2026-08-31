import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import FormField from '../../components/auth/FormField'
import AuthAlert from '../../components/auth/AuthAlert'
import useAuth from '../../hooks/useAuth'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { isSupabaseConfigured } from '../../lib/supabase'
import { mapAuthError, roleRedirects } from '../../lib/authErrors'

export default function RegisterPage() {
  useDocumentTitle('Sign Up')
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [role, setRole] = useState('candidate')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setSubmitting(true)
    try {
      const { session } = await signUp({ email, password, fullName, role, phone })

      if (session) {
        navigate(roleRedirects[role] || '/', { replace: true })
      } else {
        setSuccess('Account created! Check your email to confirm your address, then log in.')
      }
    } catch (err) {
      setError(mapAuthError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h1 className="text-lg font-bold text-navy-900">Create your account</h1>
      <p className="mt-1 text-sm text-navy-500">Join ARConnect as a candidate or employer.</p>

      {!isSupabaseConfigured && (
        <div className="mt-4">
          <AuthAlert type="error">
            Supabase isn&apos;t configured yet — add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
            to .env to enable sign up.
          </AuthAlert>
        </div>
      )}

      {success ? (
        <div className="mt-4">
          <AuthAlert type="success">{success}</AuthAlert>
          <Link to="/auth/login" className="mt-4 block text-center text-xs font-bold text-primary-600">
            Go to login →
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {error && <AuthAlert type="error">{error}</AuthAlert>}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole('candidate')}
              className={`rounded-lg border-2 px-3 py-2.5 text-[12.5px] font-bold ${
                role === 'candidate' ? 'border-primary-600 bg-primary-50 text-primary-600' : 'border-slate-200 text-navy-600'
              }`}
            >
              I&apos;m a Candidate
            </button>
            <button
              type="button"
              onClick={() => setRole('employer')}
              className={`rounded-lg border-2 px-3 py-2.5 text-[12.5px] font-bold ${
                role === 'employer' ? 'border-primary-600 bg-primary-50 text-primary-600' : 'border-slate-200 text-navy-600'
              }`}
            >
              I&apos;m an Employer
            </button>
          </div>

          <FormField
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
            required
            autoComplete="name"
          />
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
            label="Phone Number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your mobile number"
            autoComplete="tel"
          />
          <FormField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            required
            autoComplete="new-password"
          />

          <Button type="submit" className="w-full" disabled={submitting || !isSupabaseConfigured}>
            {submitting ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>
      )}

      {!success && (
        <p className="mt-5 text-center text-xs text-navy-500">
          Already have an account?{' '}
          <Link to="/auth/login" className="font-bold text-primary-600">
            Log in
          </Link>
        </p>
      )}
    </div>
  )
}

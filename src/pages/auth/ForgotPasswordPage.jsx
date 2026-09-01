import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import FormField from '../../components/auth/FormField'
import AuthAlert from '../../components/auth/AuthAlert'
import useAuth from '../../hooks/useAuth'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { isFirebaseConfigured } from '../../lib/firebase'
import { mapAuthError } from '../../lib/authErrors'

export default function ForgotPasswordPage() {
  useDocumentTitle('Reset Password')
  const { resetPassword } = useAuth()

  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch (err) {
      setError(mapAuthError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h1 className="text-lg font-bold text-navy-900">Reset your password</h1>
      <p className="mt-1 text-sm text-navy-500">
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>

      {!isFirebaseConfigured && (
        <div className="mt-4">
          <AuthAlert type="error">
            Firebase isn&apos;t configured yet — add the VITE_FIREBASE_* keys to .env to enable
            password reset.
          </AuthAlert>
        </div>
      )}

      {sent ? (
        <div className="mt-4">
          <AuthAlert type="success">
            Check your inbox — we&apos;ve sent a password reset link to {email}.
          </AuthAlert>
        </div>
      ) : (
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
          <Button type="submit" className="w-full" disabled={submitting || !isFirebaseConfigured}>
            {submitting ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>
      )}

      <p className="mt-5 text-center text-xs text-navy-500">
        <Link to="/auth/login" className="font-bold text-primary-600">
          ← Back to login
        </Link>
      </p>
    </div>
  )
}

import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import useDocumentTitle from '../../hooks/useDocumentTitle'

export default function LoginPage() {
  useDocumentTitle('Log In')

  return (
    <div>
      <h1 className="text-lg font-bold text-navy-900">Welcome back</h1>
      <p className="mt-1 text-sm text-navy-500">Log in to continue to ARConnect.</p>

      <div className="mt-5 space-y-3">
        <div>
          <label className="text-[11px] font-bold text-navy-700">Mobile Number / Email</label>
          <div className="mt-1 rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] text-navy-400">
            Enter your mobile number or email
          </div>
        </div>
        <div>
          <label className="text-[11px] font-bold text-navy-700">Password</label>
          <div className="mt-1 rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] text-navy-400">
            Enter your password
          </div>
        </div>
        <Button className="w-full">Log In</Button>
      </div>

      <p className="mt-5 text-center text-xs text-navy-500">
        Don&apos;t have an account?{' '}
        <Link to="/auth/register" className="font-bold text-primary-600">
          Sign up
        </Link>
      </p>
    </div>
  )
}

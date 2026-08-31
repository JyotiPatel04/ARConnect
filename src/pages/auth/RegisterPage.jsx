import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import useDocumentTitle from '../../hooks/useDocumentTitle'

export default function RegisterPage() {
  useDocumentTitle('Sign Up')

  return (
    <div>
      <h1 className="text-lg font-bold text-navy-900">Create your account</h1>
      <p className="mt-1 text-sm text-navy-500">Join ARConnect as a candidate or employer.</p>

      <div className="mt-5 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <button className="rounded-lg border-2 border-primary-600 bg-primary-50 px-3 py-2.5 text-[12.5px] font-bold text-primary-600">
            I&apos;m a Candidate
          </button>
          <button className="rounded-lg border border-slate-200 px-3 py-2.5 text-[12.5px] font-bold text-navy-600">
            I&apos;m an Employer
          </button>
        </div>
        <div>
          <label className="text-[11px] font-bold text-navy-700">Full Name</label>
          <div className="mt-1 rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] text-navy-400">
            Enter your full name
          </div>
        </div>
        <div>
          <label className="text-[11px] font-bold text-navy-700">Mobile Number</label>
          <div className="mt-1 rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] text-navy-400">
            Enter your mobile number
          </div>
        </div>
        <Button className="w-full">Create Account</Button>
      </div>

      <p className="mt-5 text-center text-xs text-navy-500">
        Already have an account?{' '}
        <Link to="/auth/login" className="font-bold text-primary-600">
          Log in
        </Link>
      </p>
    </div>
  )
}

import { ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import useAuth from '../hooks/useAuth'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { roleRedirects } from '../lib/authErrors'

export default function UnauthorizedPage() {
  useDocumentTitle('Unauthorized')
  const { role } = useAuth()
  const homeLink = roleRedirects[role] || '/'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f4f5f9] px-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
        <ShieldAlert size={26} />
      </span>
      <div>
        <h1 className="text-xl font-extrabold text-navy-900">You don&apos;t have access to this page</h1>
        <p className="mt-1 text-sm text-navy-500">
          Your account doesn&apos;t have permission to view this section.
        </p>
      </div>
      <Link to={homeLink}>
        <Button size="sm">Go to my dashboard</Button>
      </Link>
    </div>
  )
}

import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import useDocumentTitle from '../hooks/useDocumentTitle'

export default function NotFoundPage() {
  useDocumentTitle('Page Not Found')

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f4f5f9] px-4 text-center">
      <h1 className="text-6xl font-extrabold text-navy-900">404</h1>
      <p className="text-sm text-navy-500">This page doesn&apos;t exist yet.</p>
      <Link to="/">
        <Button size="sm">Back to Home</Button>
      </Link>
    </div>
  )
}

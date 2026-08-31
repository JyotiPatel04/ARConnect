import { Mail, Phone } from 'lucide-react'
import Button from '../../components/ui/Button'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'

export default function EmployerProfilePage() {
  useDocumentTitle('Profile')

  return (
    <div className="max-w-md">
      <PageHeader title="My Profile" />
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-soft">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy-900 text-lg font-bold text-white">
          AB
        </div>
        <p className="text-base font-extrabold text-navy-900">Anita Bansal</p>
        <p className="text-xs text-navy-500">HR Manager · ABC Pvt Ltd</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-navy-500">
          <Mail size={12} /> anita.bansal@abcpvtltd.com
        </p>
        <p className="flex items-center gap-1 text-xs text-navy-500">
          <Phone size={12} /> +91 98XXX XXX45
        </p>
        <Button size="sm" variant="secondary" className="mt-2">Edit Profile</Button>
      </div>
    </div>
  )
}

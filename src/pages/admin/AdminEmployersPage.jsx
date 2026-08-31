import VerifiedBadge from '../../components/ui/VerifiedBadge'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { companies } from '../../data/sampleData'

export default function AdminEmployersPage() {
  useDocumentTitle('Employers')

  return (
    <div>
      <PageHeader title="Employers" subtitle="5,320 registered employers" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {companies.map((name) => (
          <div key={name} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-sm font-bold text-primary-600">
              {name.charAt(0)}
            </div>
            <div>
              <p className="text-[13px] font-bold text-navy-900">{name}</p>
              <VerifiedBadge />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

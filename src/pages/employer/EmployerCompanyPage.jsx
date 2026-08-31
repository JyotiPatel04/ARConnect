import VerifiedBadge from '../../components/ui/VerifiedBadge'
import Button from '../../components/ui/Button'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'

export default function EmployerCompanyPage() {
  useDocumentTitle('Company Profile')

  return (
    <div>
      <PageHeader
        title="Company Profile"
        subtitle="Manage how candidates see your company"
        action={<Button size="sm" variant="secondary">Edit Company</Button>}
      />

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-50 text-lg font-bold text-primary-600">
            A
          </div>
          <div>
            <p className="text-base font-extrabold text-navy-900">ABC Pvt Ltd</p>
            <VerifiedBadge label="Employer Verified" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-bold text-navy-700">Industry</p>
            <p className="text-sm text-navy-600">Retail &amp; Sales</p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-navy-700">Headquarters</p>
            <p className="text-sm text-navy-600">Varanasi, Uttar Pradesh</p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-navy-700">Company Size</p>
            <p className="text-sm text-navy-600">51–200 employees</p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-navy-700">Active Jobs</p>
            <p className="text-sm text-navy-600">8 open positions</p>
          </div>
        </div>
      </div>
    </div>
  )
}

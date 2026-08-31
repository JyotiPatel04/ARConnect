import { ChevronDown, Plus } from 'lucide-react'
import Button from '../../components/ui/Button'
import VerifiedBadge from '../../components/ui/VerifiedBadge'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'

export default function EmployerJobNewPage() {
  useDocumentTitle('Post a New Job')

  return (
    <div className="max-w-md">
      <PageHeader title="Post a New Job" />

      <div className="space-y-3.5">
        <div>
          <label className="text-[11px] font-bold text-navy-700">Job Title</label>
          <div className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-navy-400">
            e.g. Sales Executive
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-navy-700">Location</label>
            <div className="mt-1 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-navy-400">
              Select city <ChevronDown size={13} />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold text-navy-700">Job Type</label>
            <div className="mt-1 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-navy-400">
              Select type <ChevronDown size={13} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-navy-700">Min Salary</label>
            <div className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-navy-400">
              ₹0
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold text-navy-700">Max Salary</label>
            <div className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-navy-400">
              ₹0
            </div>
          </div>
        </div>
        <div>
          <label className="text-[11px] font-bold text-navy-700">Description</label>
          <div className="mt-1 h-20 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-navy-400">
            Describe the role and responsibilities...
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-success-50 px-3 py-2 text-[12px] font-semibold text-success-700">
          <VerifiedBadge label="Employer Verified" />
          This job will be published instantly.
        </div>
        <Button className="w-full" icon={Plus}>
          Publish Job
        </Button>
      </div>
    </div>
  )
}

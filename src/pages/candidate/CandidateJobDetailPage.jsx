import { ArrowLeft, Bookmark, MapPin } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import VerifiedBadge from '../../components/ui/VerifiedBadge'
import MatchBadge from '../../components/ui/MatchBadge'
import Button from '../../components/ui/Button'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { jobs } from '../../data/sampleData'

export default function CandidateJobDetailPage() {
  const { jobId } = useParams()
  const job = jobs[Number(jobId)] ?? jobs[0]
  useDocumentTitle(job.title)

  return (
    <div>
      <div className="flex items-center justify-between">
        <Link to="/candidate/jobs" className="text-navy-900">
          <ArrowLeft size={19} />
        </Link>
        <span className="text-sm font-bold text-navy-900">Job Details</span>
        <Bookmark size={18} className="text-navy-400" />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-base font-bold text-primary-600">
          {job.company.charAt(0)}
        </div>
        <div>
          <h1 className="text-base font-extrabold text-navy-900">{job.title}</h1>
          <p className="text-xs text-navy-500">{job.company}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {job.verified && <VerifiedBadge />}
        <MatchBadge value={job.match} />
      </div>

      <p className="mt-3 text-xl font-extrabold text-navy-900">{job.salary}</p>
      <p className="mt-1 flex items-center gap-1 text-xs text-navy-500">
        <MapPin size={13} /> {job.location} · {job.type}
      </p>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <h2 className="text-[13px] font-bold text-navy-900">Job Description</h2>
        <ul className="mt-2 space-y-1.5 text-[13px] leading-snug text-navy-500">
          <li>• Visit local shops and generate new sales leads</li>
          <li>• Meet daily/weekly sales targets</li>
          <li>• Report to Area Sales Manager</li>
          <li>• 2-wheeler with valid license preferred</li>
        </ul>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4 pb-4">
        <h2 className="text-[13px] font-bold text-navy-900">Requirements</h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {['12th Pass', '0-2 yrs exp', 'Two-wheeler', 'Hindi/English'].map((r) => (
            <span key={r} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-navy-600">
              {r}
            </span>
          ))}
        </div>
      </div>

      <Button className="w-full">Apply Now</Button>
    </div>
  )
}

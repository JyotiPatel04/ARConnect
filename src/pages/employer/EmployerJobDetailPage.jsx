import { MapPin } from 'lucide-react'
import { useParams } from 'react-router-dom'
import VerifiedBadge from '../../components/ui/VerifiedBadge'
import MatchBadge from '../../components/ui/MatchBadge'
import CandidateCard from '../../components/ui/CandidateCard'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { jobs, candidates } from '../../data/sampleData'

export default function EmployerJobDetailPage() {
  const { jobId } = useParams()
  const job = jobs[Number(jobId)] ?? jobs[0]
  useDocumentTitle(job.title)

  return (
    <div>
      <PageHeader title={job.title} subtitle={job.company} />

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
        <div className="flex flex-wrap items-center gap-1.5">
          {job.verified && <VerifiedBadge />}
          <MatchBadge value={job.match} />
        </div>
        <p className="mt-3 text-lg font-extrabold text-navy-900">{job.salary}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-navy-500">
          <MapPin size={12} /> {job.location} · {job.type} · {job.posted}
        </p>
      </div>

      <div className="mt-5">
        <h2 className="text-[13px] font-bold text-navy-900">Applicants for this role</h2>
        <div className="mt-2.5 space-y-2">
          {candidates.map((c, i) => (
            <CandidateCard key={c.name} candidate={c} match={94 - i * 6} status={i === 0 ? 'interview' : 'applied'} />
          ))}
        </div>
      </div>
    </div>
  )
}

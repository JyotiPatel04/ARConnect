import CandidateCard from '../../components/ui/CandidateCard'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { candidates } from '../../data/sampleData'

export default function EmployerCandidatesPage() {
  useDocumentTitle('Candidates')

  return (
    <div>
      <PageHeader title="Candidates" subtitle="Browse AI-matched candidates for your jobs" />
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {candidates.map((c, i) => (
          <CandidateCard key={c.name} candidate={c} match={94 - i * 6} />
        ))}
      </div>
    </div>
  )
}

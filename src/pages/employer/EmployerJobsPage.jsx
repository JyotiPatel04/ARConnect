import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import JobCard from '../../components/ui/JobCard'
import Button from '../../components/ui/Button'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { jobs } from '../../data/sampleData'

export default function EmployerJobsPage() {
  useDocumentTitle('Jobs')

  return (
    <div>
      <PageHeader
        title="Your Jobs"
        subtitle={`${jobs.length} job posts`}
        action={
          <Link to="/employer/jobs/new">
            <Button size="sm" icon={Plus}>Post a Job</Button>
          </Link>
        }
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {jobs.map((job, i) => (
          <Link key={job.title} to={`/employer/jobs/${i}`}>
            <JobCard job={job} />
          </Link>
        ))}
      </div>
    </div>
  )
}

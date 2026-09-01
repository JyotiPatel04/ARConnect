export function getInitials(name) {
  if (!name) return ''
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')
}

const currencyFormatter = new Intl.NumberFormat('en-IN')

export function formatSalary(salaryMin, salaryMax) {
  if (!salaryMin && !salaryMax) return 'Salary not disclosed'
  if (salaryMin && salaryMax) {
    return `₹${currencyFormatter.format(salaryMin)} – ₹${currencyFormatter.format(salaryMax)}/month`
  }
  return `₹${currencyFormatter.format(salaryMin || salaryMax)}/month`
}

// Adapts a Firestore job document (camelCase fields: companyName, jobType,
// salaryMin/Max, employerVerified, createdAt) into the prop shape JobCard
// already reads (company, type, salary, posted, verified) — keeps JobCard
// itself untouched so /prototype's static sample-data usage of it can't
// regress, while still reusing it for real candidate-facing data here.
export function toJobCardProps(job) {
  return {
    title: job.title,
    company: job.companyName,
    salary: formatSalary(job.salaryMin, job.salaryMax),
    location: job.location,
    type: job.jobType,
    posted: formatRelativeTime(job.createdAt?.toDate?.()),
    verified: Boolean(job.employerVerified),
  }
}

export function formatRelativeTime(date) {
  if (!date) return ''
  const ms = Date.now() - date.getTime()
  const minutes = Math.floor(ms / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  const months = Math.floor(days / 30)
  return `${months} month${months === 1 ? '' : 's'} ago`
}

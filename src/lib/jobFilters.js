export function filterAndSortJobs(jobs, options = {}) {
  const {
    search = '',
    location = '',
    jobType = '',
    workMode = '',
    experienceLevel = '',
    minSalary = null,
    sortBy = 'recent',
  } = options

  let result = jobs

  const term = search.trim().toLowerCase()
  if (term) {
    result = result.filter(
      (job) =>
        job.title?.toLowerCase().includes(term) ||
        job.companyName?.toLowerCase().includes(term) ||
        job.skills?.some((skill) => skill.toLowerCase().includes(term))
    )
  }

  if (location) result = result.filter((job) => job.location === location)
  if (jobType) result = result.filter((job) => job.jobType === jobType)
  if (workMode) result = result.filter((job) => job.workMode === workMode)
  if (experienceLevel) result = result.filter((job) => job.experienceLevel === experienceLevel)
  if (minSalary != null) {
    result = result.filter((job) => (job.salaryMax ?? job.salaryMin ?? 0) >= minSalary)
  }

  result = [...result]
  if (sortBy === 'salary') {
    result.sort((a, b) => (b.salaryMax ?? b.salaryMin ?? 0) - (a.salaryMax ?? a.salaryMin ?? 0))
  } else {
    result.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
  }

  return result
}

import { JOB_LOCATIONS, JOB_TYPES, WORK_MODES, EXPERIENCE_LEVELS } from './jobOptions'

export const EMPTY_JOB_FORM_VALUES = {
  title: '',
  companyName: '',
  companyLogoUrl: '',
  location: JOB_LOCATIONS[0],
  workMode: WORK_MODES[0],
  jobType: JOB_TYPES[0],
  experienceLevel: EXPERIENCE_LEVELS[0],
  salaryMin: '',
  salaryMax: '',
  skills: '',
  description: '',
  responsibilities: '',
  requirements: '',
}

// Converts a job document's array fields back into the form's textarea/text
// representations — the inverse of parseJobFormValues below.
export function jobToFormValues(job) {
  if (!job) return EMPTY_JOB_FORM_VALUES
  return {
    title: job.title || '',
    companyName: job.companyName || '',
    companyLogoUrl: job.companyLogoUrl || '',
    location: job.location || JOB_LOCATIONS[0],
    workMode: job.workMode || WORK_MODES[0],
    jobType: job.jobType || JOB_TYPES[0],
    experienceLevel: job.experienceLevel || EXPERIENCE_LEVELS[0],
    salaryMin: job.salaryMin ?? '',
    salaryMax: job.salaryMax ?? '',
    skills: (job.skills || []).join(', '),
    description: job.description || '',
    responsibilities: (job.responsibilities || []).join('\n'),
    requirements: (job.requirements || []).join('\n'),
  }
}

export function parseJobFormValues(values) {
  return {
    title: values.title.trim(),
    companyName: values.companyName.trim(),
    companyLogoUrl: values.companyLogoUrl.trim() || null,
    location: values.location,
    workMode: values.workMode,
    jobType: values.jobType,
    experienceLevel: values.experienceLevel,
    salaryMin: Number(values.salaryMin),
    salaryMax: Number(values.salaryMax),
    skills: values.skills.split(',').map((s) => s.trim()).filter(Boolean),
    description: values.description.trim(),
    responsibilities: values.responsibilities.split('\n').map((s) => s.trim()).filter(Boolean),
    requirements: values.requirements.split('\n').map((s) => s.trim()).filter(Boolean),
  }
}

export function validateJobFormValues(values) {
  if (!values.title.trim()) return 'Job title is required.'
  if (!values.companyName.trim()) return 'Company name is required.'
  if (!values.description.trim()) return 'Job description is required.'
  const min = Number(values.salaryMin)
  const max = Number(values.salaryMax)
  if (!values.salaryMin || !values.salaryMax || Number.isNaN(min) || Number.isNaN(max)) {
    return 'Enter both a minimum and maximum salary.'
  }
  if (min > max) return 'Minimum salary cannot be greater than maximum salary.'
  if (!values.skills.split(',').map((s) => s.trim()).filter(Boolean).length) {
    return 'Add at least one skill.'
  }
  return ''
}

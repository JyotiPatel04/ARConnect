// Client-side validation for the candidate profile form, mirroring the
// validateJobFormValues(values) -> '' | error-string pattern already used
// for the employer job form (see lib/jobForm.js).
export function validateCandidateProfileForm(values) {
  if (!values.fullName.trim()) return 'Full name is required.'

  if (values.phone.trim() && !/^[0-9+\-\s()]{7,15}$/.test(values.phone.trim())) {
    return 'Enter a valid phone number.'
  }

  if (values.experienceYears !== '') {
    const years = Number(values.experienceYears)
    if (!Number.isFinite(years) || years < 0 || years > 60) {
      return 'Years of experience must be a number between 0 and 60.'
    }
  }

  const min = values.expectedSalaryMin === '' ? null : Number(values.expectedSalaryMin)
  const max = values.expectedSalaryMax === '' ? null : Number(values.expectedSalaryMax)
  if (values.expectedSalaryMin !== '' && (!Number.isFinite(min) || min < 0 || min > 10000000)) {
    return 'Enter a valid minimum expected salary.'
  }
  if (values.expectedSalaryMax !== '' && (!Number.isFinite(max) || max < 0 || max > 10000000)) {
    return 'Enter a valid maximum expected salary.'
  }
  if (min != null && max != null && min > max) {
    return 'Minimum expected salary cannot be higher than maximum.'
  }

  if (values.bio.length > 500) return 'Bio must be 500 characters or fewer.'
  if (values.experienceSummary.length > 500) return 'Experience summary must be 500 characters or fewer.'

  if (values.resumeLink.trim() && !/^https?:\/\/.+/i.test(values.resumeLink.trim())) {
    return 'Resume link must be a valid URL starting with http:// or https://.'
  }

  return ''
}

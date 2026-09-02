// Client-side validation for the employer company profile form — same
// '' | error-string pattern as lib/jobForm.js and lib/candidateProfileForm.js.
const CURRENT_YEAR = new Date().getFullYear()

export function validateCompanyProfileForm(values) {
  if (!values.companyName.trim()) return 'Company name is required.'
  if (!values.industry.trim()) return 'Industry is required.'
  if (!values.location.trim()) return 'Location is required.'

  if (values.about.trim() && values.about.trim().length < 20) {
    return 'About Company should be at least 20 characters — a one-word description isn’t useful to candidates.'
  }
  if (values.about.length > 1000) return 'About Company must be 1000 characters or fewer.'

  if (values.website.trim() && !/^https:\/\/.+/i.test(values.website.trim())) {
    return 'Website must be a valid HTTPS URL (starting with https://).'
  }
  if (values.companyLogoUrl.trim() && !/^https:\/\/.+/i.test(values.companyLogoUrl.trim())) {
    return 'Company Logo URL must be a valid HTTPS URL (starting with https://).'
  }

  if (values.foundedYear !== '') {
    const year = Number(values.foundedYear)
    if (!Number.isInteger(year) || year < 1800 || year > CURRENT_YEAR) {
      return `Founded year must be a valid year between 1800 and ${CURRENT_YEAR}.`
    }
  }

  if (values.contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.contactEmail.trim())) {
    return 'Enter a valid contact email.'
  }
  if (values.contactPhone.trim() && !/^[0-9+\-\s()]{7,15}$/.test(values.contactPhone.trim())) {
    return 'Enter a valid contact phone number.'
  }

  return ''
}

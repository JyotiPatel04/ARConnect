export const INTERVIEW_TYPES = ['online', 'phone', 'in_person']

export const INTERVIEW_TYPE_LABELS = {
  online: 'Online',
  phone: 'Phone',
  in_person: 'In Person',
}

export const EMPTY_INTERVIEW_FORM = {
  scheduledAt: '',
  durationMinutes: '30',
  interviewType: 'online',
  meetingLink: '',
  location: '',
  notes: '',
}

export function interviewToFormValues(interview) {
  if (!interview) return EMPTY_INTERVIEW_FORM
  const date = interview.scheduledAt?.toDate?.()
  return {
    // datetime-local expects "YYYY-MM-DDTHH:mm" in LOCAL time — toISOString
    // is UTC, so this builds the local-time equivalent by hand.
    scheduledAt: date
      ? new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      : '',
    durationMinutes: String(interview.durationMinutes ?? 30),
    interviewType: interview.interviewType || 'online',
    meetingLink: interview.meetingLink || '',
    location: interview.location || '',
    notes: interview.notes || '',
  }
}

// '' | error-string, same pattern as every other *Form.js validator in
// this app (jobForm.js, candidateProfileForm.js, companyProfileForm.js).
export function validateInterviewForm(values) {
  if (!values.scheduledAt) return 'Date and time are required.'
  const date = new Date(values.scheduledAt)
  if (Number.isNaN(date.getTime())) return 'Enter a valid date and time.'

  const duration = Number(values.durationMinutes)
  if (!Number.isInteger(duration) || duration <= 0 || duration > 480) {
    return 'Duration must be a whole number of minutes between 1 and 480.'
  }

  if (!INTERVIEW_TYPES.includes(values.interviewType)) return 'Select a valid interview type.'

  if (values.interviewType === 'online') {
    if (!values.meetingLink.trim()) return 'Meeting link is required for online interviews.'
    if (!/^https:\/\/.+/i.test(values.meetingLink.trim())) {
      return 'Meeting link must be a valid HTTPS URL (starting with https://).'
    }
  }

  if (values.interviewType === 'in_person') {
    const loc = values.location.trim()
    if (loc.length < 3 || loc.length > 200) return 'Location must be between 3 and 200 characters.'
  }

  if (values.notes.length > 1000) return 'Notes must be 1000 characters or fewer.'

  return ''
}

export function parseInterviewFormValues(values) {
  return {
    scheduledAt: new Date(values.scheduledAt),
    durationMinutes: Number(values.durationMinutes),
    interviewType: values.interviewType,
    meetingLink: values.interviewType === 'online' ? values.meetingLink.trim() : '',
    location: values.interviewType === 'in_person' ? values.location.trim() : '',
    notes: values.notes.trim(),
  }
}

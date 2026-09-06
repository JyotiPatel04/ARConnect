import {
  newApplicationTemplate,
  statusUpdateTemplate,
  hiredTemplate,
  notSelectedTemplate,
  interviewScheduledTemplate,
  interviewUpdatedTemplate,
  interviewCancelledTemplate,
} from './templates.js'

// The only notification types this app ever emails for. Every other type
// (application_submitted_confirmation, application_withdrawn) is
// deliberately in-app-only — the spec names 8 email events, and these two
// existing notification types aren't among them.
export const EMAIL_NOTIFICATION_TYPES = [
  'new_application',
  'application_status_updated',
  'interview_scheduled',
  'interview_updated',
  'interview_cancelled',
]

/**
 * Pure function: given a notification and the already-fetched documents it
 * references, returns { to, subject, html, text } to send, or null if the
 * event isn't email-worthy or required data is missing/invalid. Never
 * throws — a missing/malformed field is treated as "can't build this
 * email" rather than a crash, since a bad email is never worth failing the
 * underlying (already-committed) application/interview action.
 *
 * @param {object} notification - the notifications/{id} document data
 * @param {object} context
 * @param {object|null} context.application - the applications/{id} doc data
 * @param {object|null} context.interview - the interviews/{id} doc data (JS Date for scheduledAt, not a Firestore Timestamp)
 * @param {string} context.recipientEmail - resolved from users/{recipientId}.email
 * @param {string} context.recipientName - resolved from users/{recipientId}.full_name
 */
export function buildEmailForNotification(notification, { application, interview, recipientEmail, recipientName }) {
  if (!notification || !EMAIL_NOTIFICATION_TYPES.includes(notification.type)) return null
  if (!recipientEmail) return null
  if (!application) return null

  const { jobTitle, companyName, candidateName } = application

  switch (notification.type) {
    case 'new_application': {
      if (!jobTitle) return null
      const tpl = newApplicationTemplate({ employerName: recipientName, candidateName, jobTitle })
      return { to: recipientEmail, ...tpl }
    }

    case 'application_status_updated': {
      if (!jobTitle || !companyName) return null
      const status = notification.status || application.status
      if (status === 'hired') {
        return { to: recipientEmail, ...hiredTemplate({ candidateName: recipientName, jobTitle, companyName }) }
      }
      if (status === 'rejected') {
        return { to: recipientEmail, ...notSelectedTemplate({ candidateName: recipientName, jobTitle, companyName }) }
      }
      return {
        to: recipientEmail,
        ...statusUpdateTemplate({ candidateName: recipientName, jobTitle, companyName, status }),
      }
    }

    case 'interview_scheduled':
    case 'interview_updated':
    case 'interview_cancelled': {
      if (!jobTitle || !companyName) return null
      if (notification.type === 'interview_cancelled') {
        return {
          to: recipientEmail,
          ...interviewCancelledTemplate({ candidateName: recipientName, jobTitle, companyName }),
        }
      }
      if (!interview || !interview.scheduledAt || !interview.durationMinutes || !interview.interviewType) return null
      const data = {
        candidateName: recipientName,
        jobTitle,
        companyName,
        scheduledAt: interview.scheduledAt,
        durationMinutes: interview.durationMinutes,
        interviewType: interview.interviewType,
        meetingLink: interview.meetingLink,
        location: interview.location,
      }
      return {
        to: recipientEmail,
        ...(notification.type === 'interview_scheduled' ? interviewScheduledTemplate(data) : interviewUpdatedTemplate(data)),
      }
    }

    default:
      return null
  }
}

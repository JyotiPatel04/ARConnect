// Pure template builders — no Admin SDK, no network, no Firestore
// Timestamp objects (callers convert to plain JS Date before calling in).
// Each returns { subject, html, text } and includes only information the
// recipient is already entitled to see in-app (job title, company name,
// application status, interview details) — never the other party's
// contact info beyond what the existing dashboards already show them.

const BRAND = 'ARConnect'

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]))
}

function layout({ heading, bodyLines, greetingName }) {
  const safeHeading = escapeHtml(heading)
  const safeGreeting = escapeHtml(greetingName || 'there')
  const htmlBody = bodyLines.map((line) => `<p style="margin:0 0 12px;">${line}</p>`).join('\n')
  const textBody = bodyLines
    .map((line) => line.replace(/<[^>]+>/g, ''))
    .join('\n\n')

  const html = `<!doctype html>
<html>
  <body style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;background:#f9fafb;padding:24px;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:8px;padding:24px;border:1px solid #e5e7eb;">
      <p style="margin:0 0 4px;font-size:12px;letter-spacing:0.05em;color:#6b7280;text-transform:uppercase;">${BRAND}</p>
      <h1 style="margin:0 0 16px;font-size:20px;">${safeHeading}</h1>
      <p style="margin:0 0 12px;">Hi ${safeGreeting},</p>
      ${htmlBody}
      <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">This is an automated notification from ${BRAND}. You can review full details by signing in to your account.</p>
    </div>
  </body>
</html>`

  const text = `${heading}\n\nHi ${greetingName || 'there'},\n\n${textBody}\n\n— ${BRAND}`

  return { html, text }
}

// Fixed to IST — every test/sample location in this codebase is an Indian
// city, and Cloud Functions run in UTC by default, so leaving this
// unlocalized would show employers/candidates the wrong time. Not
// configurable per-user because no such preference exists anywhere in
// this app yet (see report's "known limitations").
export function formatInterviewDateTime(date) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(date) + ' IST'
}

export function newApplicationTemplate({ employerName, candidateName, jobTitle }) {
  const { html, text } = layout({
    heading: 'New Application Received',
    greetingName: employerName,
    bodyLines: [
      `${escapeHtml(candidateName || 'A candidate')} has applied for your <strong>${escapeHtml(jobTitle)}</strong> job posting.`,
      'Sign in to your employer dashboard to review the application.',
    ],
  })
  return { subject: `New application for ${jobTitle}`, html, text }
}

const STATUS_LABELS = {
  applied: 'Applied',
  reviewing: 'In Review',
  shortlisted: 'Shortlisted',
  interview: 'Interview',
  rejected: 'Not Selected',
  hired: 'Hired',
}

export function statusUpdateTemplate({ candidateName, jobTitle, companyName, status }) {
  const label = STATUS_LABELS[status] || status
  const { html, text } = layout({
    heading: 'Application Status Updated',
    greetingName: candidateName,
    bodyLines: [
      `Your application for <strong>${escapeHtml(jobTitle)}</strong> at ${escapeHtml(companyName)} has been moved to <strong>${escapeHtml(label)}</strong>.`,
      'Sign in to your candidate dashboard for more details.',
    ],
  })
  return { subject: `Your application status changed: ${label}`, html, text }
}

export function hiredTemplate({ candidateName, jobTitle, companyName }) {
  const { html, text } = layout({
    heading: 'Congratulations — You Got the Job!',
    greetingName: candidateName,
    bodyLines: [
      `Great news — you've been <strong>hired</strong> for the <strong>${escapeHtml(jobTitle)}</strong> role at ${escapeHtml(companyName)}.`,
      'The employer will be in touch with next steps. Sign in to your dashboard for details.',
    ],
  })
  return { subject: `You got the job: ${jobTitle} at ${companyName}`, html, text }
}

export function notSelectedTemplate({ candidateName, jobTitle, companyName }) {
  const { html, text } = layout({
    heading: 'Application Update',
    greetingName: candidateName,
    bodyLines: [
      `Thank you for applying for the <strong>${escapeHtml(jobTitle)}</strong> role at ${escapeHtml(companyName)}. After review, the employer has decided not to move forward with your application at this time.`,
      'We encourage you to keep exploring other opportunities on ARConnect.',
    ],
  })
  return { subject: `Update on your application: ${jobTitle}`, html, text }
}

function interviewDetailLines({ jobTitle, companyName, scheduledAt, durationMinutes, interviewType, meetingLink, location }) {
  const lines = [
    `<strong>Role:</strong> ${escapeHtml(jobTitle)} at ${escapeHtml(companyName)}`,
    `<strong>When:</strong> ${escapeHtml(formatInterviewDateTime(scheduledAt))}`,
    `<strong>Duration:</strong> ${escapeHtml(durationMinutes)} minutes`,
    `<strong>Type:</strong> ${escapeHtml(interviewType)}`,
  ]
  if (meetingLink) lines.push(`<strong>Meeting link:</strong> ${escapeHtml(meetingLink)}`)
  if (location) lines.push(`<strong>Location:</strong> ${escapeHtml(location)}`)
  return lines
}

export function interviewScheduledTemplate(data) {
  const { candidateName, jobTitle } = data
  const { html, text } = layout({
    heading: 'Interview Scheduled',
    greetingName: candidateName,
    bodyLines: [
      'An interview has been scheduled for your application:',
      ...interviewDetailLines(data),
      'Sign in to your candidate dashboard for the full details.',
    ],
  })
  return { subject: `Interview scheduled: ${jobTitle}`, html, text }
}

export function interviewUpdatedTemplate(data) {
  const { candidateName, jobTitle } = data
  const { html, text } = layout({
    heading: 'Interview Updated',
    greetingName: candidateName,
    bodyLines: [
      'Your interview details have been updated:',
      ...interviewDetailLines(data),
      'Sign in to your candidate dashboard for the full details.',
    ],
  })
  return { subject: `Interview updated: ${jobTitle}`, html, text }
}

export function interviewCancelledTemplate({ candidateName, jobTitle, companyName }) {
  const { html, text } = layout({
    heading: 'Interview Cancelled',
    greetingName: candidateName,
    bodyLines: [
      `Your scheduled interview for <strong>${escapeHtml(jobTitle)}</strong> at ${escapeHtml(companyName)} has been cancelled.`,
      'Sign in to your candidate dashboard for more details.',
    ],
  })
  return { subject: `Interview cancelled: ${jobTitle}`, html, text }
}

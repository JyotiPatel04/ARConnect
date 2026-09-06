import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  formatInterviewDateTime,
  newApplicationTemplate,
  statusUpdateTemplate,
  hiredTemplate,
  notSelectedTemplate,
  interviewScheduledTemplate,
  interviewUpdatedTemplate,
  interviewCancelledTemplate,
} from './templates.js'

describe('formatInterviewDateTime', () => {
  test('formats a Date in IST with a clear timezone label', () => {
    const date = new Date('2026-03-05T10:30:00.000Z') // 16:00 IST
    const text = formatInterviewDateTime(date)
    assert.match(text, /IST/)
    assert.match(text, /2026/)
  })
})

describe('newApplicationTemplate', () => {
  test('includes candidate name, job title, and employer greeting', () => {
    const { subject, html, text } = newApplicationTemplate({
      employerName: 'Priya Sharma',
      candidateName: 'Rahul Verma',
      jobTitle: 'Sales Executive',
    })
    assert.match(subject, /Sales Executive/)
    assert.match(html, /Rahul Verma/)
    assert.match(html, /Sales Executive/)
    assert.match(text, /Priya Sharma/)
  })

  test('falls back to a generic phrase when candidateName is missing', () => {
    const { html } = newApplicationTemplate({ employerName: 'Priya', candidateName: undefined, jobTitle: 'Clerk' })
    assert.match(html, /A candidate has applied/)
  })

  test('escapes HTML-unsafe characters in candidate-supplied content', () => {
    const { html } = newApplicationTemplate({
      employerName: 'E',
      candidateName: '<script>alert(1)</script>',
      jobTitle: 'Dev',
    })
    assert.doesNotMatch(html, /<script>/)
    assert.match(html, /&lt;script&gt;/)
  })
})

describe('statusUpdateTemplate', () => {
  test('renders the human-readable label for a known status', () => {
    const { html, subject } = statusUpdateTemplate({
      candidateName: 'Amit',
      jobTitle: 'Cashier',
      companyName: 'ABC Retail',
      status: 'shortlisted',
    })
    assert.match(html, /Shortlisted/)
    assert.match(subject, /Shortlisted/)
  })

  test('falls back to the raw status string for an unknown status', () => {
    const { html } = statusUpdateTemplate({
      candidateName: 'Amit',
      jobTitle: 'Cashier',
      companyName: 'ABC Retail',
      status: 'some_future_status',
    })
    assert.match(html, /some_future_status/)
  })
})

describe('hiredTemplate / notSelectedTemplate', () => {
  test('hired template is congratulatory and names the role and company', () => {
    const { subject, html } = hiredTemplate({ candidateName: 'Sana', jobTitle: 'Analyst', companyName: 'XYZ Corp' })
    assert.match(subject, /You got the job/)
    assert.match(html, /Analyst/)
    assert.match(html, /XYZ Corp/)
  })

  test('not-selected template is respectful and does not say "rejected"', () => {
    const { html } = notSelectedTemplate({ candidateName: 'Sana', jobTitle: 'Analyst', companyName: 'XYZ Corp' })
    assert.doesNotMatch(html, /reject/i)
    assert.match(html, /not to move forward/i)
  })
})

describe('interview templates', () => {
  const base = {
    candidateName: 'Neha',
    jobTitle: 'Support Engineer',
    companyName: 'Acme Pvt Ltd',
    scheduledAt: new Date('2026-04-01T09:00:00.000Z'),
    durationMinutes: 30,
    interviewType: 'Video Call',
    meetingLink: 'https://meet.example.com/abc',
    location: '',
  }

  test('scheduled template includes date, duration, type, and meeting link', () => {
    const { html, subject } = interviewScheduledTemplate(base)
    assert.match(subject, /Support Engineer/)
    assert.match(html, /30 minutes/)
    assert.match(html, /Video Call/)
    assert.match(html, /meet\.example\.com/)
  })

  test('scheduled template omits meeting link when absent and shows location instead', () => {
    const { html } = interviewScheduledTemplate({ ...base, meetingLink: '', location: 'Office 4B' })
    assert.doesNotMatch(html, /Meeting link/)
    assert.match(html, /Office 4B/)
  })

  test('updated template uses "Interview Updated" heading', () => {
    const { html } = interviewUpdatedTemplate(base)
    assert.match(html, /Interview Updated/)
  })

  test('cancelled template needs no scheduling details, only role/company', () => {
    const { html, subject } = interviewCancelledTemplate({
      candidateName: 'Neha',
      jobTitle: 'Support Engineer',
      companyName: 'Acme Pvt Ltd',
    })
    assert.match(subject, /cancelled/i)
    assert.match(html, /cancelled/i)
  })
})

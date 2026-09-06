import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { buildEmailForNotification, EMAIL_NOTIFICATION_TYPES } from './buildEmail.js'

const application = {
  jobTitle: 'Warehouse Associate',
  companyName: 'Speedy Logistics',
  candidateName: 'Ravi Kumar',
  status: 'reviewing',
}

const interview = {
  scheduledAt: new Date('2026-05-10T05:00:00.000Z'),
  durationMinutes: 45,
  interviewType: 'In-person',
  meetingLink: '',
  location: 'HQ, 3rd Floor',
}

describe('buildEmailForNotification — gating', () => {
  test('returns null for a non-email-worthy notification type', () => {
    const result = buildEmailForNotification(
      { type: 'application_submitted_confirmation', recipientId: 'u1' },
      { application, interview: null, recipientEmail: 'a@b.com', recipientName: 'Ravi' }
    )
    assert.equal(result, null)
  })

  test('returns null when recipientEmail is missing', () => {
    const result = buildEmailForNotification(
      { type: 'new_application' },
      { application, interview: null, recipientEmail: '', recipientName: 'Ravi' }
    )
    assert.equal(result, null)
  })

  test('returns null when the application is missing entirely', () => {
    const result = buildEmailForNotification(
      { type: 'new_application' },
      { application: null, interview: null, recipientEmail: 'a@b.com', recipientName: 'Ravi' }
    )
    assert.equal(result, null)
  })

  test('every type in EMAIL_NOTIFICATION_TYPES is handled (none silently fall through to null with valid data)', () => {
    for (const type of EMAIL_NOTIFICATION_TYPES) {
      const result = buildEmailForNotification(
        { type, status: 'hired' },
        { application, interview, recipientEmail: 'a@b.com', recipientName: 'Ravi' }
      )
      assert.ok(result, `expected an email for type ${type}`)
      assert.equal(result.to, 'a@b.com')
    }
  })
})

describe('buildEmailForNotification — new_application', () => {
  test('builds an email to the employer', () => {
    const result = buildEmailForNotification(
      { type: 'new_application' },
      { application, interview: null, recipientEmail: 'employer@example.com', recipientName: 'Employer Name' }
    )
    assert.equal(result.to, 'employer@example.com')
    assert.match(result.subject, /Warehouse Associate/)
  })
})

describe('buildEmailForNotification — application_status_updated', () => {
  test('status "hired" on the notification selects the hired template', () => {
    const result = buildEmailForNotification(
      { type: 'application_status_updated', status: 'hired' },
      { application, interview: null, recipientEmail: 'c@example.com', recipientName: 'Ravi' }
    )
    assert.match(result.subject, /You got the job/)
  })

  test('status "rejected" on the notification selects the not-selected template', () => {
    const result = buildEmailForNotification(
      { type: 'application_status_updated', status: 'rejected' },
      { application, interview: null, recipientEmail: 'c@example.com', recipientName: 'Ravi' }
    )
    assert.match(result.subject, /Update on your application/)
  })

  test('any other status falls back to the generic status-update template', () => {
    const result = buildEmailForNotification(
      { type: 'application_status_updated', status: 'shortlisted' },
      { application, interview: null, recipientEmail: 'c@example.com', recipientName: 'Ravi' }
    )
    assert.match(result.subject, /status changed/)
  })

  test('falls back to application.status when the notification itself has no status field (older documents)', () => {
    const result = buildEmailForNotification(
      { type: 'application_status_updated' },
      { application: { ...application, status: 'hired' }, interview: null, recipientEmail: 'c@example.com', recipientName: 'Ravi' }
    )
    assert.match(result.subject, /You got the job/)
  })

  test('returns null when companyName is missing (can\'t build a coherent email)', () => {
    const result = buildEmailForNotification(
      { type: 'application_status_updated', status: 'hired' },
      { application: { ...application, companyName: undefined }, interview: null, recipientEmail: 'c@example.com', recipientName: 'Ravi' }
    )
    assert.equal(result, null)
  })
})

describe('buildEmailForNotification — interview events', () => {
  test('interview_scheduled requires a valid interview document', () => {
    const result = buildEmailForNotification(
      { type: 'interview_scheduled' },
      { application, interview: null, recipientEmail: 'c@example.com', recipientName: 'Ravi' }
    )
    assert.equal(result, null)
  })

  test('interview_scheduled builds an email with interview details when interview is present', () => {
    const result = buildEmailForNotification(
      { type: 'interview_scheduled' },
      { application, interview, recipientEmail: 'c@example.com', recipientName: 'Ravi' }
    )
    assert.match(result.subject, /Interview scheduled/)
    assert.match(result.html, /HQ, 3rd Floor/)
  })

  test('interview_updated builds an email with interview details', () => {
    const result = buildEmailForNotification(
      { type: 'interview_updated' },
      { application, interview, recipientEmail: 'c@example.com', recipientName: 'Ravi' }
    )
    assert.match(result.subject, /Interview updated/)
  })

  test('interview_cancelled never needs the interview document itself', () => {
    const result = buildEmailForNotification(
      { type: 'interview_cancelled' },
      { application, interview: null, recipientEmail: 'c@example.com', recipientName: 'Ravi' }
    )
    assert.ok(result)
    assert.match(result.subject, /cancelled/i)
  })

  test('interview_scheduled with an incomplete interview document (missing interviewType) still returns null', () => {
    const result = buildEmailForNotification(
      { type: 'interview_scheduled' },
      {
        application,
        interview: { ...interview, interviewType: undefined },
        recipientEmail: 'c@example.com',
        recipientName: 'Ravi',
      }
    )
    assert.equal(result, null)
  })
})

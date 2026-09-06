import { test, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { handleNotificationEmail } from './handleNotificationEmail.js'

const FieldValue = { serverTimestamp: () => 'SERVER_TIMESTAMP' }

// Minimal in-memory fake standing in for firebase-admin's Firestore —
// enough surface (collection/doc/get/create/update) to exercise every
// branch of handleNotificationEmail without an emulator. `.create()`
// mirrors the real SDK's ALREADY_EXISTS behavior (code 6), which is what
// the idempotency lock in handleNotificationEmail actually relies on.
function createFakeDb(seed = {}) {
  const store = new Map(Object.entries(seed))
  const docRef = (path) => ({
    get: async () => ({ exists: store.has(path), data: () => store.get(path) }),
    create: async (data) => {
      if (store.has(path)) {
        const err = new Error('6 ALREADY_EXISTS: Document already exists')
        err.code = 6
        throw err
      }
      store.set(path, data)
    },
    update: async (data) => {
      store.set(path, { ...(store.get(path) || {}), ...data })
    },
  })
  return {
    collection: (name) => ({ doc: (id) => docRef(`${name}/${id}`) }),
    _get: (path) => store.get(path),
  }
}

const employer = { email: 'employer@example.com', full_name: 'Employer Name', moderationStatus: 'active' }
const candidate = { email: 'candidate@example.com', full_name: 'Candidate Name', moderationStatus: 'active' }
const application = {
  jobTitle: 'Delivery Rider',
  companyName: 'FastShip',
  candidateName: 'Candidate Name',
  employerId: 'emp1',
  candidateId: 'cand1',
  status: 'reviewing',
}

describe('handleNotificationEmail — non-email-worthy types', () => {
  test('skips instantly and never creates an emailLog document', async () => {
    const db = createFakeDb({ 'users/cand1': candidate })
    const result = await handleNotificationEmail({
      db,
      FieldValue,
      notificationId: 'n1',
      notification: { type: 'application_submitted_confirmation', recipientId: 'cand1' },
    })
    assert.deepEqual(result, { status: 'skipped', reason: 'not-an-email-event' })
    assert.equal(db._get('emailLog/n1'), undefined)
  })
})

describe('handleNotificationEmail — happy path', () => {
  beforeEach(() => {
    delete process.env.RESEND_API_KEY
    delete process.env.SIMULATE_EMAIL_FAILURE
  })

  test('new_application: sends (via stub) and records emailLog status "sent"', async () => {
    const db = createFakeDb({ 'users/emp1': employer, 'applications/app1': application })
    const result = await handleNotificationEmail({
      db,
      FieldValue,
      notificationId: 'n1',
      notification: { type: 'new_application', recipientId: 'emp1', relatedApplicationId: 'app1' },
    })
    assert.equal(result.status, 'sent')
    assert.equal(db._get('emailLog/n1').status, 'sent')
    assert.equal(db._get('emailLog/n1').provider, 'stub')
  })

  test('interview_scheduled: fetches the interview doc and sends successfully', async () => {
    const db = createFakeDb({
      'users/cand1': candidate,
      'applications/app1': application,
      'interviews/iv1': {
        scheduledAt: { toDate: () => new Date('2026-06-01T10:00:00.000Z') },
        durationMinutes: 30,
        interviewType: 'Video Call',
        meetingLink: 'https://meet.example.com/xyz',
        location: '',
      },
    })
    const result = await handleNotificationEmail({
      db,
      FieldValue,
      notificationId: 'n2',
      notification: {
        type: 'interview_scheduled',
        recipientId: 'cand1',
        relatedApplicationId: 'app1',
        relatedInterviewId: 'iv1',
      },
    })
    assert.equal(result.status, 'sent')
  })
})

describe('handleNotificationEmail — duplicate prevention', () => {
  test('a second call for the same notificationId is skipped as already-processed', async () => {
    const db = createFakeDb({ 'users/emp1': employer, 'applications/app1': application })
    const notification = { type: 'new_application', recipientId: 'emp1', relatedApplicationId: 'app1' }

    const first = await handleNotificationEmail({ db, FieldValue, notificationId: 'dup1', notification })
    const second = await handleNotificationEmail({ db, FieldValue, notificationId: 'dup1', notification })

    assert.equal(first.status, 'sent')
    assert.deepEqual(second, { status: 'skipped', reason: 'already-processed' })
    // The lock document still reflects the one real send, not overwritten by the skipped retry.
    assert.equal(db._get('emailLog/dup1').status, 'sent')
  })
})

describe('handleNotificationEmail — invalid/missing recipient handling', () => {
  test('recipient user document does not exist (deleted account)', async () => {
    const db = createFakeDb({ 'applications/app1': application })
    const result = await handleNotificationEmail({
      db,
      FieldValue,
      notificationId: 'n3',
      notification: { type: 'new_application', recipientId: 'ghost', relatedApplicationId: 'app1' },
    })
    assert.deepEqual(result, { status: 'skipped', reason: 'recipient-not-found' })
  })

  test('recipient is suspended', async () => {
    const db = createFakeDb({
      'users/emp1': { ...employer, moderationStatus: 'suspended' },
      'applications/app1': application,
    })
    const result = await handleNotificationEmail({
      db,
      FieldValue,
      notificationId: 'n4',
      notification: { type: 'new_application', recipientId: 'emp1', relatedApplicationId: 'app1' },
    })
    assert.deepEqual(result, { status: 'skipped', reason: 'recipient-suspended' })
  })

  test('recipient has no email on file', async () => {
    const db = createFakeDb({
      'users/emp1': { full_name: 'No Email Employer', moderationStatus: 'active' },
      'applications/app1': application,
    })
    const result = await handleNotificationEmail({
      db,
      FieldValue,
      notificationId: 'n5',
      notification: { type: 'new_application', recipientId: 'emp1', relatedApplicationId: 'app1' },
    })
    assert.deepEqual(result, { status: 'skipped', reason: 'recipient-missing-email' })
  })

  test('related application document is missing -> skipped, not crashed', async () => {
    const db = createFakeDb({ 'users/emp1': employer })
    const result = await handleNotificationEmail({
      db,
      FieldValue,
      notificationId: 'n6',
      notification: { type: 'new_application', recipientId: 'emp1', relatedApplicationId: 'does-not-exist' },
    })
    assert.deepEqual(result, { status: 'skipped', reason: 'missing-or-invalid-related-data' })
  })
})

describe('handleNotificationEmail — provider failure handling', () => {
  afterEach(() => {
    delete process.env.SIMULATE_EMAIL_FAILURE
  })

  test('a provider failure is caught, logged to emailLog as "failed", and does not throw', async () => {
    process.env.SIMULATE_EMAIL_FAILURE = 'true'
    const db = createFakeDb({ 'users/emp1': employer, 'applications/app1': application })
    const result = await handleNotificationEmail({
      db,
      FieldValue,
      notificationId: 'n7',
      notification: { type: 'new_application', recipientId: 'emp1', relatedApplicationId: 'app1' },
    })
    assert.equal(result.status, 'failed')
    assert.equal(db._get('emailLog/n7').status, 'failed')
    assert.match(db._get('emailLog/n7').error, /Simulated email provider failure/)
  })
})

describe('handleNotificationEmail — application_status_updated with status field', () => {
  test('propagates notification.status through to email selection (hired)', async () => {
    const db = createFakeDb({
      'users/cand1': candidate,
      'applications/app1': application,
    })
    const result = await handleNotificationEmail({
      db,
      FieldValue,
      notificationId: 'n8',
      notification: {
        type: 'application_status_updated',
        recipientId: 'cand1',
        relatedApplicationId: 'app1',
        status: 'hired',
      },
    })
    assert.equal(result.status, 'sent')
  })
})

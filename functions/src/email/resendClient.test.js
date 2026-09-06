import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { isRealEmailConfigured, sendEmailReal, sendEmailStub, sendEmail } from './resendClient.js'

const message = { to: 'candidate@example.com', subject: 'Test', html: '<p>hi</p>', text: 'hi' }

describe('isRealEmailConfigured', () => {
  test('false when RESEND_API_KEY is not set (the case in every environment today)', () => {
    delete process.env.RESEND_API_KEY
    assert.equal(isRealEmailConfigured(), false)
  })

  test('true once RESEND_API_KEY is present — proves the gate reads live env state, not a cached flag', () => {
    process.env.RESEND_API_KEY = 'test-value-for-gating-check-only-not-a-real-key'
    assert.equal(isRealEmailConfigured(), true)
    delete process.env.RESEND_API_KEY
  })
})

describe('sendEmailReal', () => {
  test('throws immediately when RESEND_API_KEY is unset, without attempting a network call', async () => {
    delete process.env.RESEND_API_KEY
    await assert.rejects(() => sendEmailReal(message), /RESEND_API_KEY is not set/)
  })
})

describe('sendEmailStub', () => {
  test('resolves without any network call or key, returning a stub id', async () => {
    delete process.env.SIMULATE_EMAIL_FAILURE
    const result = await sendEmailStub(message)
    assert.equal(result.id, 'stub')
  })

  describe('when SIMULATE_EMAIL_FAILURE=true', () => {
    before(() => {
      process.env.SIMULATE_EMAIL_FAILURE = 'true'
    })
    after(() => {
      delete process.env.SIMULATE_EMAIL_FAILURE
    })

    test('throws, to exercise the caller\'s failure-handling path', async () => {
      await assert.rejects(() => sendEmailStub(message), /Simulated email provider failure/)
    })
  })
})

describe('sendEmail — provider selection', () => {
  test('uses the stub (source: "stub") whenever RESEND_API_KEY is unset', async () => {
    delete process.env.RESEND_API_KEY
    const result = await sendEmail(message)
    assert.equal(result.source, 'stub')
    assert.equal(result.id, 'stub')
  })
})

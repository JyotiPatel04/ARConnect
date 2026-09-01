import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { templateExplanation, generateExplanation } from './explanation.js'
import { isRealClaudeConfigured } from './claudeClient.js'
import { computeScore } from './scoreCandidate.js'

const profile = {
  skills: ['Sales', 'Communication', 'MS Excel'],
  experienceYears: 2,
  location: 'Varanasi',
  preferredJobTypes: ['Full-time'],
  preferredWorkModes: ['Onsite'],
  expectedSalaryMin: 18000,
  expectedSalaryMax: 25000,
}
const job = {
  skills: ['Sales', 'Communication', 'MS Excel', 'Negotiation'],
  experienceLevel: '0-2 years',
  location: 'Varanasi',
  jobType: 'Full-time',
  workMode: 'Onsite',
  salaryMin: 18000,
  salaryMax: 25000,
}

describe('templateExplanation', () => {
  test('a null score produces a clear "complete your profile" message, not a fabricated sentence', () => {
    const text = templateExplanation(null, {})
    assert.match(text, /complete more of your profile/i)
  })

  test('produces a non-empty sentence for a real score/breakdown', () => {
    const { score, breakdown } = computeScore(profile, job)
    const text = templateExplanation(score, breakdown)
    assert.ok(text.length > 0)
  })

  test('mentions missing factors so the candidate knows what to add', () => {
    const incompleteProfile = { ...profile, expectedSalaryMin: null, expectedSalaryMax: null }
    const { score, breakdown } = computeScore(incompleteProfile, job)
    const text = templateExplanation(score, breakdown)
    assert.match(text, /salary/i)
  })
})

// Pure gating-logic check — no network call, no key. Confirms the switch
// generateExplanation uses to pick real Claude vs. the stub is driven
// entirely by whether ANTHROPIC_API_KEY is present in the environment,
// which stays unset in this test run, the emulator, and every environment
// until a future secret-bound deploy the user hasn't approved yet.
describe('isRealClaudeConfigured', () => {
  test('false when ANTHROPIC_API_KEY is not set (the case in every environment today)', () => {
    delete process.env.ANTHROPIC_API_KEY
    assert.equal(isRealClaudeConfigured(), false)
  })

  test('true once ANTHROPIC_API_KEY is present — proves the gate reads live env state, not a cached flag', () => {
    process.env.ANTHROPIC_API_KEY = 'test-value-for-gating-check-only-not-a-real-key'
    assert.equal(isRealClaudeConfigured(), true)
    delete process.env.ANTHROPIC_API_KEY
  })
})

describe('generateExplanation — Claude availability', () => {
  test('when ANTHROPIC_API_KEY is unset, the stub path is used and source is "claude-stub"', async () => {
    delete process.env.SIMULATE_CLAUDE_FAILURE
    delete process.env.ANTHROPIC_API_KEY
    const { score, breakdown } = computeScore(profile, job)
    const result = await generateExplanation({ score, breakdown, jobTitle: job.jobTitle, companyName: 'ABC Pvt Ltd' })
    assert.equal(result.source, 'claude-stub')
    assert.ok(result.text.length > 0)
  })

  describe('when Claude is unavailable', () => {
    before(() => {
      process.env.SIMULATE_CLAUDE_FAILURE = 'true'
    })
    after(() => {
      delete process.env.SIMULATE_CLAUDE_FAILURE
    })

    test('falls back to the template and still returns a usable explanation', async () => {
      const { score, breakdown } = computeScore(profile, job)
      const result = await generateExplanation({ score, breakdown })
      assert.equal(result.source, 'fallback-template')
      assert.equal(result.text, templateExplanation(score, breakdown))
    })

    test('the score itself is entirely unaffected by Claude being unavailable', () => {
      // computeScore never calls generateExplanation or anything AI-related
      // — this just documents/re-confirms that independence at the test
      // level for this module too.
      const { score: scoreA } = computeScore(profile, job)
      process.env.SIMULATE_CLAUDE_FAILURE = 'true'
      const { score: scoreB } = computeScore(profile, job)
      assert.equal(scoreA, scoreB)
    })
  })
})

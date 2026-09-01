import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { computeInputHash } from './inputHash.js'

const profile = {
  skills: ['Sales', 'Excel'],
  experienceYears: 2,
  location: 'Varanasi',
  preferredJobTypes: ['Full-time'],
  preferredWorkModes: ['Onsite'],
  expectedSalaryMin: 18000,
  expectedSalaryMax: 25000,
  bio: 'irrelevant to scoring',
}
const job = {
  skills: ['Sales', 'Excel'],
  experienceLevel: '0-2 years',
  location: 'Varanasi',
  workMode: 'Onsite',
  jobType: 'Full-time',
  salaryMin: 18000,
  salaryMax: 25000,
  description: 'irrelevant to scoring',
}

describe('computeInputHash', () => {
  test('is deterministic for identical input', () => {
    assert.equal(computeInputHash(profile, job), computeInputHash(profile, job))
  })

  test('changes when a scoring-relevant field changes', () => {
    const changedProfile = { ...profile, skills: ['Sales'] }
    assert.notEqual(computeInputHash(profile, job), computeInputHash(changedProfile, job))
  })

  test('changes when a scoring-relevant job field changes', () => {
    const changedJob = { ...job, salaryMax: 30000 }
    assert.notEqual(computeInputHash(profile, job), computeInputHash(profile, changedJob))
  })

  test('does NOT change when a non-scoring field changes (bio)', () => {
    const changedProfile = { ...profile, bio: 'a totally different bio' }
    assert.equal(computeInputHash(profile, job), computeInputHash(changedProfile, job))
  })

  test('does NOT change when a non-scoring job field changes (description)', () => {
    const changedJob = { ...job, description: 'a totally different description' }
    assert.equal(computeInputHash(profile, job), computeInputHash(profile, changedJob))
  })
})

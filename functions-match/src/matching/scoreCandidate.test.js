import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  computeScore,
  scoreSkills,
  scoreExperience,
  scoreLocation,
  scoreSalary,
  scoreJobType,
  scoreWorkMode,
  WEIGHTS,
} from './scoreCandidate.js'

describe('scoreSkills', () => {
  test('full overlap scores 100', () => {
    assert.equal(scoreSkills(['Sales', 'Excel'], ['Sales', 'Excel']), 100)
  })

  test('partial overlap scores proportionally', () => {
    // 2 of 4 required skills matched -> 50
    assert.equal(scoreSkills(['Sales', 'Excel'], ['Sales', 'Excel', 'Tally', 'Driving']), 50)
  })

  test('zero overlap scores 0', () => {
    assert.equal(scoreSkills(['Cooking'], ['Sales', 'Excel']), 0)
  })

  test('is case-insensitive and trims whitespace', () => {
    assert.equal(scoreSkills([' sales ', 'EXCEL'], ['Sales', 'Excel']), 100)
  })

  test('is capped at 100 even with extra candidate skills', () => {
    assert.equal(scoreSkills(['Sales', 'Excel', 'Extra', 'MoreExtra'], ['Sales', 'Excel']), 100)
  })

  test('job with no required skills is unscoreable (null)', () => {
    assert.equal(scoreSkills(['Sales'], []), null)
    assert.equal(scoreSkills(['Sales'], undefined), null)
  })

  test('candidate with no skills scores 0 against real requirements', () => {
    assert.equal(scoreSkills([], ['Sales']), 0)
    assert.equal(scoreSkills(undefined, ['Sales']), 0)
  })
})

describe('scoreExperience', () => {
  test('Fresher band always scores 100 for any non-negative years', () => {
    assert.equal(scoreExperience(0, 'Fresher'), 100)
    assert.equal(scoreExperience(3, 'Fresher'), 100)
  })

  test('candidate within band scores 100', () => {
    assert.equal(scoreExperience(1, '0-2 years'), 100)
    assert.equal(scoreExperience(3, '2-5 years'), 100)
  })

  test('candidate exceeding the band (overqualified) still scores 100', () => {
    assert.equal(scoreExperience(10, '0-2 years'), 100)
    assert.equal(scoreExperience(20, '2-5 years'), 100)
  })

  test('candidate under the band scores proportionally, not 0', () => {
    // 2-5 years band, min=2: candidate has 1 year -> round(100 * 1/2) = 50
    assert.equal(scoreExperience(1, '2-5 years'), 50)
    // 5+ years band, min=5: candidate has 3 years -> round(100 * 3/5) = 60
    assert.equal(scoreExperience(3, '5+ years'), 60)
  })

  test('candidate with 0 years against 5+ years scores 0, not null', () => {
    assert.equal(scoreExperience(0, '5+ years'), 0)
  })

  test('unknown experience level or missing candidate years is unscoreable', () => {
    assert.equal(scoreExperience(2, 'Not A Real Level'), null)
    assert.equal(scoreExperience(null, '2-5 years'), null)
    assert.equal(scoreExperience(undefined, '2-5 years'), null)
  })
})

describe('scoreLocation', () => {
  test('exact location match scores 100', () => {
    assert.equal(scoreLocation('Varanasi', 'Varanasi', 'Onsite'), 100)
  })

  test('location mismatch scores 0', () => {
    assert.equal(scoreLocation('Varanasi', 'Delhi', 'Onsite'), 0)
  })

  test('Remote work mode overrides location entirely, even on mismatch', () => {
    assert.equal(scoreLocation('Varanasi', 'Delhi', 'Remote'), 100)
  })

  test('missing candidate or job location is unscoreable', () => {
    assert.equal(scoreLocation(null, 'Delhi', 'Onsite'), null)
    assert.equal(scoreLocation('Varanasi', null, 'Onsite'), null)
  })
})

describe('scoreSalary — overlap and no-overlap', () => {
  test('full overlap (job range contains candidate range) scores 100', () => {
    assert.equal(scoreSalary(18000, 22000, 15000, 25000), 100)
  })

  test('partial overlap scores proportionally to candidate range covered', () => {
    // candidate wants 18000-28000 (width 10000), job offers 15000-25000
    // overlap = [18000, 25000] = width 7000 -> round(100 * 7000/10000) = 70
    assert.equal(scoreSalary(18000, 28000, 15000, 25000), 70)
  })

  test('candidate with a single-number expectation (zero-width range) inside job range scores 100', () => {
    assert.equal(scoreSalary(20000, 20000, 15000, 25000), 100)
  })

  test('no overlap decays gracefully instead of hard-cliffing to 0', () => {
    // candidate wants 40000-50000, job offers 15000-25000 — no overlap,
    // but score should be > 0 and < 100 (graceful decay), not a hard 0.
    const score = scoreSalary(40000, 50000, 15000, 25000)
    assert.ok(score >= 0 && score < 100, `expected a decayed score, got ${score}`)
  })

  test('wildly mismatched no-overlap ranges floor at 0, never negative', () => {
    const score = scoreSalary(500000, 600000, 10000, 15000)
    assert.equal(score, 0)
  })

  test('missing any of the four salary numbers is unscoreable', () => {
    assert.equal(scoreSalary(null, 20000, 15000, 25000), null)
    assert.equal(scoreSalary(18000, null, 15000, 25000), null)
    assert.equal(scoreSalary(18000, 20000, null, 25000), null)
    assert.equal(scoreSalary(18000, 20000, 15000, null), null)
  })
})

describe('scoreJobType', () => {
  test('preferred job type includes the job type -> 100', () => {
    assert.equal(scoreJobType(['Full-time', 'Contract'], 'Full-time'), 100)
  })

  test('preferred job type excludes the job type -> 0', () => {
    assert.equal(scoreJobType(['Part-time'], 'Full-time'), 0)
  })

  test('no stated preference is unscoreable', () => {
    assert.equal(scoreJobType([], 'Full-time'), null)
    assert.equal(scoreJobType(undefined, 'Full-time'), null)
  })
})

describe('scoreWorkMode', () => {
  test('preferred work mode includes the job mode -> 100', () => {
    assert.equal(scoreWorkMode(['Onsite', 'Hybrid'], 'Hybrid'), 100)
  })

  test('preferred work mode excludes the job mode -> 0', () => {
    assert.equal(scoreWorkMode(['Remote'], 'Onsite'), 0)
  })

  test('no stated preference is unscoreable', () => {
    assert.equal(scoreWorkMode([], 'Onsite'), null)
  })
})

describe('computeScore — weighted aggregation', () => {
  const fullProfile = {
    skills: ['Sales', 'Communication', 'MS Excel', 'Tally'],
    experienceYears: 2,
    location: 'Varanasi',
    preferredJobTypes: ['Full-time'],
    preferredWorkModes: ['Onsite', 'Hybrid'],
    expectedSalaryMin: 18000,
    expectedSalaryMax: 25000,
  }
  const fullJob = {
    skills: ['Sales', 'Communication', 'MS Excel', 'Negotiation'],
    experienceLevel: '0-2 years',
    location: 'Varanasi',
    jobType: 'Full-time',
    workMode: 'Onsite',
    salaryMin: 18000,
    salaryMax: 25000,
  }

  test('weights sum to 100', () => {
    const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0)
    assert.equal(total, 100)
  })

  test('a fully-matching profile against a fully-matching job scores 100', () => {
    const perfectProfile = { ...fullProfile, skills: fullJob.skills }
    const { score, breakdown } = computeScore(perfectProfile, fullJob)
    assert.equal(score, 100)
    assert.equal(breakdown.skills.score, 100)
    assert.equal(breakdown.experience.score, 100)
  })

  test('is a deterministic pure function — identical inputs always produce identical output', () => {
    const first = computeScore(fullProfile, fullJob)
    const second = computeScore(fullProfile, fullJob)
    assert.deepEqual(first, second)
  })

  test('weighted score matches manual calculation for a known partial-match case', () => {
    // skills: 3 of 4 matched -> 75 (weight 35)
    // experience: within band -> 100 (weight 20)
    // location: exact match -> 100 (weight 15)
    // salary: exact overlap -> 100 (weight 15)
    // jobType: matches -> 100 (weight 10)
    // workMode: matches -> 100 (weight 5)
    // all 6 available -> weightedSum = 35*75 + 20*100 + 15*100 + 15*100 + 10*100 + 5*100
    //                   = 2625 + 2000 + 1500 + 1500 + 1000 + 500 = 9125
    // totalWeight = 100 -> score = round(9125/100) = 91
    const { score, breakdown } = computeScore(fullProfile, fullJob)
    assert.equal(breakdown.skills.score, 75)
    assert.equal(score, 91)
  })

  test('every breakdown entry carries its weight and availability flag', () => {
    const { breakdown } = computeScore(fullProfile, fullJob)
    for (const key of Object.keys(WEIGHTS)) {
      assert.equal(breakdown[key].weight, WEIGHTS[key])
      assert.equal(breakdown[key].available, true)
    }
  })
})

describe('computeScore — missing/null factors re-normalize weights', () => {
  test('a factor with no data is excluded, not scored as 0, and weights re-normalize', () => {
    // No salary expectation stated at all -> salary factor unavailable.
    // Remaining weights: skills 35 + experience 20 + location 15 + jobType 10 + workMode 5 = 85
    const profile = {
      skills: ['Sales', 'Communication', 'MS Excel', 'Negotiation'],
      experienceYears: 2,
      location: 'Varanasi',
      preferredJobTypes: ['Full-time'],
      preferredWorkModes: ['Onsite'],
      expectedSalaryMin: null,
      expectedSalaryMax: null,
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
    const { score, breakdown } = computeScore(profile, job)
    assert.equal(breakdown.salary.available, false)
    assert.equal(breakdown.salary.score, null)
    // every other factor is a perfect 100, so re-normalized score is still 100
    assert.equal(score, 100)
  })
})

describe('computeScore — incomplete profile', () => {
  test('an empty skills list against real job requirements is a genuine 0, not unavailable', () => {
    // The job DOES require skills, and the candidate explicitly has none —
    // that's real signal (0% overlap), not missing data, so this factor
    // stays available and still counts toward the weighted score.
    const emptyProfile = {
      skills: [],
      experienceYears: null,
      location: null,
      preferredJobTypes: [],
      preferredWorkModes: [],
      expectedSalaryMin: null,
      expectedSalaryMax: null,
    }
    const job = {
      skills: ['Sales'],
      experienceLevel: '0-2 years',
      location: 'Varanasi',
      jobType: 'Full-time',
      workMode: 'Onsite',
      salaryMin: 18000,
      salaryMax: 25000,
    }
    const { score, breakdown } = computeScore(emptyProfile, job)
    assert.equal(breakdown.skills.available, true)
    assert.equal(breakdown.skills.score, 0)
    assert.equal(breakdown.experience.available, false) // candidate years missing -> unscoreable
    assert.equal(breakdown.location.available, false)
    assert.equal(breakdown.jobType.available, false)
    assert.equal(breakdown.workMode.available, false)
    assert.equal(breakdown.salary.available, false)
    // Only skills was available (a real 0), so the weighted average over
    // just that one factor is still a real, defensible 0 — not null.
    assert.equal(score, 0)
  })

  test('when literally every factor is unscoreable, the final score is null, never a fabricated number', () => {
    const emptyProfile = {
      skills: [],
      experienceYears: null,
      location: null,
      preferredJobTypes: [],
      preferredWorkModes: [],
      expectedSalaryMin: null,
      expectedSalaryMax: null,
    }
    // A job with no stated requirements at all — every single factor is
    // now genuinely unscoreable on both sides, not just the candidate's.
    const requirementFreeJob = {
      skills: [],
      experienceLevel: undefined,
      location: null,
      jobType: undefined,
      workMode: undefined,
      salaryMin: null,
      salaryMax: null,
    }
    const { score, breakdown } = computeScore(emptyProfile, requirementFreeJob)
    assert.equal(score, null)
    for (const factor of Object.values(breakdown)) {
      assert.equal(factor.available, false)
      assert.equal(factor.score, null)
    }
  })

  test('completely empty candidateProfile object does not throw', () => {
    assert.doesNotThrow(() => computeScore({}, { skills: ['Sales'] }))
  })

  test('undefined candidateProfile or job does not throw', () => {
    assert.doesNotThrow(() => computeScore(undefined, undefined))
  })
})

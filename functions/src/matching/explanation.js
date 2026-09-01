// generateExplanation()'s contract (try AI, fall back to the template on
// any failure) never changes: which AI path it tries — the real Claude
// call or the free/offline stub — is decided once, by whether
// ANTHROPIC_API_KEY is actually populated in this process's environment.
// See claudeClient.js for exactly when that becomes true.
import { callClaudeReal, isRealClaudeConfigured } from './claudeClient.js'

const FACTOR_LABELS = {
  skills: 'required skills',
  experience: 'experience level',
  location: 'location',
  salary: 'salary expectations',
  jobType: 'job type preference',
  workMode: 'work mode preference',
}

function joinList(items) {
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

function describeFactors(breakdown) {
  const entries = Object.entries(breakdown)
  const available = entries.filter(([, f]) => f.available)
  return {
    strong: available.filter(([, f]) => f.score >= 70).map(([key]) => FACTOR_LABELS[key]),
    weak: available.filter(([, f]) => f.score < 40).map(([key]) => FACTOR_LABELS[key]),
    missing: entries.filter(([, f]) => !f.available).map(([key]) => FACTOR_LABELS[key]),
  }
}

// Always available, zero dependencies, zero cost — the guaranteed fallback
// whenever the AI step is unavailable, not configured, or fails.
export function templateExplanation(score, breakdown) {
  if (score === null) {
    return 'Complete more of your profile to see a match score for this job.'
  }

  const { strong, weak, missing } = describeFactors(breakdown)
  const parts = []
  if (strong.length > 0) parts.push(`Strong alignment on ${joinList(strong)}`)
  if (weak.length > 0) parts.push(`less aligned on ${joinList(weak)}`)

  let sentence = parts.length > 0 ? `${parts.join(', but ')}.` : `Overall match score: ${score}%.`
  if (missing.length > 0) {
    sentence += ` Add your ${joinList(missing)} to your profile for a more complete match.`
  }
  return sentence
}

// STUB — makes no network call and needs no API key. Returns the same
// underlying information a real Claude prompt would be given, phrased
// deterministically. Throws (to exercise the fallback path in tests) when
// SIMULATE_CLAUDE_FAILURE=true is set in the function's environment.
export async function callClaudeStub({ score, breakdown, jobTitle, companyName }) {
  if (process.env.SIMULATE_CLAUDE_FAILURE === 'true') {
    throw new Error('Simulated Claude failure (SIMULATE_CLAUDE_FAILURE=true) — for testing the fallback path only.')
  }
  const base = templateExplanation(score, breakdown)
  const prefix = jobTitle && companyName ? `For the ${jobTitle} role at ${companyName}: ` : ''
  return `${prefix}${base}`
}

/**
 * @returns {Promise<{ text: string, source: 'claude' | 'claude-stub' | 'fallback-template' }>}
 */
export async function generateExplanation({ score, breakdown, jobTitle, companyName }) {
  const useReal = isRealClaudeConfigured()
  try {
    const text = useReal
      ? await callClaudeReal({ score, breakdown, jobTitle, companyName })
      : await callClaudeStub({ score, breakdown, jobTitle, companyName })
    return { text, source: useReal ? 'claude' : 'claude-stub' }
  } catch {
    return { text: templateExplanation(score, breakdown), source: 'fallback-template' }
  }
}

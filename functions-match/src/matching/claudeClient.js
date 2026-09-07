// Real Claude call — written and committed now, but genuinely inert until
// TWO separate things both happen later, neither of which this file or
// this commit does on its own:
//   1. An ANTHROPIC_API_KEY secret actually exists in Secret Manager
//      (created by running `firebase functions:secrets:set` in a
//      terminal — see functions/SECRET_SETUP.md).
//   2. computeMatch is redeployed with that secret bound (functions/index.js
//      already declares the binding, but binding it in source doesn't
//      populate process.env.ANTHROPIC_API_KEY until that deploy actually
//      runs).
// Until both happen, process.env.ANTHROPIC_API_KEY is undefined in every
// environment this code runs in — including the emulator, which never
// reads Secret Manager — so isRealClaudeConfigured() stays false and
// generateExplanation() keeps using the stub, unchanged.
import Anthropic from '@anthropic-ai/sdk'

const MODEL = 'claude-haiku-4-5-20251001'

export function isRealClaudeConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

const FACTOR_LABELS = {
  skills: 'required skills',
  experience: 'experience level',
  location: 'location',
  salary: 'salary expectations',
  jobType: 'job type preference',
  workMode: 'work mode preference',
}

function describeBreakdown(breakdown) {
  return Object.entries(breakdown)
    .filter(([, factor]) => factor.available)
    .map(([key, factor]) => `${FACTOR_LABELS[key] || key}: ${factor.score}/100`)
    .join('; ')
}

function buildPrompt({ score, breakdown, jobTitle, companyName }) {
  const factorLine = describeBreakdown(breakdown) || 'no factors could be scored yet'
  const roleLine = jobTitle && companyName ? `the "${jobTitle}" role at ${companyName}` : 'this role'
  return [
    `A candidate has an already-computed AI match score of ${score === null ? 'N/A' : `${score}/100`} for ${roleLine}.`,
    `Per-factor breakdown (already computed, do not recalculate): ${factorLine}.`,
    'Write exactly one short, encouraging sentence (max 30 words) explaining this match to the candidate.',
    'Only reference the numbers given above — never invent or restate a different score.',
  ].join(' ')
}

// Throws on any failure (missing key, network error, empty response) so
// generateExplanation()'s existing catch block falls through to the
// deterministic template — the explanation step is never allowed to block
// or blank out a match result.
export async function callClaudeReal({ score, breakdown, jobTitle, companyName }) {
  const client = new Anthropic()
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 120,
    messages: [{ role: 'user', content: buildPrompt({ score, breakdown, jobTitle, companyName }) }],
  })

  const text = message.content.find((block) => block.type === 'text')?.text?.trim()
  if (!text) {
    throw new Error('Claude response contained no text content.')
  }
  return text
}

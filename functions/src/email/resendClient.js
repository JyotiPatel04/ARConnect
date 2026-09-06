// Real email send via Resend's HTTP API — written and committed now, but
// genuinely inert until a RESEND_API_KEY secret actually exists in Secret
// Manager AND sendNotificationEmail is redeployed with it bound (same
// two-step pattern as ANTHROPIC_API_KEY/computeMatch — see
// functions/SECRET_SETUP.md). No SDK dependency: Node 20's built-in fetch
// is enough for Resend's single-endpoint API, so this adds zero new
// runtime dependencies to functions/package.json.
const RESEND_API_URL = 'https://api.resend.com/emails'

export function isRealEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY)
}

function fromAddress() {
  // Not a secret — just which verified sender address to send as. Defaults
  // to Resend's no-signup-required sandbox address so the emulator/tests
  // never crash for lack of configuration; production must override this
  // with a real address on a domain verified in the Resend dashboard (see
  // functions/SECRET_SETUP.md).
  return process.env.RESEND_FROM_EMAIL || 'ARConnect <onboarding@resend.dev>'
}

// Throws on any failure (missing key, network error, non-2xx response) so
// the caller's try/catch can log it to emailLog without ever letting an
// email failure propagate back to the Firestore write that triggered it.
export async function sendEmailReal({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set — cannot send a real email.')
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: fromAddress(), to, subject, html, text }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Resend API responded ${response.status}: ${body.slice(0, 500)}`)
  }

  const data = await response.json()
  return { id: data.id }
}

// STUB — makes no network call and needs no API key. Used whenever
// RESEND_API_KEY isn't configured (every environment today: local
// emulator, CI, and production until a deliberate secret + deploy
// decision is made). Logs instead of sending so the rest of the pipeline
// (idempotency, recipient resolution, template selection) is still fully
// exercised in tests and in the emulator without ever making a network
// call or requiring a key.
export async function sendEmailStub({ to, subject }) {
  if (process.env.SIMULATE_EMAIL_FAILURE === 'true') {
    throw new Error('Simulated email provider failure (SIMULATE_EMAIL_FAILURE=true) — for testing the failure path only.')
  }
  console.log(`[email-stub] Would send "${subject}" to ${to}`)
  return { id: 'stub' }
}

/**
 * @returns {Promise<{ id: string, source: 'resend' | 'stub' }>}
 */
export async function sendEmail({ to, subject, html, text }) {
  const useReal = isRealEmailConfigured()
  const result = useReal
    ? await sendEmailReal({ to, subject, html, text })
    : await sendEmailStub({ to, subject, html, text })
  return { ...result, source: useReal ? 'resend' : 'stub' }
}

import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { defineSecret, defineString } from 'firebase-functions/params'
import { handleNotificationEmail } from './src/email/handleNotificationEmail.js'

initializeApp()
const db = getFirestore()

// Declaring this does not fetch, expose, or activate anything by itself.
// See functions/SECRET_SETUP.md for the two-step process (create the
// secret, then deploy sendNotificationEmail with it bound) required before
// real emails are ever sent.
const resendApiKey = defineSecret('RESEND_API_KEY')

// Not a secret — just the verified "from" address to send as. Defaults to
// Resend's sandbox address (no domain verification required, but only
// deliverable in Resend's own test mode) so the emulator and every
// environment today keeps working with zero configuration. Production
// needs this overridden to a real address on a domain verified in the
// Resend dashboard — see functions/SECRET_SETUP.md.
const resendFromEmail = defineString('RESEND_FROM_EMAIL', { default: 'ARConnect <onboarding@resend.dev>' })

// Fires once per new notifications/{id} document — i.e. once per existing
// in-app notification event, reusing the exact recipient-verification
// work the Firestore rules already did on that write (see
// firestore.rules' notifications.create branches). Only a handful of
// notification types are email-worthy (handleNotificationEmail checks
// this); the rest (e.g. application_submitted_confirmation) are silently
// left in-app-only, matching the spec's 8 named events.
//
// No retry policy is configured (Cloud Functions v2 default: best-effort,
// no automatic retry), and handleNotificationEmail never throws — both
// deliberate, to avoid ever sending the same email twice. RESEND_FROM_EMAIL
// isn't in `secrets` because defineString params aren't secrets; binding
// it isn't required for it to be read via process.env at runtime once
// deployed with a value set.
//
// region: 'asia-south1' pins this alongside the project's Firestore
// database and Storage bucket, both already in asia-south1 — without it,
// a 2nd-gen Firestore trigger defaults to us-central1, which would put
// this function's every Firestore read on the far side of the world from
// the data it's reading.
export const sendNotificationEmail = onDocumentCreated(
  { document: 'notifications/{notificationId}', region: 'asia-south1', secrets: [resendApiKey] },
  async (event) => {
    const notification = event.data?.data()
    if (!notification) return
    await handleNotificationEmail({
      db,
      FieldValue,
      notificationId: event.params.notificationId,
      notification,
    })
  }
)

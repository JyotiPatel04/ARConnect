# Setting the real Anthropic API key (when you're ready to go live)

This project's code is already prepared to use a real Claude call
(`functions/src/matching/claudeClient.js`), but nothing in this repo can
turn it on. It stays off until you run the commands below yourself, in
your own terminal — the key is never pasted into chat, never written to
any file in this repo, and never committed to git.

Run these from the `functions/` directory, after `firebase login` if you
aren't already signed in:

```
firebase functions:secrets:set ANTHROPIC_API_KEY --project arconnect-7337f
```

This prompts interactively for the secret value (input is hidden) and
stores it in Google Cloud Secret Manager, scoped to this project — not in
Firestore, not in `.env`, not in any file on disk.

To confirm it was created (this only shows metadata, never the value):

```
firebase functions:secrets:access ANTHROPIC_API_KEY --project arconnect-7337f
```

That command actually does print the value to your terminal (so you can
verify you set it correctly) — run it only in a terminal you trust, and
never paste its output anywhere, including back to Claude.

## What still needs to happen after that

Creating the secret alone does **not** make the real API live.
`computeMatch` also has to be redeployed with the secret bound — which
`functions/index.js` already declares (`secrets: [anthropicApiKey]`), but
which only takes effect on an actual:

```
firebase deploy --only functions:computeMatch --project arconnect-7337f
```

Do not run that deploy until you've explicitly decided you want the real
Claude integration live — it is a separate, deliberate step from creating
the secret.

## Rolling back

To disable the real integration again later without touching code, either
delete the secret (`firebase functions:secrets:destroy ANTHROPIC_API_KEY`)
or just don't bind/deploy it — `generateExplanation()` falls back to the
free, offline stub automatically whenever `ANTHROPIC_API_KEY` isn't
present in the function's environment, with zero code changes required.

---

# Setting up real email delivery (Resend), when you're ready to go live

Same story as above, for `functions/src/email/resendClient.js` and the
`sendNotificationEmail` Firestore-triggered function in
`functions/index.js`. Nothing in this repo can turn on real email sending
by itself — it stays off (using a stub that only logs what it would have
sent) until you do all of the following yourself.

## 1. Create a Resend account and verify a sending domain

Sign up at resend.com, then add and verify a domain you control (DNS
records) under Domains in the dashboard. Until a domain is verified,
Resend only lets you send to your own account's email address using its
shared `onboarding@resend.dev` sender — fine for testing, not for real
users.

## 2. Set the API key secret

From the `functions/` directory, after `firebase login`:

```
firebase functions:secrets:set RESEND_API_KEY --project arconnect-7337f
```

Same guarantees as `ANTHROPIC_API_KEY` above: prompts interactively,
stored only in Secret Manager, never in this repo, never in chat.

## 3. Set the "from" address

`RESEND_FROM_EMAIL` is a plain (non-secret) Cloud Functions parameter, not
a Secret Manager value — it's just which verified address to send as, e.g.
`ARConnect <notifications@yourdomain.com>`. It already has a default
(`ARConnect <onboarding@resend.dev>`, Resend's sandbox address), so
`firebase deploy` will NOT prompt for it — to override it, create a file
named `.env.arconnect-7337f` in this `functions/` directory (this exact
filename — matching the project ID — is how `firebase-functions/params`
finds project-specific values; it is already covered by this repo's
`.gitignore` `.env*` pattern, so it's never committed) containing:

```
RESEND_FROM_EMAIL="ARConnect <notifications@yourdomain.com>"
```

Leaving this step out keeps the built-in sandbox default, which only
delivers to your own Resend account's email address, never real users.

## 4. Deploy the function

```
firebase deploy --only functions:sendNotificationEmail --project arconnect-7337f
```

Do not run that deploy until you've explicitly decided you want real
emails going out — like the AI matching integration, this is a separate,
deliberate step from creating the secret, and (unlike AI matching) this
one deploy target requires a Firestore trigger, which — same as every
Cloud Function in this project — requires the Blaze plan.

## Rolling back

Delete the secret (`firebase functions:secrets:destroy RESEND_API_KEY`) or
don't deploy/redeploy with it bound — `sendEmail()` falls back to the
stub (logs only, no network call, no real email sent) automatically
whenever `RESEND_API_KEY` isn't present in the function's environment.

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

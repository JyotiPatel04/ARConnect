import { defineConfig } from 'vitest/config'

// Deliberately separate from vite.config.js: unit tests (src/lib/**) and
// rules tests (tests/rules/**) are both plain Node — no DOM, no React, no
// Tailwind — so this config skips the app's build plugins entirely rather
// than inheriting them. `npm run test:unit` / `test:rules` target the two
// directories independently (see package.json) so a plain `vitest run`
// here is never invoked without one of those two scopes. E2E tests
// (tests/e2e/**) run under Playwright's own test runner, not Vitest.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/lib/**/*.test.js', 'tests/rules/**/*.test.js'],
    // firebase.json's emulators config runs in singleProjectMode -- every
    // rules test file shares ONE underlying Firestore/Auth namespace no
    // matter what projectId string it passes, so running rules-test files
    // in parallel could seed/read across each other's fixtures. Test files
    // also use unique per-file ID prefixes as defense in depth, but this
    // is the setting that actually rules the race out.
    fileParallelism: false,
    // fileParallelism alone still spawned separate worker processes that
    // all raced to connect to the emulator at once on a cold start.
    // singleFork forces genuinely one-process, one-file-at-a-time
    // execution -- the real fix for that race, not just a smaller
    // symptom. Timeouts are raised because real emulator I/O (network
    // round trips to a JVM process, not in-memory calls) is inherently
    // slower than Vitest's defaults assume, especially right after the
    // emulator has just started.
    pool: 'forks',
    singleFork: true,
    hookTimeout: 30000,
    testTimeout: 20000,
  },
})

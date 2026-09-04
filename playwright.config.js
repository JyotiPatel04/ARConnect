import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const BASE_URL = `http://localhost:${PORT}`

// E2E always runs against a local preview server serving a build made with
// `vite build --mode test` (see package.json's `test:e2e` / `pretest:e2e`),
// which forces VITE_USE_FIREBASE_EMULATOR=true via the committed
// .env.test -- the built bundle can never point at production, regardless
// of what a developer's own .env/.env.local happens to contain. The
// preview server itself is only ever started here, by this config, against
// that build -- there is no path from `npm run test:e2e` to the real
// arconnect-7337f project.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30000,
  expect: { timeout: 8000 },
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `npm run preview -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], channel: 'chrome' } }],
})

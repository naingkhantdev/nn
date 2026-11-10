import { defineConfig, devices } from '@playwright/test'

// Smoke test the production build in WebKit on an iPhone 13 preset.
// Use 127.0.0.1, not localhost: on Windows localhost can resolve to ::1
// while the server listens on IPv4, and Playwright then never sees it.
const origin = 'http://127.0.0.1:4173'

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'test-results',
  timeout: 30_000,
  use: {
    baseURL: origin,
  },
  projects: [{ name: 'iphone-webkit', use: { ...devices['iPhone 13'] } }],
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url: origin,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})

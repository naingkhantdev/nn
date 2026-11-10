import { defineConfig, devices } from '@playwright/test'

// Smoke and screen tests in WebKit on an iPhone 13 preset.
// The build uses --mode e2e so tests can open signed-in screens via `?e2e`;
// without `?e2e` the app behaves exactly like production (real Firebase).
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
    command:
      'npx tsc -b && npx vite build --mode e2e --outDir dist-e2e && npx vite preview --outDir dist-e2e --host 127.0.0.1 --port 4173 --strictPort',
    url: origin,
    reuseExistingServer: false,
    timeout: 180_000,
  },
})

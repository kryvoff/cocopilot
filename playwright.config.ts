import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './test/e2e',
  timeout: 60000,
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
    },
  },
  retries: 0,
  workers: 1, // Electron tests must run serially
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'electron',
      testMatch: '**/*.test.ts',
    },
  ],
})

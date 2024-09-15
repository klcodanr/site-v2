import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  reporter: [['html', { open: 'never' }], ['list']],
  webServer: {
    command: "npm run preview",
    url: "http://localhost:4321/",
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  retries: 2,
  use: {
    baseURL: "http://localhost:4321/",
  },
  testDir: "test",
  projects: [
    /* Test against desktop browsers */
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ]
});

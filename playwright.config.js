/* eslint-disable notice/notice */

import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();
const ui_mongo_db = `${process.env.MONGO_URL.replace(/\/$/, '')}/ui`;
// delete PORT, as the process env from this propagates into the client
// if not deleted, the client attempts to run on the same PORT as the backend.
delete process.env.PORT;

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({

  testDir: './playwright-tests',

  /* Maximum time one test can run for. */
  timeout: 15_000,

  captureGitInfo: { commit: true, diff: true },

  expect: {

    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 5_000
  },

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Run tests serially to avoid concurrent DB mutations interfering with each other */
  workers: 1,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['html'], ['list']],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {

    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,

    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'setup db',
      testMatch: /global\.setup\.js/
    },
    {
      name: 'chromium',

      /* Project-specific settings. */
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  // outputDir: 'test-results/',

  /* Start backend and frontend before running tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
    env: {
      MONGO_URL: ui_mongo_db,
    },
  },
});

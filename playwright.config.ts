import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 45_000,
  expect: { timeout: 8_000 },
  use: {
    baseURL: 'http://127.0.0.1:4173',
    channel: 'chrome',
    locale: 'zh-CN',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173/login',
    reuseExistingServer: true,
    timeout: 120_000,
    env: { ...process.env, VITE_ENABLE_DEMO_MODE: 'true' },
  },
  projects: [
    { name: '桌面大屏', use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } } },
    { name: '标准桌面', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: '移动端', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
})

import { expect, test, type Page } from '@playwright/test'

const routes = ['/login', '/register', '/', '/assets', '/submit', '/reviewing', '/reports', '/report/demo-high-risk', '/monitoring', '/rules', '/admin']
const forbiddenEnglish = ['Secure Access', 'IP Rules', 'Risk Radar', 'Portfolio', 'Live risk', 'Start a review', 'Open reports', 'HIGH', 'MEDIUM', 'LOW']

async function enterDemo(page: Page) {
  await page.goto('/login')
  await page.getByRole('button', { name: '一键进入比赛演示空间' }).click()
  await expect(page.getByText('比赛演示空间').first()).toBeVisible()
}

test.beforeEach(async ({ page }) => { await enterDemo(page) })

for (const route of routes) {
  test(`${route} 页面无溢出、资源错误和残留英文`, async ({ page }, testInfo) => {
    const errors: string[] = []
    const failedAssets: string[] = []
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
    page.on('response', (response) => { if (response.status() >= 400 && /\.(webp|png|jpg|jpeg|svg)(\?|$)/i.test(response.url())) failedAssets.push(`${response.status()} ${response.url()}`) })
    await page.goto(route)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
    expect(overflow).toBe(false)
    const bodyText = await page.locator('body').innerText()
    for (const phrase of forbiddenEnglish) expect(bodyText).not.toContain(phrase)
    expect(errors).toEqual([])
    expect(failedAssets).toEqual([])
    await page.screenshot({ path: testInfo.outputPath(`${route === '/' ? 'home' : route.slice(1).replaceAll('/', '-')}.png`), fullPage: true })
  })
}

test('演示提交、报告和 PDF 只读流程', async ({ page }, testInfo) => {
  await page.goto('/submit')
  await page.getByRole('button', { name: '填入比赛示例' }).click()
  await expect(page.getByRole('button', { name: '提交智能审查' })).toBeEnabled()
  await page.getByRole('button', { name: '提交智能审查' }).click()
  await expect(page.getByText('智能审查流水线')).toBeVisible()
  await expect(page.getByRole('button', { name: '打开审查报告' })).toBeVisible({ timeout: 10_000 })
  await page.getByRole('button', { name: '打开审查报告' }).click()
  await expect(page.getByText('管理层结论')).toBeVisible()
  let pdfRequests = 0
  page.on('request', (request) => { if (request.url().includes('/pdf')) pdfRequests += 1 })
  await page.getByRole('button', { name: '导出 PDF' }).click()
  await expect(page.getByText('演示空间为只读模式')).toBeVisible()
  expect(pdfRequests).toBe(0)
  await page.screenshot({ path: testInfo.outputPath('完整演示流程.png'), fullPage: true })
})

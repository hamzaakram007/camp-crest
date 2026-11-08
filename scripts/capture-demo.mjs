import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const OUT = '/cursor/stores/self/media/camp-crest'
await mkdir(OUT, { recursive: true })

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
})
const page = await context.newPage()

await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.clear())
await page.reload({ waitUntil: 'networkidle' })
await page.waitForSelector('.welcome-shell .brand')
await page.screenshot({ path: `${OUT}/v2-demo-1.png`, fullPage: false })

await page.getByPlaceholder('Scout Sam').fill('Maple')
await page.getByPlaceholder('Pine Hollow').fill('Fern Ridge')
await page.getByRole('button', { name: 'Open my camp' }).click()
await page.waitForSelector('.code-plaque')
await page.getByRole('button', { name: 'Enter campgrounds' }).click()
await page.waitForSelector('.camp-grid')
await page.locator('.palette-item', { hasText: 'Lantern' }).click()
const tiles = page.locator('.tile:not(.has-item)')
await tiles.nth(12).click()
await page.getByRole('button', { name: 'Gather', exact: true }).click()
await page.waitForTimeout(700)
await page.screenshot({ path: `${OUT}/v2-demo-2.png`, fullPage: false })

await browser.close()
console.log('Wrote', `${OUT}/v2-demo-1.png`, `${OUT}/v2-demo-2.png`)

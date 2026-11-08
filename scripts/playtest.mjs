import { chromium } from 'playwright'

const results = []
const ok = (name, pass, detail = '') => {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${name}${detail ? `: ${detail}` : ''}`)
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })

await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.clear())
await page.reload({ waitUntil: 'networkidle' })

ok('Welcome brand visible', await page.locator('.welcome-shell .brand').innerText() === 'Camp Crest')

await page.getByPlaceholder('Scout Sam').fill('Kit')
await page.getByPlaceholder('Pine Hollow').fill('Fern Ridge')
await page.getByRole('button', { name: 'Open my camp' }).click()
await page.waitForSelector('.camp-grid')
ok('Create camp enters map', await page.locator('h1').innerText() === 'Fern Ridge')

const code = await page.locator('.code-pill strong').innerText()
ok('Friend code generated', /^[A-Z]+-\d{4}$/.test(code), code)

await page.locator('.palette-item', { hasText: 'Lantern' }).click()
const before = await page.locator('.tile.has-item').count()
await page.locator('.tile:not(.has-item)').nth(8).click()
const after = await page.locator('.tile.has-item').count()
ok('Place décor', after === before + 1)

await page.getByRole('button', { name: 'Gather', exact: true }).click()
await page.locator('.tile.gatherable').first().click()
const leaf = await page.locator('.badge-pill').nth(0).locator('strong').innerText()
ok('Gather badge', Number(leaf) >= 1, `leaf=${leaf}`)

await page.getByRole('button', { name: 'Show', exact: true }).click()
await page.locator('.tile.has-item').nth(0).click()
await page.locator('.tile.has-item').nth(1).click()
await page.getByRole('button', { name: /Run evening show/ }).click()
await page.waitForSelector('.show-shell')
ok('Show starts', await page.locator('.show-shell').count() === 1)
await page.getByRole('button', { name: 'Skip to camp' }).click()
await page.waitForSelector('.camp-grid')
ok('Return from show', await page.locator('.camp-grid').count() === 1)

await page.locator('.code-pill').click()
await page.waitForSelector('.code-plaque')
ok('Invite screen code', (await page.locator('.code-plaque strong').innerText()) === code)
await page.getByRole('button', { name: 'Simulate friend join' }).click()
const chips = await page.locator('.camper-chip').count()
ok('Simulate friend join', chips >= 2, `campers=${chips}`)

await page.getByRole('button', { name: 'Back to camp' }).click()
await page.getByRole('button', { name: 'New camp' }).click()
await page.waitForSelector('.welcome-shell')
await page.getByRole('tab', { name: 'Join with code' }).click()
await page.getByPlaceholder('Scout Sam').fill('Pal')
await page.getByPlaceholder('CREST-DEMO').fill('CREST-DEMO')
await page.getByRole('button', { name: /Join friends/ }).click()
await page.waitForSelector('.camp-grid')
ok('Join sample code', (await page.locator('h1').innerText()).includes('Crest Demo'))

await browser.close()
const failed = results.filter((r) => !r.pass)
console.log(JSON.stringify({ passed: results.length - failed.length, failed: failed.length, results }, null, 2))
if (failed.length) process.exit(1)

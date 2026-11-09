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

ok('Welcome brand visible', (await page.locator('.welcome-shell .brand').innerText()) === 'Camp Crest')

await page.getByPlaceholder('Scout Sam').fill('Kit')
await page.getByPlaceholder('Pine Hollow').fill('Fern Ridge')
await page.getByRole('button', { name: 'Open my camp' }).click()
await page.waitForSelector('.code-plaque')
const code = await page.locator('.code-plaque strong').innerText()
ok('Created screen shows friend code', /^[A-Z]+-\d{4}$/.test(code), code)

await page.getByRole('button', { name: 'Copy friend code' }).click()
await page.getByRole('button', { name: 'Enter campgrounds' }).click()
await page.waitForSelector('.camp-grid')
ok('Enter campgrounds', (await page.locator('h1').innerText()) === 'Fern Ridge')

const shareUrl = await page.evaluate(() => {
  const raw = localStorage.getItem('camp-crest-v2')
  if (!raw) return null
  const camp = JSON.parse(raw)
  const pack = {
    v: 2,
    code: camp.friendCode,
    name: camp.campName,
    host: camp.camperName,
    placed: camp.placed.map((p) => [p.itemId, p.x, p.y]),
    unlocked: camp.unlocked,
  }
  const json = JSON.stringify(pack)
  const b64 = btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${location.origin}/?join=${camp.friendCode}&pack=${b64}`
})
ok('Share URL built', Boolean(shareUrl && shareUrl.includes('pack=')), shareUrl?.slice(0, 80))

await page.locator('.zone-filters button', { hasText: 'Cabin' }).click()
await page.locator('.palette-item', { hasText: 'Lantern' }).click()
const before = await page.locator('.tile.has-item').count()
await page.locator('.tile:not(.has-item)').nth(8).click()
const after = await page.locator('.tile.has-item').count()
ok('Place décor', after === before + 1)

await page.getByRole('button', { name: 'Gather', exact: true }).click()
const badgeBefore = await page.locator('.badge-pill strong').allTextContents()
await page.locator('.tile.gatherable').first().click()
const badgeAfter = await page.locator('.badge-pill strong').allTextContents()
const gathered = badgeAfter.some((v, i) => Number(v) > Number(badgeBefore[i] ?? 0))
ok('Gather badge', gathered, `before=${badgeBefore.join(',')} after=${badgeAfter.join(',')}`)

await page.getByRole('button', { name: 'Show', exact: true }).click()
// Prefer known showy seed props (campfire / lantern we placed)
const showTiles = page.locator('.tile.has-item')
const showCount = await showTiles.count()
let picked = 0
for (let i = 0; i < showCount && picked < 2; i++) {
  const label = await showTiles.nth(i).getAttribute('aria-label')
  if (label && /Campfire|Lantern|Camp Flag|Log Bench/.test(label)) {
    await showTiles.nth(i).click()
    picked++
  }
}
ok('Picked show props', picked >= 2, `picked=${picked}`)
await page.getByRole('button', { name: /Run evening show/ }).click()
await page.waitForSelector('.show-shell')
ok('Show starts', (await page.locator('.show-shell').count()) === 1)
ok('Applause meter', (await page.locator('.applause-meter').count()) === 1)
await page.getByRole('button', { name: 'Skip to camp' }).click()
await page.waitForSelector('.camp-grid')
ok('Return from show', (await page.locator('.camp-grid').count()) === 1)

await page.locator('.code-pill').click()
await page.waitForSelector('.code-plaque')
ok('Invite screen code', (await page.locator('.code-plaque strong').innerText()) === code)
await page.getByRole('button', { name: 'Simulate friend join' }).click()
const chips = await page.locator('.camper-chip').count()
ok('Simulate friend join', chips >= 2, `campers=${chips}`)

await page.getByRole('button', { name: 'Back to camp' }).click()
await page.getByRole('button', { name: 'New camp' }).click()
await page.waitForSelector('.welcome-shell')

// Cross-browser-style join via pack URL
await page.goto(shareUrl, { waitUntil: 'networkidle' })
await page.waitForSelector('.welcome-shell')
ok('Join tab from share URL', await page.getByRole('tab', { name: 'Join with code' }).getAttribute('aria-selected') === 'true')
await page.getByPlaceholder('Scout Sam').fill('Pal')
await page.getByRole('button', { name: /Join friends/ }).click()
await page.waitForSelector('.camp-grid')
ok('Join via share pack', (await page.locator('h1').innerText()) === 'Fern Ridge')

await page.getByRole('button', { name: 'New camp' }).click()
await page.waitForSelector('.welcome-shell')
await page.getByRole('tab', { name: 'Join with code' }).click()
await page.getByPlaceholder('Scout Sam').fill('Demo')
await page.getByPlaceholder('CREST-DEMO').fill('CREST-DEMO')
await page.getByRole('button', { name: /Join friends/ }).click()
await page.waitForSelector('.camp-grid')
ok('Join sample code', (await page.locator('h1').innerText()).includes('Crest Demo'))

await browser.close()
const failed = results.filter((r) => !r.pass)
console.log(JSON.stringify({ passed: results.length - failed.length, failed: failed.length, results }, null, 2))
if (failed.length) process.exit(1)

// TWIN Click Proof — Detail-Panel öffnet auch bei Klick auf TWIN
import { chromium } from 'playwright'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const OUT = '/Users/law/Desktop/MONEYLAN/command-center/screenshots'
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1200 }, deviceScaleFactor: 2 })
await ctx.addInitScript(() => { try { sessionStorage.setItem('cc_auth_v1', '1') } catch {} })
const page = await ctx.newPage()

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await page.waitForTimeout(2500)
await page.evaluate(() => document.querySelector('svg[viewBox*="1200"]')?.scrollIntoView({ block: 'center' }))
await page.waitForTimeout(800)

const bbox = await page.evaluate(() => document.querySelector('svg[viewBox*="1200"]')?.getBoundingClientRect())
if (!bbox) { console.log('no svg'); process.exit(1) }

// TWIN is at center: svg (600, 350)
const cx = bbox.x + (600 / 1200) * bbox.width
const cy = bbox.y + (350 / 700) * bbox.height
console.log('Click TWIN at', cx.toFixed(0), cy.toFixed(0))
await page.mouse.click(cx, cy)
await page.waitForTimeout(1800)
await page.screenshot({ path: join(OUT, 'twin-detail-panel.png') })
console.log('✓ twin-detail-panel.png')

await browser.close()

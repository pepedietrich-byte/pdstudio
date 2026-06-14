// ─── App-Feel Proof — Click, Focus-Indicator, Help, Hover ───────────────
import { chromium } from 'playwright'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const OUT = '/Users/law/Desktop/MONEYLAN/command-center/screenshots'
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 1200 },
  deviceScaleFactor: 2,
})
await ctx.addInitScript(() => {
  try { sessionStorage.setItem('cc_auth_v1', '1') } catch { /* noop */ }
})
const page = await ctx.newPage()

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 20000 })
await page.waitForTimeout(2500)
await page.evaluate(() => {
  const svg = document.querySelector('svg[viewBox*="1200"]')
  if (svg) svg.scrollIntoView({ behavior: 'instant', block: 'center' })
})
await page.waitForTimeout(800)

// 1. Overview
await page.screenshot({ path: join(OUT, 'app-1-overview.png') })
console.log('✓ 1 overview')

// 2. Hover über A1 → Quick-Info Tooltip
const bbox = await page.evaluate(() => {
  const svg = document.querySelector('svg[viewBox*="1200"]')
  return svg ? svg.getBoundingClientRect() : null
})
if (bbox) {
  const a1x = bbox.x + (824 / 1200) * bbox.width
  const a1y = bbox.y + (238 / 700) * bbox.height
  await page.mouse.move(a1x, a1y)
  await page.waitForTimeout(700)
  await page.screenshot({ path: join(OUT, 'app-2-hover-quickinfo.png') })
  console.log('✓ 2 hover quickinfo')

  // 3. Click A1 — Focus mit Pulse + Connection-Line
  await page.mouse.click(a1x, a1y)
  await page.waitForTimeout(1800)
  await page.screenshot({ path: join(OUT, 'app-3-focused-with-connection.png') })
  console.log('✓ 3 focused')

  // 4. Show help overlay (press ?)
  await page.evaluate(() => document.body.focus())
  await page.keyboard.press('Shift+Slash') // = ? on US layout
  await page.waitForTimeout(700)
  await page.screenshot({ path: join(OUT, 'app-4-help.png') })
  console.log('✓ 4 help')

  // 5. Press 4 — direkter Switch zu A4
  await page.keyboard.press('Shift+Slash') // close help
  await page.waitForTimeout(400)
  await page.evaluate(() => document.body.focus())
  await page.keyboard.press('Digit4')
  await page.waitForTimeout(1800)
  await page.screenshot({ path: join(OUT, 'app-5-keyboard-jump.png') })
  console.log('✓ 5 keyboard jump A4')

  // 6. Click outside (background) → reset
  await page.mouse.click(bbox.x + 50, bbox.y + 50)
  await page.waitForTimeout(1500)
  await page.screenshot({ path: join(OUT, 'app-6-clickout-reset.png') })
  console.log('✓ 6 clickout reset')
}

await browser.close()
console.log('done')

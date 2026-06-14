// ─── Zoom Proof — verschiedene Agenten ──────────────────────────────────────
// Macht Screenshots vor + nach Zoom auf jeden der 6 Agenten.
// Klickt programmatisch auf die echten <g cursor:pointer> SVG-Elemente.

import { chromium } from 'playwright'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const OUT = '/Users/law/Desktop/MONEYLAN/command-center/screenshots'
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 1200 },  // taller to keep agentcity in view
  deviceScaleFactor: 2,
})
await ctx.addInitScript(() => {
  try { sessionStorage.setItem('cc_auth_v1', '1') } catch { /* noop */ }
})
const page = await ctx.newPage()

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 20000 })
await page.waitForTimeout(2500)

// Scroll AgentCity into view (bottom area)
await page.evaluate(() => {
  const svg = document.querySelector('svg[viewBox*="1200"]')
  if (svg) svg.scrollIntoView({ behavior: 'instant', block: 'center' })
})
await page.waitForTimeout(800)
await page.screenshot({ path: join(OUT, 'zoom-1-overview.png'), fullPage: false })
console.log('✓ overview')

// Click via direct SVG g element (alle stations sind <g cursor:pointer>)
const agentClicks = [
  { name: 'A1-top', svgX: 824, svgY: 238 },     // hexPos(0)
  { name: 'A2-rt',  svgX: 824, svgY: 462 },     // hexPos(1)
  { name: 'A4-bot', svgX: 376, svgY: 462 },     // hexPos(3) — bottom
]

for (const click of agentClicks) {
  await page.keyboard.press('Escape')
  await page.waitForTimeout(1200)

  const bbox = await page.evaluate(() => {
    const svg = document.querySelector('svg[viewBox*="1200"]')
    return svg ? svg.getBoundingClientRect() : null
  })
  if (!bbox) { console.log('no svg'); continue }

  const cx = bbox.x + (click.svgX / 1200) * bbox.width
  const cy = bbox.y + (click.svgY / 700) * bbox.height
  console.log(`click ${click.name} at viewport (${cx.toFixed(0)}, ${cy.toFixed(0)}) svgBox ${bbox.x.toFixed(0)},${bbox.y.toFixed(0)} ${bbox.width.toFixed(0)}x${bbox.height.toFixed(0)}`)
  if (cy > 1200 || cy < 0) { console.log('  → outside viewport, skipping'); continue }
  await page.mouse.click(cx, cy)
  await page.waitForTimeout(1800)
  await page.screenshot({ path: join(OUT, `zoom-2-${click.name}.png`), fullPage: false })
  console.log(`✓ ${click.name}`)
}

await browser.close()
console.log('done')

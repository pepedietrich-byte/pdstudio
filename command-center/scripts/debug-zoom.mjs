import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1200 }, deviceScaleFactor: 2 })
await ctx.addInitScript(() => { try { sessionStorage.setItem('cc_auth_v1', '1') } catch {} })
const page = await ctx.newPage()
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await page.waitForTimeout(2500)
await page.evaluate(() => document.querySelector('svg[viewBox*="1200"]')?.scrollIntoView({ block: 'center' }))
await page.waitForTimeout(800)

// Check SVG bounds before click
const before = await page.evaluate(() => {
  const svg = document.querySelector('svg[viewBox*="1200"]')
  const groups = svg ? Array.from(svg.querySelectorAll('g')) : []
  return {
    svgBox: svg?.getBoundingClientRect(),
    cameraGroupCount: groups.length,
    transforms: groups.slice(0, 5).map(g => g.getAttribute('transform') || g.style.transform),
  }
})
console.log('Before click:', JSON.stringify(before, null, 2))

// Click A1
const sx = before.svgBox.x + (824 / 1200) * before.svgBox.width
const sy = before.svgBox.y + (238 / 700) * before.svgBox.height
console.log('Clicking at', sx, sy)
await page.mouse.click(sx, sy)
await page.waitForTimeout(1800)

const after = await page.evaluate(() => {
  const svg = document.querySelector('svg[viewBox*="1200"]')
  const groups = svg ? Array.from(svg.querySelectorAll('g')) : []
  return {
    svgBox: svg?.getBoundingClientRect(),
    transforms: groups.slice(0, 5).map(g => ({
      tr: g.getAttribute('transform'),
      st: g.style.transform,
    })),
  }
})
console.log('After click:', JSON.stringify(after, null, 2))

await browser.close()

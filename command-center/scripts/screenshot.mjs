// ─── PDSTUDIO Command Center Screenshot Script ─────────────────────────────
// Nimmt Screenshots der laufenden App in Desktop + Mobile Viewport.
//
// Usage:
//   1. npm run dev   (in einem anderen Terminal)
//   2. npx playwright install chromium  (einmalig)
//   3. node scripts/screenshot.mjs
//
// Output: screenshots/{view}-{device}.png
//
// Falls Playwright nicht installiert ist, gibt das Script eine
// klare Anweisung statt zu crashen.

import { existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'screenshots')
const BASE_URL = process.env.SCREENSHOT_URL || 'http://localhost:5173'

const VIEWS = [
  { path: '/', name: 'agentcity' },
  { path: '/leads', name: 'leads' },
  { path: '/sites', name: 'sites' },
]

const DEVICES = [
  { name: 'desktop', viewport: { width: 1440, height: 900 } },
  { name: 'iphone-portrait', viewport: { width: 390, height: 844 } },
  { name: 'iphone-landscape', viewport: { width: 844, height: 390 } },
]

async function loadPlaywright() {
  try {
    const pw = await import('playwright')
    return pw
  } catch {
    console.log(`
╭─────────────────────────────────────────────────────────────╮
│  Playwright nicht installiert.                              │
│                                                             │
│  Installation:                                              │
│    cd command-center                                        │
│    npm install --save-dev playwright                        │
│    npx playwright install chromium                          │
│                                                             │
│  Danach:                                                    │
│    node scripts/screenshot.mjs                              │
╰─────────────────────────────────────────────────────────────╯
`)
    return null
  }
}

async function main() {
  const pw = await loadPlaywright()
  if (!pw) process.exit(1)

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })

  console.log(`📷 Base URL: ${BASE_URL}`)
  console.log(`📁 Output:   ${OUT_DIR}`)
  console.log('')

  const browser = await pw.chromium.launch({ headless: true })
  try {
    for (const device of DEVICES) {
      const context = await browser.newContext({
        viewport: device.viewport,
        deviceScaleFactor: 2,
      })
      const page = await context.newPage()
      // Auth-Bypass: setze sessionStorage Schlüssel den PasswordGate erwartet
      await page.addInitScript(() => {
        try { sessionStorage.setItem('cc_auth_v1', '1') } catch { /* noop */ }
      })

      for (const view of VIEWS) {
        const url = `${BASE_URL}${view.path}`
        const file = join(OUT_DIR, `${view.name}-${device.name}.png`)
        try {
          await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 })
          // Wait extra second for framer-motion animations to settle
          await page.waitForTimeout(1500)
          await page.screenshot({ path: file, fullPage: false })
          console.log(`  ✓ ${view.name} @ ${device.name}`)
        } catch (e) {
          console.log(`  ✗ ${view.name} @ ${device.name}: ${e.message}`)
        }
      }
      await context.close()
    }
  } finally {
    await browser.close()
  }

  console.log('')
  console.log(`✓ Screenshots in ${OUT_DIR}`)
}

main().catch(e => {
  console.error('Screenshot script failed:', e)
  process.exit(1)
})

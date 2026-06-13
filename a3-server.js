#!/usr/bin/env node
// A3 Polish Server — lokaler Server für Site-Updates und Vercel-Deploy
// Läuft auf http://localhost:3033
// Start: node a3-server.js
//
// POST /polish — images injizieren, build, deploy
// POST /status  — letzter Job-Status
// GET  /health  — Server läuft?

import http from 'http'
import { execSync, spawn } from 'child_process'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, resolve } from 'path'

const PORT = 3033
let lastJob = null

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function json(res, code, body) {
  cors(res)
  res.writeHead(code, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => data += chunk)
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')) }
      catch { resolve({}) }
    })
    req.on('error', reject)
  })
}

function run(cmd, cwd) {
  console.log(`[A3] $ ${cmd}`)
  return execSync(cmd, { cwd, encoding: 'utf-8', stdio: 'pipe' })
}

function extractVercelUrl(output) {
  const lines = output.split('\n')
  // Look for the aliased production URL
  for (const line of lines) {
    const m = line.match(/https:\/\/[a-z0-9-]+\.vercel\.app/)
    if (m) return m[0]
  }
  return null
}

// Inject images into App.jsx — replaces IMG object or individual URL strings
function injectImages(appPath, images) {
  let content = readFileSync(appPath, 'utf-8')
  const original = content

  // Strategy 1: Replace the IMG const object entirely if it exists
  const imgObjMatch = content.match(/const IMG\s*=\s*\{[^}]+\}/)
  if (imgObjMatch) {
    const imageMap = {}
    for (const { slot, url } of images) {
      imageMap[slot] = url
    }
    // Build new IMG object preserving existing slots
    const existingSlots = imgObjMatch[0].match(/(\w+):\s*['"][^'"]+['"]/g) || []
    const slotMap = {}
    for (const s of existingSlots) {
      const [k, v] = s.split(/:\s*/)
      slotMap[k.trim()] = v?.trim().replace(/['"]/g, '') || ''
    }
    // Overlay new images
    for (const { slot, url } of images) {
      if (slotMap[slot] !== undefined) slotMap[slot] = url
      // map generic slot names to existing keys
      if (slot === 'hero' && slotMap.hero) slotMap.hero = url
      if (slot === 'food1' && slotMap.food1) slotMap.food1 = url
      if (slot === 'food2' && slotMap.food2) slotMap.food2 = url
      if (slot === 'food3' && slotMap.food3) slotMap.food3 = url
      if (slot === 'ambiance' && slotMap.interior) slotMap.interior = url
      if (slot === 'spices' && slotMap.spices) slotMap.spices = url
    }
    const newImgObj = `const IMG = {\n${Object.entries(slotMap).map(([k, v]) => `  ${k}: '${v}'`).join(',\n')}\n}`
    content = content.replace(imgObjMatch[0], newImgObj)
  } else {
    // Strategy 2: Replace individual Unsplash URLs with slot-matched new URLs
    for (const { slot, url } of images) {
      // Replace first matching unsplash URL pattern
      content = content.replace(
        /https:\/\/images\.unsplash\.com\/[^'"]+/,
        url
      )
    }
  }

  if (content !== original) {
    writeFileSync(appPath, content, 'utf-8')
    console.log('[A3] App.jsx updated with new images')
    return true
  }
  console.log('[A3] No image replacements made — check IMG object structure')
  return false
}

async function runPolish(body) {
  const { site_dir, images, lead_name, demo_url } = body

  if (!site_dir) return { error: 'site_dir ist erforderlich' }

  const dir = resolve(site_dir)
  if (!existsSync(dir)) return { error: `Verzeichnis nicht gefunden: ${dir}` }

  const appPaths = [
    join(dir, 'src/App.jsx'),
    join(dir, 'src/app.jsx'),
    join(dir, 'src/index.jsx'),
  ]
  const appPath = appPaths.find(p => existsSync(p))
  if (!appPath) return { error: 'src/App.jsx nicht gefunden in: ' + dir }

  const log = []

  // 1. Inject images
  if (images && images.length > 0) {
    const updated = injectImages(appPath, images)
    log.push(updated ? `✓ ${images.length} Bilder injiziert` : '⚠ Bilder-Injektion: keine Änderungen (IMG-Objekt-Struktur prüfen)')
  } else {
    log.push('ℹ Keine Bilder übergeben — nur Build + Deploy')
  }

  // 2. Build
  try {
    const buildOut = run('npm run build', dir)
    log.push('✓ npm run build erfolgreich')
  } catch (e) {
    return { error: 'Build fehlgeschlagen: ' + e.message, log }
  }

  // 3. Deploy
  let deployUrl = null
  try {
    const deployOut = run('npx vercel --prod --yes 2>&1', dir)
    deployUrl = extractVercelUrl(deployOut)
    log.push('✓ Vercel Deploy: ' + (deployUrl || 'URL nicht geparst'))
  } catch (e) {
    return { error: 'Deploy fehlgeschlagen: ' + e.message, log }
  }

  return {
    success: true,
    url: deployUrl || demo_url,
    log,
    lead_name,
    site_dir: dir,
  }
}

const server = http.createServer(async (req, res) => {
  cors(res)

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204); res.end(); return
  }

  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    return json(res, 200, { status: 'ok', port: PORT, server: 'A3 Polish Server' })
  }

  // Last job status
  if (req.method === 'GET' && req.url === '/status') {
    return json(res, 200, lastJob || { status: 'idle' })
  }

  // Polish endpoint
  if (req.method === 'POST' && req.url === '/polish') {
    const body = await readBody(req)
    console.log('[A3] Polish job received:', body.lead_name, body.site_dir)

    lastJob = { status: 'running', started: new Date().toISOString(), lead_name: body.lead_name }

    try {
      const result = await runPolish(body)
      lastJob = { ...result, status: result.error ? 'error' : 'done', finished: new Date().toISOString() }
      return json(res, result.error ? 500 : 200, lastJob)
    } catch (e) {
      lastJob = { status: 'error', error: e.message }
      return json(res, 500, lastJob)
    }
  }

  json(res, 404, { error: 'Route nicht gefunden' })
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n🎨 A3 Polish Server läuft auf http://localhost:${PORT}`)
  console.log('   GET  /health  — Status prüfen')
  console.log('   POST /polish  — Site updaten + deployen')
  console.log('   GET  /status  — Letzter Job\n')
})

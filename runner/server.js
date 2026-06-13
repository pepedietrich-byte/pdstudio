import 'dotenv/config'
import express from 'express'
import { randomUUID } from 'crypto'
import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync } from 'fs'
import { createWriteStream } from 'fs'
import { spawn } from 'child_process'
import { join, resolve, normalize } from 'path'

// ─── Config ────────────────────────────────────────────────────────────────

const RUNNER_SECRET  = process.env.RUNNER_SECRET
const PORT           = parseInt(process.env.PORT || '8787')
const REPO_PATH      = process.env.REPO_PATH   || '/var/www/pdstudio'
const RUNNER_PATH    = process.env.RUNNER_PATH  || '/opt/pdstudio-runner'
const RUN_TIMEOUT_MS = parseInt(process.env.RUN_TIMEOUT_MS || '300000')
const MAX_PROMPT_BYTES = 50 * 1024  // 50 KB

const VALID_MODES = ['build', 'analyze', 'fix', 'deploy']

// ─── Startup checks ─────────────────────────────────────────────────────────

if (!RUNNER_SECRET) {
  console.error('[FATAL] RUNNER_SECRET is not set. Set it in .env and restart.')
  process.exit(1)
}

for (const dir of ['logs', 'runs', 'tmp']) {
  mkdirSync(join(RUNNER_PATH, dir), { recursive: true })
}

// ─── State ───────────────────────────────────────────────────────────────────

let activeRun = null  // { runId, startedAt, mode } — only one non-analyze run at a time

// ─── App ────────────────────────────────────────────────────────────────────

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '100kb' }))

// ─── Auth middleware ─────────────────────────────────────────────────────────

function requireAuth(req, res, next) {
  const auth = req.headers.authorization || ''
  if (!auth.startsWith('Bearer ') || auth.slice(7) !== RUNNER_SECRET) {
    console.warn(`[AUTH] Rejected ${req.method} ${req.path} from ${req.ip}`)
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readSummary(runId) {
  const p = join(RUNNER_PATH, 'runs', `${runId}.json`)
  if (!existsSync(p)) return null
  try { return JSON.parse(readFileSync(p, 'utf8')) } catch { return null }
}

function readLogTail(runId, lines = 60) {
  const p = join(RUNNER_PATH, 'logs', `${runId}.log`)
  if (!existsSync(p)) return ''
  try {
    const content = readFileSync(p, 'utf8')
    const all = content.split('\n')
    return all.slice(-lines).join('\n').trim()
  } catch { return '' }
}

// Ensure site_dir stays inside REPO_PATH (prevent path traversal)
function safeSiteDir(siteDir) {
  if (!siteDir) return null
  const abs = resolve(REPO_PATH, siteDir)
  const safe = normalize(abs)
  if (!safe.startsWith(resolve(REPO_PATH))) {
    throw new Error(`site_dir "${siteDir}" escapes REPO_PATH`)
  }
  return siteDir.replace(/^\/+/, '')  // strip leading slash, return relative
}

function spawnRunner(runId, scriptEnv) {
  return new Promise((resolve) => {
    const scriptPath = join(RUNNER_PATH, 'runner.sh')
    const logPath    = join(RUNNER_PATH, 'logs', `${runId}.log`)
    const logStream  = createWriteStream(logPath, { flags: 'a' })

    const proc = spawn('bash', [scriptPath], {
      env: { ...process.env, ...scriptEnv },
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    })

    proc.stdout.pipe(logStream)
    proc.stderr.pipe(logStream)

    let settled = false

    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      proc.kill('SIGTERM')
      resolve({ timedOut: true, code: null })
    }, RUN_TIMEOUT_MS)

    proc.on('close', (code) => {
      clearTimeout(timer)
      if (settled) return
      settled = true
      logStream.end()
      resolve({ timedOut: false, code })
    })

    proc.on('error', (err) => {
      clearTimeout(timer)
      if (settled) return
      settled = true
      logStream.end()
      resolve({ timedOut: false, code: -1, spawnError: err.message })
    })
  })
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// Health — no auth required (internal use only, firewall handles exposure)
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime_seconds: Math.floor(process.uptime()),
    active_run: activeRun,
    runner_path: RUNNER_PATH,
    repo_path: REPO_PATH,
  })
})

// Poll status of a specific run
app.get('/run-a2/:runId/status', requireAuth, (req, res) => {
  const { runId } = req.params
  const summary = readSummary(runId)
  const logTail = readLogTail(runId)

  // If a summary file exists, the run has finished (success or failure)
  if (summary) {
    return res.json({ ...summary, log_tail: logTail })
  }

  // No summary yet — check if there's a log file or it's actively running
  const hasLog = !!logTail
  const isActive = activeRun?.runId === runId

  if (isActive || hasLog) {
    return res.json({
      run_id:   runId,
      status:   'running',
      mode:     isActive ? activeRun.mode : 'unknown',
      started_at: isActive ? activeRun.startedAt : null,
      log_tail: logTail,
      message:  'Run still in progress. Keep polling.',
    })
  }

  // No log, no summary, not active → never existed
  return res.status(404).json({ error: 'Run not found', run_id: runId })
})

// Main run endpoint
app.post('/run-a2', requireAuth, async (req, res) => {
  const {
    prompt   = '',
    mode     = 'build',
    run_id   = null,
    branch   = process.env.GITHUB_BRANCH || 'main',
    metadata = {},
  } = req.body

  // ── Validate mode
  if (!VALID_MODES.includes(mode)) {
    return res.status(400).json({
      error: `Invalid mode "${mode}". Allowed: ${VALID_MODES.join(', ')}`,
    })
  }

  // ── Validate prompt for modes that need it
  if (['build', 'fix'].includes(mode)) {
    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'prompt is required for build/fix mode' })
    }
    if (Buffer.byteLength(prompt, 'utf8') > MAX_PROMPT_BYTES) {
      return res.status(400).json({ error: `Prompt exceeds ${MAX_PROMPT_BYTES / 1024}KB limit` })
    }
  }

  // ── Validate site_dir
  let siteDir = null
  if (metadata.site_dir) {
    try { siteDir = safeSiteDir(metadata.site_dir) }
    catch (err) {
      return res.status(400).json({ error: err.message })
    }
  }

  // ── Concurrency lock (analyze is read-only, always allowed)
  if (mode !== 'analyze' && activeRun) {
    return res.status(409).json({
      error: 'Another run is in progress',
      status: 'busy',
      active_run_id: activeRun.runId,
      active_run_started: activeRun.startedAt,
    })
  }

  // ── Generate run_id
  const runId = run_id || randomUUID().replace(/-/g, '').slice(0, 12)

  // ── Write prompt to temp file (avoids arg-length limits for large prompts)
  const promptFile = join(RUNNER_PATH, 'tmp', `${runId}.md`)
  writeFileSync(promptFile, prompt || '', 'utf8')

  // ── Async mode: respond immediately, run in background
  //    Triggered via ?async=1 query param OR { async: true } in body
  const isAsync = req.query.async === '1' || req.query.async === 'true' || req.body.async === true

  // ── Set active lock
  if (mode !== 'analyze') {
    activeRun = { runId, startedAt: new Date().toISOString(), mode }
  }

  // ── Build ENV for runner.sh
  const scriptEnv = {
    RUN_ID:      runId,
    MODE:        mode,
    BRANCH:      branch,
    SITE_DIR:    siteDir || '',
    PROMPT_FILE: promptFile,
    REPO_PATH:   REPO_PATH,
    RUNNER_PATH: RUNNER_PATH,
    LEAD_NAME:   metadata.lead_name    || '',
    SITE_TYPE:   metadata.site_type    || 'restaurant',
    REQUIRES_DEPLOY: metadata.requires_deploy ? '1' : '0',
    VERCEL_TOKEN: process.env.VERCEL_TOKEN || '',
    GITHUB_BRANCH: branch,
    GITHUB_REPO:   process.env.GITHUB_REPO || '',
    GITHUB_PUSH_METHOD: process.env.GITHUB_PUSH_METHOD || 'ssh',
    GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
    HOME: process.env.HOME || '/root',
    PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin',
  }

  console.log(`[RUN] ${runId} mode=${mode} site=${siteDir || 'auto'} branch=${branch} async=${isAsync}`)

  // ── ASYNC MODE: respond immediately, run in background
  if (isAsync) {
    res.status(202).json({
      run_id:        runId,
      status:        'started',
      mode:          mode,
      site_dir:      siteDir,
      lead_name:     metadata.lead_name || '',
      started_at:    new Date().toISOString(),
      poll_url:      `/run-a2/${runId}/status`,
      message:       'Run started in background. Poll status endpoint for progress.',
    })

    // Fire and forget — clean up state when done
    spawnRunner(runId, scriptEnv).then(() => {
      if (mode !== 'analyze') activeRun = null
      try { unlinkSync(promptFile) } catch {}
      console.log(`[RUN] ${runId} completed (async)`)
    }).catch(err => {
      if (mode !== 'analyze') activeRun = null
      try { unlinkSync(promptFile) } catch {}
      console.error(`[RUN] ${runId} async spawn error:`, err)
    })
    return
  }

  // ── SYNC MODE (legacy): spawn runner and wait
  const { timedOut, code, spawnError } = await spawnRunner(runId, scriptEnv)

  // ── Release lock
  if (mode !== 'analyze') activeRun = null

  // ── Cleanup temp file
  try { unlinkSync(promptFile) } catch {}

  // ── Read result
  const summary = readSummary(runId)
  const logTail = readLogTail(runId)

  if (timedOut) {
    return res.status(200).json({
      status: 'timeout',
      run_id: runId,
      message: `Run exceeded ${RUN_TIMEOUT_MS / 1000}s timeout. Check status endpoint.`,
      log_tail: logTail,
    })
  }

  if (spawnError) {
    return res.status(500).json({
      status: 'failed',
      run_id: runId,
      error: `Failed to spawn runner.sh: ${spawnError}`,
      log_tail: logTail,
    })
  }

  if (!summary) {
    return res.status(500).json({
      status: 'failed',
      run_id: runId,
      error: 'Runner did not produce a summary. Check logs.',
      exit_code: code,
      log_tail: logTail,
    })
  }

  return res.status(code === 0 ? 200 : 500).json({
    ...summary,
    log_tail: logTail,
  })
})

// ─── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[PDSTUDIO Runner] Listening on port ${PORT}`)
  console.log(`[PDSTUDIO Runner] Repo: ${REPO_PATH}`)
  console.log(`[PDSTUDIO Runner] Runner: ${RUNNER_PATH}`)
})

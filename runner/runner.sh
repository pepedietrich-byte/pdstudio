#!/usr/bin/env bash
# PDSTUDIO Runner — Build Pipeline
# Wird von server.js gestartet. Alle Variablen kommen aus ENV.

set -euo pipefail

# ─── ENV ─────────────────────────────────────────────────────────────────────

RUN_ID="${RUN_ID:?RUN_ID not set}"
MODE="${MODE:-build}"
BRANCH="${BRANCH:-main}"
SITE_DIR="${SITE_DIR:-}"
PROMPT_FILE="${PROMPT_FILE:-}"
REPO_PATH="${REPO_PATH:-/var/www/pdstudio}"
RUNNER_PATH="${RUNNER_PATH:-/opt/pdstudio-runner}"
LEAD_NAME="${LEAD_NAME:-}"
REQUIRES_DEPLOY="${REQUIRES_DEPLOY:-0}"
VERCEL_TOKEN="${VERCEL_TOKEN:-}"
GITHUB_PUSH_METHOD="${GITHUB_PUSH_METHOD:-ssh}"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"
GITHUB_REPO="${GITHUB_REPO:-}"

LOG_FILE="${RUNNER_PATH}/logs/${RUN_ID}.log"
SUMMARY_FILE="${RUNNER_PATH}/runs/${RUN_ID}.json"

# ─── Logging ─────────────────────────────────────────────────────────────────

mkdir -p "${RUNNER_PATH}/logs" "${RUNNER_PATH}/runs"
# server.js pipes our stdout/stderr to the log file via spawn
# Do NOT also tee to the log file here — that causes double entries
# Log functions write to stdout only (server.js captures it)

ts() { date -u '+%Y-%m-%dT%H:%M:%SZ'; }
log()  { echo "[$(ts)] $*"; }
logok(){ echo "[$(ts)] ✓ $*"; }
logfail(){ echo "[$(ts)] ✗ $*"; }

START_TS=$(ts)
STARTED_EPOCH=$(date +%s)

log "━━━ PDSTUDIO Runner ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "run_id:  ${RUN_ID}"
log "mode:    ${MODE}"
log "branch:  ${BRANCH}"
log "site:    ${SITE_DIR:-auto-detect}"
log "lead:    ${LEAD_NAME:-unset}"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ─── Summary writer ───────────────────────────────────────────────────────────

BUILD_STATUS="skipped"
DEPLOY_STATUS="skipped"
DEPLOY_URL=""
VERCEL_PROJECT=""
CHANGED_FILES="[]"
ERROR_MSG=""

write_summary() {
  local status="$1"
  local end_epoch; end_epoch=$(date +%s)
  local duration=$(( end_epoch - STARTED_EPOCH ))

  # Mask secrets from any field values
  local safe_error; safe_error="${ERROR_MSG//$VERCEL_TOKEN/[MASKED]}"
  safe_error="${safe_error//$RUNNER_SECRET/[MASKED]}"

  cat > "$SUMMARY_FILE" <<EOF
{
  "run_id":           "${RUN_ID}",
  "status":           "${status}",
  "mode":             "${MODE}",
  "branch":           "${BRANCH}",
  "site_dir":         "${SITE_DIR}",
  "lead_name":        "${LEAD_NAME}",
  "started_at":       "${START_TS}",
  "completed_at":     "$(ts)",
  "duration_seconds": ${duration},
  "changed_files":    ${CHANGED_FILES},
  "build_status":     "${BUILD_STATUS}",
  "deploy_status":    "${DEPLOY_STATUS}",
  "deploy_url":       "${DEPLOY_URL}",
  "vercel_project":   "${VERCEL_PROJECT}",
  "error":            $([ -z "$safe_error" ] && echo "null" || echo "\"${safe_error}\"")
}
EOF
  log "Summary written → ${SUMMARY_FILE}"
}

fail() {
  ERROR_MSG="$*"
  logfail "$ERROR_MSG"
  write_summary "failed"
  exit 1
}

# ─── ANALYZE MODE ─────────────────────────────────────────────────────────────

if [ "$MODE" = "analyze" ]; then
  log "Running analyze checks..."

  CHECKS=()
  CHECKS_JSON=""
  ALL_OK=true

  check() {
    local name="$1"
    local result="$2"
    # Sanitize detail: first line only, escape backslashes and double-quotes for JSON
    local detail; detail=$(printf '%s' "${3:-}" | head -1 | \
      sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | tr -d '\r\n')
    if [ "$result" = "ok" ]; then
      logok "${name}: ${detail:-ok}"
      CHECKS_JSON="${CHECKS_JSON}{\"check\":\"${name}\",\"status\":\"ok\",\"detail\":\"${detail}\"},"
    else
      logfail "${name}: ${detail}"
      CHECKS_JSON="${CHECKS_JSON}{\"check\":\"${name}\",\"status\":\"fail\",\"detail\":\"${detail}\"},"
      ALL_OK=false
    fi
  }

  # 1. Repo exists
  if [ -d "${REPO_PATH}/.git" ]; then
    check "repo_exists" "ok" "${REPO_PATH}"
  else
    check "repo_exists" "fail" "Not found: ${REPO_PATH}"
  fi

  # 2. git fetch
  if cd "$REPO_PATH" && git fetch origin "$BRANCH" --dry-run 2>&1 | head -1; then
    check "git_fetch" "ok" "origin/${BRANCH} reachable"
  else
    check "git_fetch" "fail" "Cannot reach remote"
  fi

  # 3. Claude Code CLI
  CLAUDE_VER=$(claude --version 2>&1 | head -1 || echo "")
  if echo "$CLAUDE_VER" | grep -q "[0-9]"; then
    check "claude_cli" "ok" "$CLAUDE_VER"
  else
    check "claude_cli" "fail" "Not found or not responding"
  fi

  # 4. npm
  NPM_VER=$(npm --version 2>/dev/null || echo "")
  if [ -n "$NPM_VER" ]; then
    check "npm" "ok" "v${NPM_VER}"
  else
    check "npm" "fail" "npm not found"
  fi

  # 5. Vercel CLI
  VERCEL_VER=$(vercel --version 2>/dev/null || echo "")
  if [ -n "$VERCEL_VER" ]; then
    check "vercel_cli" "ok" "${VERCEL_VER}"
  else
    check "vercel_cli" "fail" "vercel not found — run: npm install -g vercel"
  fi

  # 6. Vercel auth
  if [ -n "$VERCEL_TOKEN" ]; then
    VERCEL_WHOAMI=$(vercel whoami --token "$VERCEL_TOKEN" 2>&1 || echo "")
    if echo "$VERCEL_WHOAMI" | grep -qv "Error"; then
      check "vercel_auth" "ok" "${VERCEL_WHOAMI}"
    else
      check "vercel_auth" "fail" "Token invalid or expired"
    fi
  else
    check "vercel_auth" "fail" "VERCEL_TOKEN not set"
  fi

  # 7. Site-dir Vercel link
  SITE_CHECK_DIR="${SITE_DIR:-sites}"
  SITE_ABS="${REPO_PATH}/${SITE_CHECK_DIR}"
  VERCEL_JSON="${SITE_ABS}/.vercel/project.json"

  if [ -d "$SITE_ABS" ]; then
    check "site_dir_exists" "ok" "${SITE_ABS}"
    if [ -f "$VERCEL_JSON" ]; then
      VP=$(cat "$VERCEL_JSON" | grep '"projectId"' | sed 's/.*: *"\([^"]*\)".*/\1/' || echo "")
      check "vercel_linked" "ok" "projectId=${VP}"
    else
      check "vercel_linked" "fail" "vercel_project_not_linked — run: cd ${SITE_ABS} && vercel link --token \$VERCEL_TOKEN"
    fi
    if [ -f "${SITE_ABS}/package.json" ]; then
      check "site_has_build" "ok" "package.json found"
    else
      check "site_has_build" "ok" "static site (no package.json — no build step needed)"
    fi
  else
    check "site_dir_exists" "fail" "Directory not found: ${SITE_ABS}"
  fi

  # 8. Git push auth
  if [ "$GITHUB_PUSH_METHOD" = "ssh" ]; then
    SSH_TEST=$(ssh -T git@github.com 2>&1 || true)
    if echo "$SSH_TEST" | grep -q "successfully authenticated"; then
      check "github_ssh_auth" "ok" "Authenticated"
    else
      check "github_ssh_auth" "fail" "SSH auth failed — add VPS deploy key to GitHub"
    fi
  else
    check "github_push_method" "ok" "HTTPS with token"
  fi

  CHECKS_JSON="[${CHECKS_JSON%,}]"

  END_EPOCH=$(date +%s)
  DURATION=$(( END_EPOCH - STARTED_EPOCH ))
  OVERALL=$( [ "$ALL_OK" = true ] && echo "success" || echo "warning" )

  cat > "$SUMMARY_FILE" <<EOF
{
  "run_id":           "${RUN_ID}",
  "status":           "${OVERALL}",
  "mode":             "analyze",
  "started_at":       "${START_TS}",
  "completed_at":     "$(ts)",
  "duration_seconds": ${DURATION},
  "checks":           ${CHECKS_JSON},
  "all_ok":           $( [ "$ALL_OK" = true ] && echo "true" || echo "false" )
}
EOF

  log "Analyze complete. Status: ${OVERALL}"
  exit 0
fi

# ─── REPO SYNC ────────────────────────────────────────────────────────────────

log "Syncing repo: ${REPO_PATH} branch=${BRANCH}"

cd "$REPO_PATH" || fail "Cannot cd to ${REPO_PATH}"

# Set HTTPS auth if needed
if [ "$GITHUB_PUSH_METHOD" = "https" ] && [ -n "$GITHUB_TOKEN" ] && [ -n "$GITHUB_REPO" ]; then
  HTTPS_URL="https://${GITHUB_TOKEN}@${GITHUB_REPO#https://}"
  git remote set-url origin "$HTTPS_URL" 2>/dev/null || true
fi

git fetch origin "$BRANCH" 2>&1 | tail -3
git checkout "$BRANCH"   2>&1 | tail -3
git pull --rebase origin "$BRANCH" 2>&1 | tail -5
logok "Repo up to date"

# ─── RESOLVE SITE DIR ─────────────────────────────────────────────────────────

if [ -n "$SITE_DIR" ]; then
  SITE_ABS="${REPO_PATH}/${SITE_DIR}"
  if [ ! -d "$SITE_ABS" ]; then
    fail "site_dir '${SITE_DIR}' does not exist in repo"
  fi
else
  # Auto-detect: look for newest site in sites/
  SITE_ABS=$(find "${REPO_PATH}/sites" -maxdepth 1 -mindepth 1 -type d 2>/dev/null | sort | tail -1 || echo "")
  SITE_DIR=$(basename "$SITE_ABS")
  if [ -z "$SITE_ABS" ]; then
    fail "No site_dir specified and none found in sites/"
  fi
  log "Auto-detected site: ${SITE_DIR}"
fi

log "Working site: ${SITE_ABS}"

# ─── CLAUDE CODE ──────────────────────────────────────────────────────────────

if [ "$MODE" = "build" ] || [ "$MODE" = "fix" ]; then
  if [ -z "$PROMPT_FILE" ] || [ ! -f "$PROMPT_FILE" ]; then
    fail "PROMPT_FILE not found: ${PROMPT_FILE}"
  fi

  PROMPT_SIZE=$(wc -c < "$PROMPT_FILE")
  log "Running Claude Code (prompt: ${PROMPT_SIZE} bytes)"
  log "Working directory: ${REPO_PATH}"

  # Run Claude Code from repo root so it has full file access
  cd "$REPO_PATH"

  # Run headless — permissions set in ~/.claude/settings.json (allow all)
  # < /dev/null prevents 3s stdin wait in non-interactive mode
  if claude -p "$(cat "$PROMPT_FILE")" < /dev/null 2>&1; then
    logok "Claude Code run complete"
  else
    CLAUDE_EXIT=$?
    fail "Claude Code exited with code ${CLAUDE_EXIT}"
  fi
fi

# ─── BUILD ────────────────────────────────────────────────────────────────────

if [ "$MODE" = "deploy" ]; then
  log "Deploy mode: skipping Claude Code, building directly"
fi

HAS_PACKAGE_JSON=false
if [ -f "${SITE_ABS}/package.json" ]; then
  HAS_PACKAGE_JSON=true
fi

if [ "$HAS_PACKAGE_JSON" = true ]; then
  cd "$SITE_ABS"

  # npm install only if node_modules missing or lockfile changed
  NEED_INSTALL=false
  if [ ! -d "node_modules" ]; then
    NEED_INSTALL=true
    log "node_modules missing — running npm install"
  elif git diff HEAD -- package-lock.json 2>/dev/null | grep -q "^[+-]" ; then
    NEED_INSTALL=true
    log "package-lock.json changed — running npm install"
  fi

  if [ "$NEED_INSTALL" = true ]; then
    npm install 2>&1 | tail -5
    logok "npm install done"
  fi

  log "Running npm run build"
  BUILD_LOG=$(npm run build 2>&1)
  BUILD_EXIT=$?
  echo "$BUILD_LOG" | tail -20

  if [ $BUILD_EXIT -ne 0 ]; then
    logfail "Build failed (exit ${BUILD_EXIT})"
    BUILD_STATUS="failed"

    # ── Retry: send error to Claude for fix
    if [ "$MODE" = "build" ] || [ "$MODE" = "fix" ]; then
      log "Attempting auto-fix via Claude Code..."
      FIX_PROMPT="The npm build failed with this error. Please fix the code so the build succeeds.

BUILD ERROR:
${BUILD_LOG}

RULES:
- Only fix the build error. Do not rewrite unrelated code.
- The site directory is: ${SITE_ABS}
- Do not touch files outside this directory.
- After fixing, the build command 'npm run build' must succeed."

      cd "$REPO_PATH"
      if claude -p "$FIX_PROMPT" < /dev/null 2>&1; then
        logok "Claude fix run complete. Retrying build..."
        cd "$SITE_ABS"
        BUILD_LOG2=$(npm run build 2>&1)
        BUILD_EXIT2=$?
        echo "$BUILD_LOG2" | tail -10

        if [ $BUILD_EXIT2 -ne 0 ]; then
          BUILD_STATUS="failed"
          fail "Build failed after auto-fix attempt. Manual intervention required.

FIRST ERROR:
${BUILD_LOG}

SECOND ERROR:
${BUILD_LOG2}"
        else
          logok "Build succeeded after auto-fix"
          BUILD_STATUS="success"
        fi
      else
        fail "Claude Code fix attempt failed. Original build error:
${BUILD_LOG}"
      fi
    else
      fail "Build failed:
${BUILD_LOG}"
    fi
  else
    logok "Build succeeded"
    BUILD_STATUS="success"
  fi

  cd "$REPO_PATH"
else
  log "Static site — no build step"
  BUILD_STATUS="skipped"
fi

# ─── GIT COMMIT + PUSH ───────────────────────────────────────────────────────

cd "$REPO_PATH"

# Collect changed files
GIT_STATUS=$(git status --porcelain 2>/dev/null || echo "")
if [ -n "$GIT_STATUS" ]; then
  log "Changed files:"
  echo "$GIT_STATUS"

  # Build JSON array of changed files
  FILES_JSON=$(git status --porcelain | awk '{print $2}' | \
    python3 -c "import sys,json; lines=[l.strip() for l in sys.stdin if l.strip()]; print(json.dumps(lines))" 2>/dev/null || echo "[]")
  CHANGED_FILES="$FILES_JSON"

  git add .
  git commit -m "A2 runner: ${RUN_ID} (${LEAD_NAME:-build})" 2>&1
  logok "Committed changes"

  git push origin "$BRANCH" 2>&1 | tail -3
  logok "Pushed to ${BRANCH}"
else
  log "No file changes — skipping commit"
  CHANGED_FILES="[]"
fi

# ─── VERCEL DEPLOY ────────────────────────────────────────────────────────────

if [ "$REQUIRES_DEPLOY" = "1" ]; then
  if [ -z "$VERCEL_TOKEN" ]; then
    DEPLOY_STATUS="failed"
    ERROR_MSG="VERCEL_TOKEN not set"
    logfail "$ERROR_MSG"
    write_summary "success"  # build succeeded, only deploy failed
    exit 0
  fi

  cd "$SITE_ABS"

  # Auto-link Vercel project if not linked
  VERCEL_JSON="${SITE_ABS}/.vercel/project.json"
  if [ ! -f "$VERCEL_JSON" ]; then
    PROJECT_NAME=$(basename "$SITE_ABS")
    log "Vercel not linked — auto-creating project: ${PROJECT_NAME}"

    CREATE_RESP=$(curl -sf -X POST "https://api.vercel.com/v9/projects" \
      -H "Authorization: Bearer ${VERCEL_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{\"name\":\"${PROJECT_NAME}\",\"framework\":null}" 2>&1) || true

    PROJECT_ID=$(echo "$CREATE_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',''))" 2>/dev/null || echo "")
    ORG_ID=$(echo "$CREATE_RESP"    | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('accountId',''))" 2>/dev/null || echo "")

    if [ -z "$PROJECT_ID" ]; then
      # Project may already exist — fetch it
      log "Create returned no ID — trying to fetch existing project..."
      FETCH_RESP=$(curl -sf "https://api.vercel.com/v9/projects/${PROJECT_NAME}" \
        -H "Authorization: Bearer ${VERCEL_TOKEN}" 2>&1) || true
      PROJECT_ID=$(echo "$FETCH_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',''))" 2>/dev/null || echo "")
      ORG_ID=$(echo "$FETCH_RESP"     | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('accountId',''))" 2>/dev/null || echo "")
    fi

    if [ -z "$PROJECT_ID" ]; then
      fail "Could not create or find Vercel project '${PROJECT_NAME}'. Response: $(echo "$CREATE_RESP" | head -c 300)"
    fi

    mkdir -p "${SITE_ABS}/.vercel"
    printf '{"projectId":"%s","orgId":"%s"}\n' "$PROJECT_ID" "$ORG_ID" > "$VERCEL_JSON"
    logok "Vercel project linked: ${PROJECT_NAME} (${PROJECT_ID})"

    # Commit the .vercel/project.json so future runs don't re-create
    cd "$REPO_PATH"
    git add "${SITE_ABS}/.vercel/project.json"
    git commit -m "Link ${PROJECT_NAME} to Vercel project ${PROJECT_ID}" 2>/dev/null || true
    git push origin "$BRANCH" 2>&1 | tail -2 || true
    cd "$SITE_ABS"
  fi

  VERCEL_PROJECT=$(cat "$VERCEL_JSON" | grep '"projectId"' | sed 's/.*: *"\([^"]*\)".*/\1/' || echo "unknown")
  log "Vercel project: ${VERCEL_PROJECT}"
  log "Running: vercel deploy --prod"

  DEPLOY_OUTPUT=$(vercel deploy --prod --yes --token "$VERCEL_TOKEN" 2>&1)
  DEPLOY_EXIT=$?
  echo "$DEPLOY_OUTPUT" | tail -10

  if [ $DEPLOY_EXIT -ne 0 ]; then
    DEPLOY_STATUS="failed"
    ERROR_MSG="Vercel deploy failed: $(echo "$DEPLOY_OUTPUT" | tail -3)"
    logfail "$ERROR_MSG"
  else
    # Extract the production URL (last https:// line)
    DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -oE 'https://[a-zA-Z0-9._-]+\.vercel\.app' | tail -1 || echo "")
    DEPLOY_STATUS="success"
    logok "Deployed: ${DEPLOY_URL}"
  fi

  cd "$REPO_PATH"
else
  DEPLOY_STATUS="skipped"
  log "Deploy skipped (requires_deploy=0)"
fi

# ─── Done ─────────────────────────────────────────────────────────────────────

OVERALL="success"
[ "$BUILD_STATUS" = "failed" ] && OVERALL="failed"
[ "$DEPLOY_STATUS" = "failed" ] && OVERALL="warning"  # build ok, deploy failed

write_summary "$OVERALL"
log "━━━ Run complete: ${OVERALL} ━━━━━━━━━━━━━━━━━━━━━━━━"

#!/usr/bin/env bash
# PDSTUDIO Runner — Automatisches VPS Setup
# Einmalig auf dem VPS ausführen:
#   bash /var/www/pdstudio/runner/setup.sh

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✓${NC} $*"; }
info() { echo -e "${CYAN}→${NC} $*"; }
warn() { echo -e "${YELLOW}⚠${NC} $*"; }
fail() { echo -e "${RED}✗ FEHLER:${NC} $*"; exit 1; }
sep()  { echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

REPO_PATH="/var/www/pdstudio"
RUNNER_PATH="/opt/pdstudio-runner"
RUNNER_PORT="8787"
GITHUB_REPO="git@github.com:pepedietrich-byte/pdstudio.git"
GITHUB_HTTPS="https://github.com/pepedietrich-byte/pdstudio.git"

sep
echo -e "${CYAN}  PDSTUDIO Runner — VPS Setup${NC}"
echo -e "  Repo:   ${REPO_PATH}"
echo -e "  Runner: ${RUNNER_PATH}"
echo -e "  Port:   ${RUNNER_PORT}"
sep

# ─── Root check ──────────────────────────────────────────────────────────────

if [ "$(id -u)" != "0" ]; then
  fail "Bitte als root ausführen: sudo bash setup.sh"
fi

# ─── Node.js ─────────────────────────────────────────────────────────────────

sep; info "Prüfe Node.js..."
if command -v node &>/dev/null; then
  NODE_VER=$(node --version)
  ok "Node.js ${NODE_VER} gefunden"
  # Check major version >= 20
  NODE_MAJOR=$(echo "$NODE_VER" | sed 's/v\([0-9]*\).*/\1/')
  if [ "$NODE_MAJOR" -lt 20 ]; then
    warn "Node.js ${NODE_VER} ist zu alt. Installiere Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    ok "Node.js $(node --version) installiert"
  fi
else
  info "Node.js wird installiert..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
  ok "Node.js $(node --version) installiert"
fi

# ─── PM2 ─────────────────────────────────────────────────────────────────────

sep; info "Prüfe PM2..."
if ! command -v pm2 &>/dev/null; then
  info "PM2 wird installiert..."
  npm install -g pm2
fi
ok "PM2 $(pm2 --version) gefunden"

# ─── Vercel CLI ──────────────────────────────────────────────────────────────

sep; info "Prüfe Vercel CLI..."
if ! command -v vercel &>/dev/null; then
  info "Vercel CLI wird installiert..."
  npm install -g vercel
fi
ok "Vercel CLI $(vercel --version 2>/dev/null | head -1) gefunden"

# ─── Git ─────────────────────────────────────────────────────────────────────

sep; info "Prüfe Git..."
if ! command -v git &>/dev/null; then
  apt-get install -y git
fi
ok "Git $(git --version) gefunden"

# ─── Claude CLI check ────────────────────────────────────────────────────────

sep; info "Prüfe Claude CLI..."
if command -v claude &>/dev/null; then
  CLAUDE_VER=$(claude --version 2>&1 | head -1)
  ok "Claude CLI: ${CLAUDE_VER}"
else
  fail "Claude CLI nicht gefunden. Bitte zuerst installieren und authentifizieren."
fi

# ─── GitHub SSH oder HTTPS ───────────────────────────────────────────────────

sep; info "Prüfe GitHub Verbindung..."

USE_HTTPS=false
SSH_TEST=$(ssh -o ConnectTimeout=5 -T git@github.com 2>&1 || true)
if echo "$SSH_TEST" | grep -q "successfully authenticated"; then
  ok "GitHub SSH Auth aktiv"
else
  warn "GitHub SSH Auth nicht verfügbar. Wechsle zu HTTPS."
  USE_HTTPS=true
  echo ""
  echo -e "  Du brauchst einen GitHub Personal Access Token (PAT)."
  echo -e "  → https://github.com/settings/tokens"
  echo -e "  Scope: repo (read + write)"
  echo ""
  read -rp "GitHub Personal Access Token: " GITHUB_TOKEN
  [ -z "$GITHUB_TOKEN" ] && fail "GitHub Token ist erforderlich für HTTPS-Modus."
fi

# ─── Repo klonen / updaten ───────────────────────────────────────────────────

sep; info "Richte Repo ein: ${REPO_PATH}"
mkdir -p "$(dirname "$REPO_PATH")"

if [ -d "${REPO_PATH}/.git" ]; then
  info "Repo existiert bereits — update..."
  cd "$REPO_PATH"
  if [ "$USE_HTTPS" = true ]; then
    git remote set-url origin "https://${GITHUB_TOKEN}@github.com/pepedietrich-byte/pdstudio.git"
  fi
  git fetch origin main
  git checkout main
  git pull --rebase origin main
  ok "Repo aktualisiert"
else
  if [ "$USE_HTTPS" = true ]; then
    CLONE_URL="https://${GITHUB_TOKEN}@github.com/pepedietrich-byte/pdstudio.git"
  else
    CLONE_URL="$GITHUB_REPO"
  fi
  git clone "$CLONE_URL" "$REPO_PATH"
  ok "Repo geklont → ${REPO_PATH}"
fi

# ─── Runner Verzeichnis ───────────────────────────────────────────────────────

sep; info "Richte Runner ein: ${RUNNER_PATH}"
mkdir -p "$RUNNER_PATH" "${RUNNER_PATH}/logs" "${RUNNER_PATH}/runs" "${RUNNER_PATH}/tmp"

# Kopiere Runner-Dateien aus Repo
cp "${REPO_PATH}/runner/server.js"            "${RUNNER_PATH}/server.js"
cp "${REPO_PATH}/runner/runner.sh"            "${RUNNER_PATH}/runner.sh"
cp "${REPO_PATH}/runner/ecosystem.config.cjs" "${RUNNER_PATH}/ecosystem.config.cjs"
cp "${REPO_PATH}/runner/package.json"         "${RUNNER_PATH}/package.json"
cp "${REPO_PATH}/runner/.env.example"         "${RUNNER_PATH}/.env.example"
chmod +x "${RUNNER_PATH}/runner.sh"
ok "Runner-Dateien kopiert"

# npm install
cd "$RUNNER_PATH"
npm install --silent
ok "npm install abgeschlossen"

# ─── .env befüllen ───────────────────────────────────────────────────────────

sep
echo -e "${CYAN}  Secrets konfigurieren${NC}"
echo ""

ENV_FILE="${RUNNER_PATH}/.env"

# RUNNER_SECRET
if [ -f "$ENV_FILE" ] && grep -q "^RUNNER_SECRET=.\+" "$ENV_FILE" 2>/dev/null; then
  EXISTING_SECRET=$(grep "^RUNNER_SECRET=" "$ENV_FILE" | cut -d= -f2)
  ok "RUNNER_SECRET bereits gesetzt (${EXISTING_SECRET:0:8}...)"
  RUNNER_SECRET="$EXISTING_SECRET"
else
  RUNNER_SECRET=$(openssl rand -hex 32)
  info "RUNNER_SECRET automatisch generiert: ${RUNNER_SECRET:0:16}..."
fi

# VERCEL_TOKEN
if [ -f "$ENV_FILE" ] && grep -q "^VERCEL_TOKEN=.\+" "$ENV_FILE" 2>/dev/null; then
  ok "VERCEL_TOKEN bereits gesetzt"
  VERCEL_TOKEN=$(grep "^VERCEL_TOKEN=" "$ENV_FILE" | cut -d= -f2)
else
  echo ""
  echo -e "  Vercel Personal Access Token benötigt."
  echo -e "  → https://vercel.com/account/tokens"
  echo ""
  read -rp "Vercel Token (oder Enter zum Überspringen): " VERCEL_TOKEN
  if [ -z "$VERCEL_TOKEN" ]; then
    warn "Kein Vercel Token — Deploy-Modus deaktiviert bis Token gesetzt wird."
    VERCEL_TOKEN=""
  fi
fi

# .env schreiben
cat > "$ENV_FILE" <<EOF
RUNNER_SECRET=${RUNNER_SECRET}
PORT=${RUNNER_PORT}
REPO_PATH=${REPO_PATH}
RUNNER_PATH=${RUNNER_PATH}
VERCEL_TOKEN=${VERCEL_TOKEN}
GITHUB_BRANCH=main
GITHUB_REPO=${GITHUB_REPO}
GITHUB_PUSH_METHOD=$( [ "$USE_HTTPS" = true ] && echo "https" || echo "ssh" )
GITHUB_TOKEN=$( [ "$USE_HTTPS" = true ] && echo "${GITHUB_TOKEN:-}" || echo "" )
RUN_TIMEOUT_MS=300000
EOF

chmod 600 "$ENV_FILE"
ok ".env geschrieben (600 Permissions)"

# ─── PM2 starten ─────────────────────────────────────────────────────────────

sep; info "Starte Runner mit PM2..."

# Stop existing if running
pm2 stop pdstudio-runner 2>/dev/null || true
pm2 delete pdstudio-runner 2>/dev/null || true

cd "$RUNNER_PATH"
pm2 start ecosystem.config.cjs
pm2 save

ok "PM2 Runner gestartet"

# PM2 Startup (auto-start nach Reboot)
if ! pm2 startup 2>&1 | grep -q "already"; then
  STARTUP_CMD=$(pm2 startup 2>&1 | grep "sudo env" || echo "")
  if [ -n "$STARTUP_CMD" ]; then
    eval "$STARTUP_CMD" || warn "PM2 startup konnte nicht automatisch gesetzt werden. Manuell ausführen: pm2 startup"
  fi
fi

# ─── Warten bis Server läuft ─────────────────────────────────────────────────

info "Warte auf Server Start..."
for i in $(seq 1 10); do
  if curl -sf "http://localhost:${RUNNER_PORT}/health" &>/dev/null; then
    ok "Server antwortet auf Port ${RUNNER_PORT}"
    break
  fi
  sleep 1
  if [ "$i" = "10" ]; then
    fail "Server startet nicht. Logs prüfen: pm2 logs pdstudio-runner"
  fi
done

# ─── Analyze-Test ────────────────────────────────────────────────────────────

sep; info "Führe Analyze-Test aus..."
echo ""

ANALYZE_RESPONSE=$(curl -s -X POST "http://localhost:${RUNNER_PORT}/run-a2" \
  -H "Authorization: Bearer ${RUNNER_SECRET}" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "analyze",
    "metadata": { "site_dir": "sites/indian-crown" }
  }')

echo "$ANALYZE_RESPONSE" | python3 -c "
import sys, json
try:
  data = json.load(sys.stdin)
  checks = data.get('checks', [])
  all_ok = data.get('all_ok', False)
  print()
  for c in checks:
    icon = '✓' if c['status'] == 'ok' else '✗'
    color = '\033[0;32m' if c['status'] == 'ok' else '\033[0;31m'
    print(f\"  {color}{icon}\033[0m  {c['check']:<25} {c['detail']}\")
  print()
  if all_ok:
    print('\033[0;32m  Alle Checks bestanden — Runner ist bereit!\033[0m')
  else:
    print('\033[1;33m  Einige Checks fehlgeschlagen — siehe oben für Details.\033[0m')
except Exception as e:
  print(f'Parse-Fehler: {e}')
  print(sys.stdin.read() if hasattr(sys.stdin, 'read') else '')
" || echo "$ANALYZE_RESPONSE"

# ─── Zusammenfassung ─────────────────────────────────────────────────────────

sep
echo -e "${GREEN}  Setup abgeschlossen!${NC}"
echo ""
echo -e "  ${CYAN}Runner läuft auf:${NC}  http://localhost:${RUNNER_PORT}"
echo -e "  ${CYAN}Extern erreichbar:${NC} http://76.13.11.80:${RUNNER_PORT}"
echo ""
echo -e "  ${CYAN}RUNNER_SECRET:${NC}     ${RUNNER_SECRET:0:16}..."
echo -e "  (Vollständiger Secret in: ${ENV_FILE})"
echo ""
echo -e "  ${CYAN}Nächste Schritte:${NC}"
echo -e "  1. RUNNER_SECRET in n8n als Credential hinterlegen"
echo -e "  2. Vercel Sites verlinken wenn noch nicht geschehen:"
echo -e "     cd ${REPO_PATH}/sites/indian-crown"
echo -e "     vercel link --token \$VERCEL_TOKEN"
echo -e "  3. Ersten Build-Test in n8n triggern"
echo ""
echo -e "  ${CYAN}Nützliche Befehle:${NC}"
echo -e "  pm2 logs pdstudio-runner    # Live-Logs"
echo -e "  pm2 status                  # Status"
echo -e "  pm2 restart pdstudio-runner # Neustart"
sep

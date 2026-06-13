# PDSTUDIO Runner — Sicherheitsregeln

---

## Grundprinzipien

1. **Kein öffentlicher Zugriff ohne Bearer Secret** — der Runner antwortet auf `401` wenn der Header fehlt oder falsch ist
2. **Secrets niemals in Git** — `.env` ist in `.gitignore`, nur `.env.example` kommt ins Repo
3. **Path Sandbox** — runner.sh und server.js validieren, dass `site_dir` innerhalb `/var/www/pdstudio` liegt
4. **Kein Shell Injection** — der Prompt wird als Datei übergeben, nie per String-Interpolation in Shell-Befehlen
5. **Kein concurrent Build** — Lock verhindert gleichzeitige Runs, die sich gegenseitig zerstören würden
6. **Logs ohne Secrets** — VERCEL_TOKEN und RUNNER_SECRET werden in Logs automatisch maskiert

---

## Bearer Secret

```bash
# Generieren (mindestens 32 Bytes):
openssl rand -hex 32

# Beispiel: a8f3c9d2e1b4...
# In .env setzen:
RUNNER_SECRET=a8f3c9d2e1b4...
```

**Länge:** Mindestens 32 Zeichen
**Rotation:** Bei Verdacht auf Kompromittierung sofort rotieren und PM2 neu starten

---

## Firewall (UFW) — Empfohlen

Port 8787 nur für die n8n-VPS-IP freigeben:

```bash
# n8n läuft auf demselben VPS → localhost reicht
# Wenn n8n und Runner auf demselben Host laufen:
ufw allow from 127.0.0.1 to any port 8787
ufw deny 8787

# Wenn n8n auf einem anderen Server läuft:
ufw allow from {N8N_VPS_IP} to any port 8787
ufw deny 8787
ufw reload
```

Da n8n auf demselben Hostinger VPS läuft wie der Runner, empfehle ich:
- Port 8787 **nicht** nach außen öffnen
- n8n ruft `http://localhost:8787/run-a2` auf (loopback)
- Die URL in n8n wird dann: `http://localhost:8787/run-a2`

---

## Nginx Reverse Proxy (Optional — für spätere Subdomain)

Wenn du später `runner.pdstudio.de` willst:

```nginx
server {
  listen 443 ssl;
  server_name runner.pdstudio.de;

  ssl_certificate     /etc/letsencrypt/live/runner.pdstudio.de/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/runner.pdstudio.de/privkey.pem;

  # Nur POST /run-a2 und GET /run-a2/* und GET /health zulassen
  location ~ ^/(run-a2|health) {
    # Rate limiting: max 10 Requests/Minute pro IP
    limit_req zone=runner_limit burst=5 nodelay;

    proxy_pass         http://127.0.0.1:8787;
    proxy_http_version 1.1;
    proxy_set_header   Host $host;
    proxy_set_header   X-Real-IP $remote_addr;
    proxy_read_timeout 360s;  # Muss > Runner-Timeout sein
    proxy_send_timeout 60s;

    # Keine anderen Pfade
    proxy_redirect off;
  }

  location / {
    return 404;
  }
}

# Rate limit zone (in http block):
# limit_req_zone $binary_remote_addr zone=runner_limit:10m rate=10r/m;
```

---

## Prompt-Sicherheit

| Limit | Wert |
|-------|------|
| Max Prompt-Größe | 50 KB |
| Max Body-Größe | 100 KB |
| Erlaubte Modi | build, analyze, fix, deploy |
| Timeout pro Run | 5 Minuten (konfigurierbar) |

Der Prompt wird als Datei geschrieben und per `claude -p "$(cat $PROMPT_FILE)"` übergeben — niemals per String-Interpolation in Shell-Befehlen. Das verhindert Command Injection.

---

## Verbotene Shell-Operationen in runner.sh

runner.sh enthält **keine** dieser Operationen:
- `rm -rf` (außer im tmp-Bereich unter /opt/pdstudio-runner/tmp)
- `chmod 777`
- Freie User-Input-Interpolation in Shell-Befehlen
- Curl/wget mit User-kontrollierter URL
- `eval`
- `sudo` (Runner läuft als dedizierter User, nicht root)

---

## Empfohlener VPS-User

Runner als dedizierter User laufen lassen statt root:

```bash
# User anlegen
useradd -m -s /bin/bash pdrunner

# Runner-Verzeichnis zuweisen
chown -R pdrunner:pdrunner /opt/pdstudio-runner

# Repo-Verzeichnis zuweisen
chown -R pdrunner:pdrunner /var/www/pdstudio

# PM2 als pdrunner starten
su - pdrunner
cd /opt/pdstudio-runner
pm2 start ecosystem.config.cjs
pm2 startup  # PM2-Startup als pdrunner
pm2 save
```

---

## Erlaubte Modi und ihre Rechte

| Modus | Datei-Änderungen | Git Push | Vercel Deploy | Concurrent |
|-------|-----------------|----------|---------------|-----------|
| analyze | ❌ | ❌ | ❌ | ✅ (immer erlaubt) |
| build | ✅ | ✅ | ✅ (wenn requires_deploy) | ❌ (Lock) |
| deploy | ❌ | ✅ | ✅ | ❌ (Lock) |
| fix | ✅ | ✅ | ✅ (wenn requires_deploy) | ❌ (Lock) |

---

## Log-Sicherheit

Logs landen in `/opt/pdstudio-runner/logs/`. Sie enthalten:
- Run-Timestamps
- Git-Output
- npm-Output
- Claude-Code-Output (nur stdout, keine Secrets)
- Vercel CLI Output

**Was automatisch maskiert wird:**
- `VERCEL_TOKEN` → `[MASKED]`
- `RUNNER_SECRET` → `[MASKED]`
- `GITHUB_TOKEN` → `[MASKED]`

**Log-Rotation:**
```bash
# /etc/logrotate.d/pdstudio-runner
/opt/pdstudio-runner/logs/*.log {
  daily
  rotate 14
  compress
  missingok
  notifempty
}
```

---

## Secrets-Checkliste

```
✓ .env ist in .gitignore
✓ RUNNER_SECRET min. 32 Zeichen
✓ VERCEL_TOKEN nur in .env, nie in Code
✓ GITHUB_TOKEN (falls HTTPS) nur in .env
✓ Port 8787 durch UFW auf localhost beschränkt
✓ Logs rotiert
✓ Runner nicht als root
```

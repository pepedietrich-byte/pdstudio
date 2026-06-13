# Agent 2 — Runner Integration

> Wie n8n Agent 2 den VPS Runner aufruft, welche Payloads er sendet, und was er zurückbekommt.

---

## Runner Endpoint

```
POST http://76.13.11.80:8787/run-a2
Authorization: Bearer {RUNNER_SECRET}
Content-Type: application/json
```

---

## Request Body

### Mode: `analyze` (immer zuerst testen)

```json
{
  "mode": "analyze",
  "branch": "main",
  "metadata": {
    "site_dir": "sites/indian-crown"
  }
}
```

Prüft: Repo, Git-Auth, Claude CLI, npm, Vercel CLI, Vercel-Link-Status.
Macht **keine** Dateiänderungen.

---

### Mode: `build` (vollständiger Durchlauf)

```json
{
  "mode": "build",
  "branch": "main",
  "run_id": "optional-custom-id",
  "prompt": "...vollständiger Claude Code Build Prompt (~7500 Zeichen)...",
  "metadata": {
    "lead_name": "Indian Crown",
    "site_dir": "sites/indian-crown",
    "site_type": "restaurant",
    "quality_target": "premium",
    "requires_deploy": true
  }
}
```

Ablauf: git pull → Claude Code ausführen → npm build → git commit + push → vercel deploy

---

### Mode: `deploy` (nur Build + Deploy, kein Claude)

```json
{
  "mode": "deploy",
  "branch": "main",
  "metadata": {
    "site_dir": "sites/indian-crown",
    "requires_deploy": true
  }
}
```

---

### Mode: `fix` (Claude mit Fehlerkontext)

```json
{
  "mode": "fix",
  "branch": "main",
  "prompt": "Der Build schlägt fehl mit diesem Fehler: [Fehlertext]. Bitte fix...",
  "metadata": {
    "site_dir": "sites/indian-crown",
    "requires_deploy": true
  }
}
```

---

## Response

### Success

```json
{
  "run_id": "a3f9bc12de4f",
  "status": "success",
  "mode": "build",
  "branch": "main",
  "site_dir": "sites/indian-crown",
  "lead_name": "Indian Crown",
  "started_at": "2026-06-13T10:00:00Z",
  "completed_at": "2026-06-13T10:01:32Z",
  "duration_seconds": 92,
  "changed_files": ["sites/indian-crown/src/App.jsx", "sites/indian-crown/dist/index.html"],
  "build_status": "success",
  "deploy_status": "success",
  "deploy_url": "https://pdstudio-indian-crown.vercel.app",
  "vercel_project": "prj_xxxx",
  "error": null,
  "log_tail": "...letzten 60 Zeilen des Run-Logs..."
}
```

### Vercel nicht verlinkt

```json
{
  "run_id": "...",
  "status": "success",
  "build_status": "success",
  "deploy_status": "not_linked",
  "deploy_url": "",
  "error": null,
  "log_tail": "Site is not linked to a Vercel project.\nRun: cd /var/www/pdstudio/sites/indian-crown && vercel link --token $VERCEL_TOKEN"
}
```

**Was zu tun ist:** SSH auf VPS, Befehl ausführen, dann erneut mit `mode: deploy` triggern.

### Build fehlgeschlagen

```json
{
  "run_id": "...",
  "status": "failed",
  "build_status": "failed",
  "deploy_status": "skipped",
  "error": "Build failed after auto-fix attempt. Manual intervention required.",
  "log_tail": "...Build-Fehlermeldung..."
}
```

### Konkurrierender Run

```json
{
  "error": "Another run is in progress",
  "status": "busy",
  "active_run_id": "...",
  "active_run_started": "2026-06-13T10:00:00Z"
}
```
HTTP Status: `409 Conflict`

### Timeout (>5 Minuten)

```json
{
  "status": "timeout",
  "run_id": "...",
  "message": "Run exceeded 300s timeout. Check status endpoint.",
  "log_tail": "..."
}
```

Poll dann: `GET http://76.13.11.80:8787/run-a2/{run_id}/status`

---

## n8n HTTP Request Node — Konfiguration

### Node: HTTP Request

```
Method:           POST
URL:              http://76.13.11.80:8787/run-a2
Authentication:   Generic Credential Type → Header Auth
  Header Name:    Authorization
  Header Value:   Bearer {{$env.RUNNER_SECRET}}

Body:             JSON
Content-Type:     application/json
Timeout:          360000  (6 Minuten — etwas über dem Runner-Timeout)
```

### n8n Code Node — Payload zusammenbauen

```javascript
// Vor dem HTTP Request Node
// Nimmt Lead-Daten und Claude-Prompt aus vorherigen Nodes

const lead = $input.item.json
const claudePrompt = $node["Prompt Builder"].json.claude_prompt

return [{
  json: {
    mode: "build",
    branch: "main",
    prompt: claudePrompt,
    metadata: {
      lead_name:       lead.name,
      site_dir:        `sites/${lead.slug}`,
      site_type:       "restaurant",
      quality_target:  "premium",
      requires_deploy: true,
    }
  }
}]
```

### n8n Code Node — Response verarbeiten

```javascript
// Nach dem HTTP Request Node
const response = $input.item.json

if (response.status === 'failed') {
  // Fehler in BUILD-Sheet schreiben
  return [{
    json: {
      lead_id:      $node["Lead Data"].json.lead_id,
      build_status: 'failed',
      deploy_url:   null,
      error:        response.error,
      run_id:       response.run_id,
    }
  }]
}

if (response.deploy_status === 'not_linked') {
  // Warnung — manueller Schritt nötig
  return [{
    json: {
      lead_id:      $node["Lead Data"].json.lead_id,
      build_status: 'success',
      deploy_url:   null,
      deploy_status: 'not_linked',
      action_needed: response.log_tail,
    }
  }]
}

// Erfolg
return [{
  json: {
    lead_id:      $node["Lead Data"].json.lead_id,
    build_status: response.build_status,
    deploy_url:   response.deploy_url,
    deploy_status: response.deploy_status,
    run_id:       response.run_id,
    changed_files: response.changed_files,
  }
}]
```

---

## Agent 2 n8n Workflow-Anpassung

Der bestehende A2-Workflow (Webhook: `/webhook/agent7-start`) bekommt am Ende einen neuen Schritt:

```
[Existierende Nodes]
  → Prompt Builder Node
  → [NEU] Runner Payload Builder (Code Node)
  → [NEU] HTTP Request → Runner
  → [NEU] Response Handler (Code Node)
  → [Existierend] Google Sheets: BUILD-Tab schreiben
```

### Payload den Agent 2 zusätzlich produziert

```json
{
  "runner_payload": {
    "mode": "build",
    "branch": "main",
    "prompt": "{{claude_code_prompt}}",
    "metadata": {
      "lead_name":       "{{restaurant_name}}",
      "site_dir":        "sites/{{lead_slug}}",
      "site_type":       "restaurant",
      "quality_target":  "premium",
      "requires_deploy": true
    }
  }
}
```

---

## Status-Polling (optional)

Für n8n-Workflows mit langen Builds: Runner sofort anfragen, dann pollen.

```
GET http://76.13.11.80:8787/run-a2/{run_id}/status
Authorization: Bearer {RUNNER_SECRET}
```

Response: Selbes Format wie POST /run-a2, plus `log_tail`.

---

## Health Check

```
GET http://76.13.11.80:8787/health
```

Kein Auth nötig (durch Firewall geschützt). Gibt:
```json
{
  "status": "ok",
  "uptime_seconds": 12345,
  "active_run": null
}
```

---

## Erster Test-Ablauf (Analyze)

```bash
curl -X POST http://76.13.11.80:8787/run-a2 \
  -H "Authorization: Bearer DEIN_RUNNER_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "analyze",
    "metadata": { "site_dir": "sites/indian-crown" }
  }'
```

Erwartete Ausgabe: Alle Checks grün oder konkrete Fehlermeldungen mit Fix-Anleitung.

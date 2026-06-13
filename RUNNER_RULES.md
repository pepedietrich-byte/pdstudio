# PDSTUDIO — Runner-Regeln

> Für Claude Code-Sessions die n8n-Workflows bauen, testen oder debuggen.

---

## Modi

### Manual Mode (Standard)
Pepe steuert jeden Agenten einzeln über das Command Center.
- Lead auswählen → Agent wählen → Starten
- Kein automatischer Durchlauf
- Ergebnis sofort im Command Center sichtbar

### Runner Mode — A2 Remote Build (Claude Code auf VPS)

Agent 2 triggert den VPS Runner per HTTP. Claude Code läuft headless auf dem VPS und baut/deployt Websites.

**Endpoint:** `http://localhost:8787/run-a2` (VPS-intern) oder `http://76.13.11.80:8787/run-a2` (von außen)
**Auth:** `Authorization: Bearer $RUNNER_SECRET`
**Docs:** → [A2_RUNNER_INTEGRATION.md](A2_RUNNER_INTEGRATION.md)
**Security:** → [RUNNER_SECURITY.md](RUNNER_SECURITY.md)

**Modi:**
- `analyze` — Health-Check, keine Änderungen. Immer zuerst ausführen.
- `build` — git pull → Claude Code → npm build → git commit → vercel deploy
- `deploy` — nur npm build + vercel deploy (kein Claude)
- `fix` — Claude bekommt Build-Fehler als Kontext und repariert

**VPS Pfade:**
- Runner: `/opt/pdstudio-runner/` (server.js + runner.sh)
- Repo: `/var/www/pdstudio/` (geklontes GitHub Repo)
- Logs: `/opt/pdstudio-runner/logs/{run_id}.log`
- Summaries: `/opt/pdstudio-runner/runs/{run_id}.json`

**Pflicht-Reihenfolge beim ersten Setup:**
1. Analyze-Test ausführen — alle Checks müssen grün sein
2. Vercel link für jede Site manuell bestätigen
3. Erst dann Build-Mode aktivieren

### Runner Mode — n8n Workflow-Entwicklung
Claude Code baut n8n-Workflows direkt über die n8n REST API.
Wird verwendet wenn Pepe sagt: "Bau mir den Workflow" oder "Reparier Agent X in n8n".

**Pflicht-Vorgehen:**
1. Erst Masterplan lesen (`moneylan/masterplans/AGENT X MASTERPLAN.md`)
2. Bestehenden Workflow per GET abrufen bevor Änderungen
3. Workflow per PATCH aktualisieren (nicht löschen + neu anlegen)
4. Nach Änderung: Workflow-Status prüfen (aktiv/inaktiv)
5. Testlauf mit einem echten Lead (nicht Auerbach's Keller)
6. Ergebnis in CURRENT_STATE.md dokumentieren

### Remote Mode (VPS direkt)
Wenn auf dem Hostinger VPS gearbeitet wird.
- n8n läuft im Docker Container `n8n-n8n-1`
- Volume `/files` ist auf dem Host unter `/local-files` gemountet
- Container direkt ansprechen für Dateioperationen: `docker exec n8n-n8n-1 ...`

### Desktop Mode (lokal auf Pepes Mac)
- Command Center läuft lokal via `npm run dev` in `/command-center/`
- A3 Polish Server läuft via `node a3-server.js` (Port 3033)
- Vercel CLI für Deployments: `npx vercel --prod`

---

## n8n REST API Pattern

**Base URL:** `https://n8n.srv1736252.hstgr.cloud/api/v1`
**Auth:** Bearer Token (in Umgebungsvariable `N8N_API_KEY`)

### Workflow abrufen
```bash
GET /api/v1/workflows/{workflow_id}
Authorization: Bearer {N8N_API_KEY}
```

### Workflow aktualisieren (PFLICHT: vollständiger PATCH)
```bash
PATCH /api/v1/workflows/{workflow_id}
Content-Type: application/json
Authorization: Bearer {N8N_API_KEY}

{
  "name": "...",
  "nodes": [...vollständige nodes-Liste...],
  "connections": {...},
  "settings": {},
  "staticData": null
}
```

**Kritisch:** Immer das vollständige `nodes`-Array senden, nie nur die geänderten Nodes. Partielle PATCH-Payloads zerstören die Workflow-Verbindungen.

### Workflow aktivieren/deaktivieren
```bash
POST /api/v1/workflows/{workflow_id}/activate
POST /api/v1/workflows/{workflow_id}/deactivate
```

### Execution starten (Webhook-Alternative)
```bash
POST /api/v1/workflows/{workflow_id}/execute
Content-Type: application/json
{ "workflowData": {}, "runData": {} }
```

### Letzten Execution-Status prüfen
```bash
GET /api/v1/executions?workflowId={id}&limit=1&order=desc
```

---

## CORS-Proxy Pattern

**Problem:** Browser darf nicht direkt auf `n8n.srv1736252.hstgr.cloud` zugreifen (CORS-Fehler).
**Lösung:** Alle n8n-Calls aus dem Browser gehen über Vercel Serverless Functions in `/api/`.

### Struktur
```
command-center/
  api/
    sheets.js         → Proxy für Google Sheets
    executions.js     → Proxy für n8n Executions API
    a3-score.js       → Proxy für A3 Score-Endpoint
    a3-polish.js      → Proxy für A3 Polish-Endpoint
    pepe-ask.js       → Proxy für direkte n8n-Webhook-Aufrufe
    twin/
      [twin-endpoint-proxies]
```

### Proxy-Template
```javascript
export default async function handler(req, res) {
  // CORS headers immer setzen
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const response = await fetch('https://n8n.srv1736252.hstgr.cloud/...', {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    })
    const data = await response.json()
    return res.status(response.status).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
```

**Regel:** Jeder neue n8n-Endpoint der im Browser genutzt wird, bekommt sofort einen Proxy in `/api/`.

---

## Google Sheets Proxy Pattern

### Lesen
```javascript
const SHEET_ID = '1Fjw6K4MY-H3KfsM4CrZ9BAbDQ0cOKosqAGVsqqftpjc'
const RANGE = 'LEADS!A:Z'
const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`
```

### Schreiben (via n8n, nicht direkt)
Direkte Sheets-Writes gehen immer über n8n-Workflows, nicht aus dem Frontend.
Frontend liest nur. n8n schreibt.

### Array-Serialisierung
Arrays in Sheets: `|`-Separator.
```javascript
// Lesen
const arr = cell.split('|').filter(Boolean)
// Schreiben (in n8n Code-Node)
const cellValue = arr.join('|')
```

---

## n8n Code-Node Regeln

Was in n8n Code-Nodes NICHT funktioniert:
- `$helpers` — nicht verfügbar
- `fetch` — nicht global, muss über HTTP-Node gehen
- `require()` — Node.js Modules nicht standardmäßig verfügbar
- `Date.now()` in Expressions — aufpassen, lieber ISO-String

Was immer funktioniert:
- `$input.item.json` für aktuellen Item
- `$node["NodeName"].json` für anderen Node-Output
- `$runIndex` für Loop-Index
- `items.map(...)` in Code-Nodes für Batch-Processing

### Self-Correction Pattern (für LLM-Nodes)
```javascript
// Nach jedem LLM-Call: Validierung
let parsed
try {
  parsed = JSON.parse(llmOutput)
  validateSchema(parsed) // wirft bei Fehler
} catch (e) {
  // Retry-Prompt mit Fehlermeldung
  retryPrompt = `Dein JSON war ungültig: ${e.message}. Gib es korrekt zurück.`
  // Max 2 Retries, dann Fallback auf Roh-Daten
}
```

---

## Fehlerbehandlung (n8n)

**Grundprinzip:** Kein harter Stop bei Einzelfehler. Die Pipeline läuft weiter.

```
Jeder n8n-Node muss:
  ✓ continueOnFail: true
  ✓ Timeout gesetzt (empfohlen: 60s für LLM, 30s für HTTP)
  ✓ Warning in Output schreiben bei Fehler
  ✓ Lead niemals verwerfen — nur Status und Warning setzen

Poe-API-Node zusätzlich:
  ✓ neverError: true
  ✓ Bei HTTP 5xx: status = "external_blocker" in BUILD-Sheet schreiben
  ✓ Bei Cloudflare-Block: automatisch nächster Retry nach 5min
```

---

## Testen

### Gute Test-Leads
- Mittlere Restaurants in Leipzig (Connewitz, Gohlis, Plagwitz)
- Score > 80
- Echte, erreichbare Website

### Verbotene Test-Leads
- Auerbach's Keller Leipzig — zu bekannt, Sonderfall, verfälscht Tests
- Kettenrestaurants
- Restaurants mit bereits sehr guter Website (Score < 40)

### Test-Checkliste für jeden Agenten
```
□ Schema-konformer Output?
□ Fakten/Interpretation klar getrennt? (A2/A3)
□ missing_fields korrekt gesetzt? (A1/A2)
□ confidence plausibel?
□ Kein harter Crash bei Einzelfehler?
□ Sheet-Tab korrekt beschrieben?
□ Vercel-URL erreichbar? (A2/A3)
```

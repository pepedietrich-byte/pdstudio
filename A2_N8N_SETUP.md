# Agent 2 n8n Workflow Setup — finale Verbindung

> Nach diesem Setup baut der VPS selbstständig jede Demo-Website wenn du im Command Center einen Lead auswählst und Optionen bestätigst.

---

## Übersicht der Verbindung

```
Command Center → Webhook → Agent 2 (n8n) → VPS Runner → Vercel
       UI         (POST)    (orchestrate)   (build+deploy) (live URL)
                                                            │
                                                            ▼
                                                    BUILD Sheet
```

---

## Schritt 1: RUNNER_SECRET als n8n Credential

1. n8n öffnen: https://n8n.srv1736252.hstgr.cloud
2. Settings → Credentials → **New Credential** → "Header Auth"
3. Name: `VPS Runner`
4. Header Name: `Authorization`
5. Header Value: `Bearer 1e2fd9426b7e0775922bf138d1d5ff9e7e3c7b7ea984d92b2a32f1529187fa62`
6. Save

---

## Schritt 2: Agent 2 Workflow erweitern

**Workflow:** `MONEYLAN Agent 2 — Text Extractor` (ID: `04XC92MJvaYKtjbi`)

**Neuen Trigger anlegen** (oder existierenden modifizieren):

Webhook-URL Pattern: `POST /webhook/agent2-build`

**Body-Schema das Command Center sendet:**

```json
{
  "lead_id": "trattoria-rosso-04229",
  "business_name": "Trattoria Rosso",
  "address": "Connewitzer Str. 12, 04275 Leipzig",
  "phone": "0341 1234567",
  "website_url": "trattoria-rosso.de",
  "cuisine": "Italienisch",
  "atmosphere": "Familienbetrieb, warm, traditional",
  "opening_hours": "Mo-Fr 17:00-23:00, Sa-So 12:00-23:00",
  "google_rating": "4.7",
  "google_reviews_count": "320",
  "specials": "Hausgemachte Pasta, Wein aus eigenem Weinberg",
  "price_range": "€€",
  "build_options": {
    "style": "restaurant-premium",
    "colorDirection": "drenched-warm",
    "quality": "premium",
    "imageSource": "unsplash"
  },
  "images": [
    {"role": "hero",     "url": "https://images.unsplash.com/..."},
    {"role": "interior", "url": "https://images.unsplash.com/..."},
    {"role": "food",     "url": "https://images.unsplash.com/..."},
    {"role": "atmosphere","url": "https://images.unsplash.com/..."}
  ]
}
```

---

## Schritt 3: n8n Nodes — Pipeline

### Node 1: Webhook (Trigger)
- Method: POST
- Path: `agent2-build`
- Response: When last node finishes

### Node 2: Code (Payload Builder)
Den vollständigen Code aus `runner/n8n-agent2-template.js` einfügen.

### Node 3: HTTP Request (Runner Call)
- Method: `={{ $json.method }}`
- URL: `={{ $json.url }}`
- Authentication: Generic Credential → Header Auth → `VPS Runner`
- Body: `={{ $json.body }}` (JSON)
- Response Format: JSON
- Timeout: 900000 (15 Minuten, passend zum Runner-Timeout)

### Node 4: Code (Response Parser)
```javascript
const r = $input.item.json;

return [{
  json: {
    lead_id: $node["Webhook"].json.body.lead_id,
    demo_url: r.deploy_url || null,
    build_status: r.build_status,
    deploy_status: r.deploy_status,
    run_id: r.run_id,
    duration_seconds: r.duration_seconds,
    error: r.error || null,
    log_tail: r.log_tail || '',
  }
}];
```

### Node 5: Google Sheets (BUILD Tab Upsert)
- Operation: Append or Update
- Sheet: `1Fjw6K4MY-H3KfsM4CrZ9BAbDQ0cOKosqAGVsqqftpjc`
- Range: `BUILD!A:Z`
- Match Column: `lead_id`
- Columns:
  - `lead_id`
  - `demo_url`
  - `build_status`
  - `deploy_status`
  - `run_id`
  - `built_at` (current timestamp)

### Node 6: Respond to Webhook
- Status: 200
- Body: JSON aus Node 4 (damit Command Center die URL sofort sieht)

---

## Schritt 4: Command Center UI Integration

In `command-center/src/components/AgentCard.jsx` oder `LeadDetail.jsx`:

```jsx
async function triggerA2Build(lead, options) {
  const response = await fetch('/api/agent2-build', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lead_id: lead.id,
      business_name: lead.name,
      address: lead.address,
      phone: lead.phone,
      website_url: lead.website,
      cuisine: lead.cuisine,
      atmosphere: lead.atmosphere,
      opening_hours: lead.hours,
      google_rating: lead.rating,
      google_reviews_count: lead.reviews,
      specials: lead.specials,
      price_range: lead.priceRange,
      build_options: options,
      images: lead.images,
    }),
  });
  
  const result = await response.json();
  
  if (result.deploy_url) {
    console.log('Demo bereit:', result.deploy_url);
    window.open(result.deploy_url, '_blank');
  }
}
```

Und `command-center/api/agent2-build.js` als Vercel-Proxy:

```javascript
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).end();
  
  const n8nResponse = await fetch(
    'https://n8n.srv1736252.hstgr.cloud/webhook/agent2-build',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    }
  );
  
  const data = await n8nResponse.json();
  return res.status(n8nResponse.status).json(data);
}
```

---

## Schritt 5: Test

```bash
# Direkt n8n triggern (testet die Pipeline ohne Command Center)
curl -X POST https://n8n.srv1736252.hstgr.cloud/webhook/agent2-build \
  -H "Content-Type: application/json" \
  -d @test-lead.json
```

`test-lead.json` enthält die JSON-Struktur aus Schritt 2.

---

## Status

| Stage | Test-Ergebnis |
|-------|--------------|
| VPS Runner Health | ✅ Läuft 24/7 (PM2) |
| Claude Code headless | ✅ Schreibt Files (Spizz, Luise getestet) |
| npm install + build | ✅ ~10s |
| Auto Git Push | ✅ HTTPS mit Token |
| Auto Vercel Link | ✅ Project wird automatisch erstellt |
| Vercel Deploy | ✅ ~12s |
| End-to-End Pipeline | ✅ 15-25s total (ohne Claude) / ~10min (mit Claude) |

**Live Demos:**
- https://spizz-leipzig.vercel.app (manuell + deploy)
- https://luise-leipzig.vercel.app (Claude Code + deploy, vollautonom)

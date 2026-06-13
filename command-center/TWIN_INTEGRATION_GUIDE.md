# TWIN Integration Guide
### PDSTUDIO Command Center — ElevenLabs Conversational AI

---

## 1. Agent ID eintragen

**Datei:** `command-center/.env`

```env
VITE_ELEVENLABS_AGENT_ID=agent_7101ktxvqktvfm2ta3rdgrpds3bv
```

Wo du die Agent ID findest:
1. ElevenLabs Dashboard → Agents → TWIN PEPE
2. Rechts oben: Agent ID anzeigen / kopieren

Fallback: Wenn die Variable nicht gesetzt ist, greift der Hardcode in `TwinContext.jsx` auf `agent_7101ktxvqktvfm2ta3rdgrpds3bv` zurück.

---

## 2. Public Key eintragen (Phase 2 — optional)

**Datei:** `command-center/.env`

```env
VITE_ELEVENLABS_PUBLIC_KEY=your_public_key_here
```

Der Public Key wird für server-signierte Tokens benötigt (wenn du den Agent auf `private` stellst und sichere Sessions brauchst). Aktuell läuft TWIN im Public-Modus — kein Public Key nötig.

Wo du ihn findest:
1. ElevenLabs Dashboard → API Keys → Public Key

---

## 3. Wie ElevenLabs verbunden wird

**Entry Point:** `src/components/Twin/TwinContext.jsx`

```
TwinProvider (App.jsx Root)
  └─ useConversation(@elevenlabs/react)
       ├─ onConnect, onDisconnect, onMessage, onError
       ├─ startSession({ agentId, connectionType: 'webrtc' })
       └─ endSession()
```

**Verbindungsfluss:**
1. User klickt TwinVoiceOrb
2. Browser fragt nach Mikrofon-Permission (`getUserMedia`)
3. `conversation.startSession()` wird aufgerufen
4. WebRTC-Verbindung zu ElevenLabs aufgebaut
5. `status` wechselt: `disconnected` → `connecting` → `connected`
6. Alle Nachrichten fließen durch `onMessage` → `messages` State in TwinContext
7. Alle Komponenten greifen via `useTwin()` auf Status, Nachrichten, Aktionen zu

**Kontext an TWIN senden (nicht-unterbrechend):**
```javascript
const { sendAgentContext } = useTwin()
sendAgentContext(agentId, executionStatus, leadCount)
// → ruft conversation.sendContextualUpdate(text) intern auf
```

---

## 4. Komponentenstruktur

```
src/components/Twin/
  TwinContext.jsx          ← Zentraler State, ElevenLabs Hook
  TwinCore.jsx             ← Großer visueller Orb (Jarvis-Stil)
  TwinVoiceOrb.jsx         ← Kompakter floating Orb (bottom-right)
  TwinTranscriptPanel.jsx  ← Nachrichten-Verlauf
  TwinConversationPanel.jsx← Vollbild-Overlay (TwinCore + Transcript)
  TwinStatusIndicator.jsx  ← Nav Bar Chip
  index.js                 ← Barrel Export

src/services/twin/
  agentStatus.js           ← Agent Status Stub
  leadScanner.js           ← Lead-Scanning Stubs
  revenue.js               ← Umsatz-Stub
  workflowErrors.js        ← Workflow-Fehler Stub
```

---

## 5. n8n Webhooks anbinden (Phase 2)

Sobald die n8n TWIN-Workflows gebaut sind, ersetze die Mock-Returns in `src/services/twin/`.

**Ziel-Architektur:**

```
ElevenLabs Tool Calling → TwinContext (client tool handler)
                                ↓
                       services/twin/*.js
                                ↓
                       /api/twin/* (Vercel proxy)
                                ↓
               https://n8n.srv1736252.hstgr.cloud/webhook/twin/*
```

**Schritt 1:** n8n Workflows für jeden Endpoint bauen (TWIN_MASTER_DOCUMENT.md, Teil 5)

**Schritt 2:** Vercel API-Route als Proxy hinzufügen:
```
api/twin/agent-status.js   → proxy zu n8n /webhook/twin/agent-status
api/twin/today-leads.js    → proxy zu n8n /webhook/twin/today-leads
api/twin/best-leads.js     → proxy zu n8n /webhook/twin/best-leads
api/twin/revenue.js        → proxy zu n8n /webhook/twin/revenue-summary
api/twin/errors.js         → proxy zu n8n /webhook/twin/workflow-errors
api/twin/lead-scan.js      → proxy zu n8n /webhook/twin/lead-scan (POST)
```

**Schritt 3:** Mock-Returns in services/twin/* durch `fetch('/api/twin/...')` ersetzen

**Schritt 4:** Tool-Calling in ElevenLabs Agent konfigurieren:
1. ElevenLabs Dashboard → Agents → TWIN PEPE → Tools
2. Für jede Funktion aus TWIN_MASTER_DOCUMENT.md Teil 5 eine Tool-Definition anlegen
3. Server URL: `https://command-center-lac-one.vercel.app/api/twin/`
4. Authentifizierung: Bearer Token (Vercel env var)

---

## 6. ElevenLabs Agent Konfiguration

**System Prompt:** Den vollständigen Prompt aus `TWIN_MASTER_DOCUMENT.md` Teil 4 in den Agent einfügen.

1. ElevenLabs Dashboard → Agents → TWIN PEPE → Settings
2. System Prompt ersetzen
3. Voice: Geklonter Voice Clone auswählen
4. Language: Deutsch (de)
5. First Message: `"TWIN online. Bereit."`

---

## 7. Vercel Environment Variables

Damit die Agent ID im Deployment verfügbar ist:

```bash
npx vercel env add VITE_ELEVENLABS_AGENT_ID production
# Wert: agent_7101ktxvqktvfm2ta3rdgrpds3bv
```

Oder: Vercel Dashboard → Project → Settings → Environment Variables

---

## Aktuelle Status

| Komponente | Status |
|---|---|
| ElevenLabs React SDK installiert | ✅ |
| TwinContext (zentraler State) | ✅ |
| TwinVoiceOrb (floating orb) | ✅ |
| TwinCore (visueller Kern) | ✅ |
| TwinTranscriptPanel | ✅ |
| TwinConversationPanel (Overlay) | ✅ |
| TwinStatusIndicator (Nav) | ✅ |
| Agent City → TWIN Context | ✅ |
| Service Stubs (agentStatus, leads, revenue, errors) | ✅ Mock |
| n8n Webhooks für Tool Calling | ⏳ Phase 2 |
| Server-signierte Tokens (Public Key) | ⏳ Phase 2 |
| Voice Clone in Agent eingebaut | ⏳ Manuell |
| System Prompt eingefügt | ⏳ Manuell |

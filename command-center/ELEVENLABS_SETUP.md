# ElevenLabs Voice Bridge — Setup-Anleitung

> Diese Anleitung verbindet deinen ElevenLabs Voice-Agent mit der PDSTUDIO Tool-Registry.
> Nach Setup kannst du per Sprache reale Pipeline-Aktionen ausführen (qualify, factCheck, mailGenerate, premiumPrompt, etc.).

## Voraussetzungen

- ElevenLabs Account mit Conversational AI / Voice Agents Zugang
- Deployment unter `https://command-center-lac-one.vercel.app` läuft (oder eigene Domain)
- `VERCEL_TOKEN` ist gesetzt, App ist deployed mit `api/twin-tool.js`

## Test ob Endpoint live ist

```bash
curl -X POST https://command-center-lac-one.vercel.app/api/twin-tool \
  -H "Content-Type: application/json" \
  -d '{"intent": "show_next_action"}'
```

Erwartete Response: `{ ok, intent, tool, spoken, requiresConfirmation? }`.

Wenn Response = 405 oder 404: API-Route ist nicht deployed. Prüfe Vercel Build-Logs.

## Schritt 1 — Im ElevenLabs Dashboard

1. **Dashboard → Conversational AI → Agents → "TWIN PEPE" auswählen** (Agent-ID aus `.env`: `agent_7101ktxvqktvfm2ta3rdgrpds3bv`)
2. **Tools → Add Tool → Webhook**
3. **Configuration:**

| Feld | Wert |
|---|---|
| Name | `pdstudio_action` |
| Description | `Führt eine PDSTUDIO Command-Center Aktion aus (Lead qualifizieren, FactCheck, Mail generieren, Build-Prompt etc.). Nutze immer wenn der User eine konkrete Aktion verlangt statt nur Information.` |
| Method | `POST` |
| URL | `https://command-center-lac-one.vercel.app/api/twin-tool` |
| Wait for response | `Yes` (max 30s — wegen Poe-Calls) |
| Auth | None (oder Header-Token wenn du Security ergänzt) |

4. **Request Body Schema (JSON-Schema):**

```json
{
  "type": "object",
  "required": ["intent"],
  "properties": {
    "intent": {
      "type": "string",
      "enum": [
        "run_lead_qualifier",
        "run_fact_check",
        "analyze_assets",
        "run_pre_build_gate",
        "generate_concept",
        "show_next_action",
        "explain_blocker",
        "generate_mail_drafts",
        "build_premium_prompt",
        "build_standard_prompt",
        "generate_poe_hero",
        "run_sales_audit",
        "start_build",
        "send_mail",
        "archive_site",
        "run_full_pipeline"
      ],
      "description": "Welche Aktion ausführen. Wähle anhand des User-Befehls."
    },
    "lead_id": {
      "type": "string",
      "description": "Lead-ID falls bekannt aus dem Gespräch (z.B. L_RICKS_001)."
    },
    "confirmed": {
      "type": "boolean",
      "description": "true wenn User explizit 'bestätigen' gesagt hat nach einer requiresConfirmation Antwort."
    },
    "params": {
      "type": "object",
      "description": "Optional: zusätzliche Parameter (url für sales_audit, variant für mail etc.)"
    }
  }
}
```

5. **Response Handling — wie Twin antworten soll:**

Bei `requiresConfirmation: true`: Twin liest `spoken` vor, fragt User „bestätigen?". Bei Bestätigung: rufe Tool erneut auf mit `confirmed: true`.

Bei `ok: true`: Twin liest `spoken` vor.

Bei `ok: false` und kein `requiresConfirmation`: Twin liest `spoken` als Fehler vor.

## Schritt 2 — System-Prompt Erweiterung in ElevenLabs

Ergänze im TWIN System-Prompt (in TwinContext.jsx steht der Voice-System-Prompt):

```text
TOOL-NUTZUNG:
Du hast Zugriff auf das Tool "pdstudio_action". Nutze es IMMER wenn der User
eine konkrete Aktion verlangt — nicht nur erklären, sondern AUSFÜHREN.

Intent-Erkennung:
- "prüfe diesen Lead" / "qualifizier" / "starte A1" → intent: run_lead_qualifier
- "fact check" / "fakten prüfen" / "starte A6" → intent: run_fact_check
- "nächste Aktion" / "was soll ich machen" → intent: show_next_action
- "warum blockiert" → intent: explain_blocker
- "generiere Mails" / "3 Mails" / "starte A4" → intent: generate_mail_drafts
- "premium prompt" / "design analyse" → intent: build_premium_prompt
- "hero neu" / "poe hero" → intent: generate_poe_hero
- "build starten" / "deploy" → intent: start_build (immer Bestätigung!)
- "mail senden" / "verschicken" → intent: send_mail (per Voice gesperrt — sag das)
- "site löschen / archivieren" → intent: archive_site (per Voice gesperrt)

Bestätigungs-Flow:
1. User fragt Aktion an
2. Du rufst Tool mit confirmed=false
3. Wenn Response `requiresConfirmation: true`: lies `spoken` vor und warte auf Bestätigung
4. Bei "ja"/"bestätigen": rufe Tool erneut mit confirmed=true
5. Bei "nein"/"abbrechen": gib feedback "Abgebrochen"

Wenn Response `ok: true`: lies `spoken` vor. Niemals erfundene Daten — nur was im Tool-Result steht.
Wenn Response `ok: false` ohne requiresConfirmation: Fehler erklären, Lösung vorschlagen.
```

## Schritt 3 — Smoke Test im ElevenLabs Playground

1. Im Agent-Dashboard → **Test** → mit Mikrofon
2. Sage: **„Pepe, prüfe diesen Lead"**
3. Erwartet: Twin macht einen Tool-Call mit `intent: "run_lead_qualifier"`
4. Response sollte `{ ok: true, tool: "lead.qualify", spoken: "Lead-Score X, ..." }` enthalten
5. Twin liest spoken vor

Bei Fehler:
- 401: kein Auth gesetzt (wenn du Auth ergänzt hast)
- 404/405: Route nicht deployed → Vercel-Build prüfen
- Timeout: Poe-Call dauert > 30s → Wait-Timeout in ElevenLabs erhöhen

## Status-Werte (intern verfolgt in TwinControlPanel)

| Status | Bedeutung |
|---|---|
| `not_configured` | API-Route nicht deployed oder ENV-Var fehlt |
| `webhook_ready` | API-Route antwortet, ElevenLabs noch nicht konfiguriert |
| `tested` | Mindestens ein erfolgreicher End-to-End Call dokumentiert |
| `live` | Aktive Voice-Conversation läuft Tool-Calls erfolgreich aus |

## Sicherheit

- `send_mail` und `archive_site` sind **per Voice gesperrt** (`blockedByVoice: true`). Selbst wenn User per Sprache anweist: API antwortet mit Block und erklärt warum.
- Expensive Tools (3x Poe-Call für Mails, Premium-Prompt mit Poe-Analyse) brauchen `confirmed: true` — Twin muss zweimal nachfragen.
- Destructive Tools (`build.trigger`) brauchen ebenfalls Bestätigung.

## Beispiel-Calls

### Safe (direkt ausführbar)
```bash
curl -X POST https://command-center-lac-one.vercel.app/api/twin-tool \
  -H "Content-Type: application/json" \
  -d '{"intent": "show_next_action", "lead_id": "L_RICKS_001"}'
```

### Expensive (braucht confirmed)
```bash
# Step 1: triggert Bestätigungsanfrage
curl -X POST .../api/twin-tool \
  -d '{"intent": "generate_mail_drafts", "lead_id": "L_RICKS_001"}'
# Response: { ok: false, requiresConfirmation: true, spoken: "Soll ich..." }

# Step 2: nach User-Bestätigung
curl -X POST .../api/twin-tool \
  -d '{"intent": "generate_mail_drafts", "lead_id": "L_RICKS_001", "confirmed": true}'
```

### Blocked (per Voice gesperrt)
```bash
curl -X POST .../api/twin-tool \
  -d '{"intent": "send_mail", "lead_id": "L_RICKS_001", "confirmed": true}'
# Response: { ok: false, blocked: true, spoken: "Per Sprache nicht erlaubt..." }
```

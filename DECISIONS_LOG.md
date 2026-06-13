# PDSTUDIO — Entscheidungs-Log

> Historische Architekturentscheidungen. Erklärt warum das System so ist wie es ist.
> "Historisch" = diese Entscheidung wurde getroffen und ist final (kein Diskussionsbedarf).
> "Aktiv" = diese Entscheidung ist noch in Kraft und relevant für aktuelle Arbeit.

---

## [AKTIV] Von 7-Agenten-Auto-Pipeline zu 6-Agenten-Manuell

**Entscheidung:** Die automatische 7-Agenten-Pipeline (A1→A7 vollautomatisch) wurde durch eine manuelle 6-Agenten-Architektur ersetzt, bei der Pepe pro Lead entscheidet welcher Agent läuft.

**Warum:** Die Auto-Pipeline war fehleranfällig wenn ein früher Agent Fehler produzierte — der Rest der Pipeline lief mit schlechten Daten weiter. Manuell bedeutet: Pepe sieht das Ergebnis jedes Schritts und entscheidet ob der nächste Schritt sinnvoll ist.

**Was sich geändert hat:**
- A7 (Website Builder) ist kein eigenständiger Agent im UI mehr — wird intern von A2 aufgerufen
- A2, A3, A4, A5, A6 haben neue Rollen (Builder, Polish, Writer, Pricing, FactCheck)
- Die alten A2–A5 (Text/Image Extractor, Data Validator, Concept Architect) sind in die neuen Agenten integriert oder durch Sheets-Daten ersetzt

**Stand:** Implementiert, deployed (Stand Juni 2026)

---

## [AKTIV] CORS-Proxy-Pattern (Vercel Serverless Functions)

**Entscheidung:** Alle n8n-Aufrufe aus dem Browser gehen über Vercel Serverless Functions in `/api/`, nie direkt.

**Warum:** Browser blockiert Cross-Origin-Requests zu `n8n.srv1736252.hstgr.cloud` (CORS-Policy). Direkter Fetch aus React schlägt immer fehl. Lösung war Vercel als transparenter Proxy.

**Pattern:** `Browser → /api/proxy.js (Vercel) → n8n VPS`

**Wann entdeckt:** Früh in der Entwicklung, nach dem ersten Deployment auf Vercel wo alle Buttons "Network Error" zeigten. Mehrere Stunden Debugging.

**Konsequenz für zukünftige Arbeit:** Jeder neue n8n-Endpoint der im Browser genutzt wird, bekommt SOFORT einen Proxy. Nicht erst wenn der Fehler auftritt.

---

## [AKTIV] neverError: true auf allen Poe-API-Nodes

**Entscheidung:** Alle n8n-Nodes die Poe API aufrufen haben `neverError: true` gesetzt.

**Warum:** Ohne diese Einstellung crashed der gesamte n8n-Workflow bei einem Poe-Fehler (HTTP 500, Rate Limit, Cloudflare-Block). Das bedeutete: kein Status-Update im Sheet, Lead verschwand aus der Pipeline, manuelles Nachschauen in n8n-Execution-Log nötig. Mit `neverError: true` fangt der Workflow den Fehler ab, schreibt `status: "error"` ins BUILD-Sheet und bleibt in einem definierten Zustand.

**Wann entdeckt:** Nach mehreren Produktions-Ausfällen wo Leads "spurlos verschwanden" weil der Workflow gecrasht war. Erst durch Execution-Log-Analyse klar geworden.

---

## [AKTIV] Vercel Framework: null für statische Sites

**Entscheidung:** Bei Vercel-Deployments für generierte Demo-Sites wird immer `"framework": null` und `"buildCommand": null` im API-Payload gesetzt.

**Warum:** Vercel cached die Framework-Einstellungen pro Projekt. Wenn ein Projekt einmal mit `framework: "vite"` deployed wird und dann als statisches HTML neu deployed wird, schlägt der Build fehl — Vercel sucht `package.json` und führt `npm run build` aus, obwohl keine Build-Step mehr existiert. Fix: Framework und BuildCommand bei jedem Deployment explizit auf `null` setzen.

**Wann entdeckt:** Stundenlanger Debug-Session. Fehlermeldung war irreführend ("Build failed" ohne klaren Grund). Lösung war nicht in der Dokumentation.

---

## [AKTIV] 7-Zeichen Timestamp in Vercel-Projektnamen

**Entscheidung:** Vercel-Projektnamen für Demo-Sites bekommen einen 7-Zeichen-Timestamp-Suffix: `ml-{slug}-{timestamp}` where `timestamp = Date.now().toString(36).slice(-7)`.

**Warum:** Vercel-Projektnamen haben ein Zeichen-Limit. Volle Timestamps oder UUID als Suffix bringen den Namen über das Limit. 7 Zeichen Base-36 sind eindeutig genug für die Anzahl Deployments in diesem System und bleiben innerhalb der Limit.

---

## [AKTIV] DEPLOYMENT_NOT_FOUND: Wait statt neues Deployment

**Entscheidung:** Wenn Vercel-Verify-Schritt `DEPLOYMENT_NOT_FOUND` zurückgibt: 10s warten und retry, KEIN neues Deployment starten.

**Warum:** Der Fehler entsteht durch Race Condition — der Verify-Schritt läuft los bevor Vercel das Deployment vollständig registriert hat (Propagation). Neues Deployment starten erzeugt Duplikate und lässt das ursprüngliche Deployment in einem unbekannten Zustand.

**Max Retries:** 3x × 10s Abstand, dann Fehler-Status setzen und manuell prüfen.

---

## [HISTORISCH] MONEYLAN → PDSTUDIO Rebranding

**Entscheidung:** Externe Marke heißt PDSTUDIO. MONEYLAN bleibt als interner Projektname (Ordner-Name, Repository-Name) aber erscheint nicht mehr in der UI.

**Warum:** MONEYLAN klang zu sehr nach einem Tool-Namen. PDSTUDIO ist die Studio-/Agentur-Marke unter der Pepe nach außen auftritt. Kunden sehen PDSTUDIO.

**Status:** In der UI überall auf PDSTUDIO umgestellt. Intern (Ordner, Git-History, Docs) bleibt MONEYLAN als Bezeichnung.

---

## [HISTORISCH] Google Sheets statt Supabase als primäre DB

**Entscheidung:** Google Sheets ist die primäre Daten-Datenbank für die Pipeline, nicht Supabase.

**Warum:** Sheets war schneller einzurichten, ist für Pepe direkt einsehbar und editierbar ohne DB-Client, und ermöglicht einfaches Debugging ("ich sehe genau was drin steht"). Supabase ist für persistente Daten geplant (TWIN Memory, Kunden-Profile) aber ersetzt Sheets (noch) nicht.

**Einschränkung:** Arrays werden als `|`-getrennter Text gespeichert — kein echter Array-Support in Sheets. Das führt zu Parsing-Code an mehreren Stellen.

**Roadmap:** Supabase langfristig als strukturierte Zwischenschicht oder vollständiger Ersatz. Noch nicht priorisiert.

---

## [HISTORISCH] Poe API statt direkte Anthropic API

**Entscheidung:** LLM-Calls gehen über Poe API (`api.poe.com/v1/chat/completions`), nicht direkt über die Anthropic API.

**Warum:** Poe API war zum Zeitpunkt der Entscheidung einfacher zugänglich und ermöglicht denselben OpenAI-kompatiblen Endpoint-Format den n8n nativ unterstützt. Kein zusätzlicher API-Key-Management.

**Risiko:** Poe führt gelegentlich Cloudflare-Blocking durch, was `external_blocker` Status in A2 auslöst. Temporär, löst sich meist nach 5–10 Minuten.

---

## [HISTORISCH] n8n self-hosted statt Zapier/Make

**Entscheidung:** n8n auf eigenem Hostinger VPS, nicht Zapier oder Make.

**Warum:** Volle Kontrolle über die Workflow-Engine, kein Execution-Limit, keine Kosten per Execution, direkter Zugriff auf Filesystem (`/files`-Volume für Bilder), Docker-basiert und damit portierbar. Zapier/Make hätten monatliche Kosten proportional zu Executions erzeugt.

**Nachteil:** Selbst-gehostet = Selbst-gewartet. n8n-Updates, Container-Restarts, VPS-Monitoring liegt bei Pepe.

---

## [HISTORISCH] ElevenLabs für TWIN Voice

**Entscheidung:** TWIN nutzt ElevenLabs Professional Voice Clone mit Pepes Stimme.

**Warum:** Voice-first Interaktion ist der natürlichste Interface-Kanal für System-Monitoring. Pepes geklonte Stimme macht TWIN zu einem echten "digitalen Klon" statt einem Allgemein-Assistenten. ElevenAgents bietet Function Calling für n8n-Webhook-Integration.

**Status:** Voice Clone in ElevenLabs vorhanden. Agent-ID: `agent_7101ktxvqktvfm2ta3rdgrpds3bv`. TWIN Webhooks noch nicht vollständig gebaut.

---

## [HISTORISCH] React + Vite für Demo-Websites (statt Next.js oder static HTML)

**Entscheidung:** Demo-Websites sind React + Vite + Tailwind, nicht Next.js und nicht plain HTML.

**Warum:** React ermöglicht Interaktivität (Modal, Sticky Banner, dynamische Öffnungszeiten). Vite baut schnell (90s für komplettes Deployment). Next.js wäre Overkill für statische Demo-Sites und erfordert Node.js auf Vercel (teurer, langsamer Cold Start). Plain HTML wäre zu limitiert für die benötigten interaktiven Elemente.

**Trade-off:** React + Vite braucht Build-Schritt. Das ist der Grund warum `framework: null` explizit gesetzt werden muss wenn wir nicht über den Vite-Build-Step gehen wollen.

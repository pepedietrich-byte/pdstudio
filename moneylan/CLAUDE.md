# MONEYLAN — Claude Code Kontext

## Projektziel
Automatisierte Pipeline aus 6 n8n-Agenten, die für lokale KMU in Leipzig (Start: Restaurants/Cafés)
Demo-Websites als Kaltakquise-Material erstellt. Jeder Agent wird als n8n-Workflow über die
n8n public REST API gebaut und deployt.

## n8n-Umgebung
- Self-hosted, Container: n8n-n8n-1
- Base URL: https://n8n.srv1736252.hstgr.cloud
- API: POST/GET /api/v1/workflows mit Header X-N8N-API-KEY
- Beschreibbares Volume: /files (Host: /local-files)
- Asset-Pfade: /files/runs/{lead_id}/assets/

## Credentials (liegen in n8n, nie hardcoden)
- Oxylabs: Basic Auth (nicht Custom Auth — das war ein Bug)
- Poe/Claude: Header-Auth, Header-Name "Authorization", Wert "Bearer KEY"
- Google Sheets: Service Account
- Google Places + PageSpeed: API-Key im Query/Header
- Supabase: falls genutzt

## LLM in den n8n-Workflows
- Endpoint: https://api.poe.com/v1/chat/completions
- Modell: Claude-Sonnet-4.6
- Temperature: 0 für strukturierte Outputs
- Vision (Bilder): als Base64-Data-URI senden (verifiziert, funktioniert)

## Tech-Stack für Demo-Websites (Agent 6 Output)
- React + Vite, Tailwind CSS
- Statisch, deploybar auf Vercel (privat, noindex)

## Kritische Regeln
- Credentials NIE hardcoden — immer n8n-Credential-Namen referenzieren
- Jeder externe HTTP-Call: continueOnFail + Timeout gesetzt
- Nie harter Workflow-Stop bei Einzelfehler
- Score-Skala: Agent-1-Score ist INVERS (hoch = schlechte Website = guter Lead)
- Die 90er-Schwelle für die fertige Demo-Website ist eine NORMALE Qualitätsskala — nicht dieselbe
- do_not_invent: Öffnungszeiten, Preise, Menü-Items, Adresse, Telefon, Awards nie erfinden
- noindex + Demo-Hinweis auf jeder gebauten Website Pflicht

## Arbeitsweise
- Erst Plan zeigen, dann auf Bestätigung warten bevor Änderungen
- Ein Agent nach dem anderen — nie mehrere gleichzeitig
- Nach jedem Agenten: Testlauf mit echten Leipzig-Leads, Ergebnis berichten
- Jede n8n-Workflow-JSON auch lokal als Datei speichern

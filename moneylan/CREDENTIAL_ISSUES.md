# MONEYLAN — Offene Credential-Issues

Diese Credentials müssen in n8n konfiguriert/aktiviert werden, bevor die Pipeline
mit echten Daten läuft. Die Workflow-Logik ist korrekt — nur die externen APIs
sind noch nicht aktiv oder haben falsche Zugangsdaten.

---

## 0. APIFY — AGENT 3 (Google Maps Scraper) ✅ KONFIGURIERT

**Status:** Token gesetzt, Agent 3 nutzt `compass~crawler-google-places`
**n8n Credential:** `APIFY` (ID: tm19u1AY1NRoecDz) — httpHeaderAuth
- Header Name: `Authorization`
- Header Value: `Bearer apify_api_****` (in n8n Credential hinterlegt)
**Was Agent 3 scrapet:** Restaurantname + "Leipzig" → 15 Google Maps Fotos → Vision-Analyse → IMAGES-Sheet
**Ergebnis pro Lauf:** hero_url, logo_url (falls vorhanden), galerie_urls, farbpalette, bild_stil

---

## 1. Google PageSpeed Insights API — ALLE AGENTEN (A1)

**Symptom:** HTTP 403 "Requests to this API pagespeedonline method are blocked"
**Was fehlt:** Die PageSpeed Insights API muss im Google Cloud Project des API-Keys aktiviert werden
**Wo aktivieren:** [Google Cloud Console → APIs & Services → PageSpeed Insights API → Aktivieren](https://console.cloud.google.com/apis/library/pagespeedonline.googleapis.com)
**API-Key der bereits in Workflows verwendet wird:** `AIzaSy****` (in n8n Credential hinterlegt)
**Betroffene Agenten:** Agent 1 (PSI + Vision-Prep)

---

## 2. Oxylabs — AGENT 1, 2, 3

**Symptom:** Leeres JSON `{}` zurückgegeben / "Cannot read properties of undefined (reading 'data')"
**Was fehlt:** Oxylabs Basic Auth Credential `OXY` in n8n hat vermutlich falschen Username/Password — oder das Konto ist nicht aktiv
**n8n Credential-Name:** `OXY` (httpBasicAuth, ID: DVF4iIIeEDvqPjs9)
**Wo prüfen:** In n8n → Credentials → OXY → Username/Password gegen Oxylabs Dashboard prüfen
**Oxylabs Dashboard:** https://dashboard.oxylabs.io
**Betroffene Agenten:** Agent 1 (Oxylabs: HTML holen), Agent 2 (Oxylabs: Startseite holen1, Oxylabs: Seite scrapen), Agent 3 (Oxylabs: Startseite holen, Oxylabs: Seite scrapen)
**Impact:** Kein HTML → kein technischer Audit → lead_id bleibt leer → file_write_failed

---

## 3. Google Sheets — AGENT 2

**Symptom:** "Column names were updated after the node's setup"
**Was fehlt:** Google Sheet hat neue Spalten nicht → Sheet muss manuell erweitert werden
**Sheet-ID:** `1Fjw6K4MY-H3KfsM4CrZ9BAbDQ0cOKosqAGVsqqftpjc`
**Tab:** `CONTENT`
**Neue Spalten die fehlen:** `missing_fields`, `confidence`, `warnings`, `generated_at`, `atmosphaere`, `zielgruppe`, `ton_beschreibung`
**Action:** In Google Sheets CONTENT-Tab neue Spaltenköpfe in Zeile 1 eintragen
**Betroffene Agenten:** Agent 2

---

## 4. Google Sheets LEADS/VALIDATION/CONCEPT/BUILD Tabs — ALLE AGENTEN

**Was fehlt:** Diese Tabs existieren vermutlich noch nicht im Sheet
**Action:** In Google Sheets folgende Tabs anlegen (falls nicht vorhanden):
- `LEADS` — Agent 1 schreibt hierhin
- `CONTENT` — Agent 2 schreibt hierhin  
- `IMAGES` — Agent 3 schreibt hierhin
- `VALIDATION` — Agent 4 schreibt hierhin
- `CONCEPT` — Agent 5 schreibt hierhin
- `BUILD` — Agent 6 schreibt hierhin

---

---

## 5. Agent 7 — Manuelle Schritte vor erstem Testlauf

**Node "LLM: Website bauen" — Credential manuell setzen:**
- n8n öffnen → Workflow "MONEYLAN Agent 7 — Website Builder"
- Node "LLM: Website bauen" öffnen
- Authentication → Generic Credential Type → `Header Auth account` (ID: UJ5khOPRpBDsxk6m)

**Vercel Bearer Credential (n8n) — GELÖST ✓**
- Token ist konfiguriert und funktioniert
- n8n Credential: "VERCEL TOKEN" (ID: z8urTXySVsX8YQXE)
- Agent 7 deployt erfolgreich auf Vercel

**BUILD-Sheet Spalten anlegen (falls noch nicht vorhanden):**
`demo_url`, `build_status`, `website_built_at`, `file_count`, `site_dir`

**Webhook URL:** `https://n8n.srv1736252.hstgr.cloud/webhook/agent7-start`
**Workflow ID:** `nTVZLymUEYRt1W86`

---

## Was FUNKTIONIERT (trotz obiger Issues)

- ✅ Google Places API → Leipzig-Restaurants werden gefunden
- ✅ Poe/Claude Sonnet Vision → Screenshot-Analyse läuft
- ✅ Poe/Claude Sonnet LLM → Text-Extraktion + Konzept läuft
- ✅ Scoring-Logik → Score wird korrekt berechnet
- ✅ Schema v2.0 → Lead-Objekte werden korrekt gebaut
- ✅ Workflow-Grundstruktur aller 6 Agenten ist deployed und funktioniert

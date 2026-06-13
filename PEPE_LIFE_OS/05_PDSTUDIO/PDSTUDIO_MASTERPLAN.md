---
date: 2026-06-13
status: active
rag_priority: 5
twin_context: ground_truth
---

# PDSTUDIO MASTERPLAN

> Vollständige Referenz für TWIN. Wer, was, wie, warum.

---

## Was ist PDSTUDIO

PDSTUDIO ist eine manuelle KI-Command-Zentrale für Restaurant-Website-Akquise.  
Früher: MONEYLAN (automatische Pipeline — zu unzuverlässig).  
Heute: Pepe entscheidet pro Lead welcher Agent läuft.

---

## Geschäftsmodell

**Zielgruppe:** Restaurants in Deutschland mit schlechten Websites  
**Prozess:** Schlechte Website finden → Demo bauen → pitchen → Abo verkaufen  
**Produkt:** Premium Restaurant-Website als monatliches Abo  
**Preisrahmen:** ca. €590 Min / €890 Empfehlung / €1.200+ Premium (pro Monat)

---

## Technischer Stack

| Komponente | Tool | Status |
|------------|------|--------|
| Frontend | React + Vite | live |
| Automation | n8n (Hostinger VPS) | aktiv |
| Daten | Google Sheets | aktiv |
| Deployment | Vercel | aktiv |
| AI Text | Poe API (Claude, Gemini) | aktiv |
| AI Bilder | Poe / FLUX | teilweise |
| Voice Agent | ElevenLabs (TWIN) | aktiv |
| Build-Tool | Claude Code | manuell |

---

## Die 6 Agenten (A1-A6)

**A1 — Lead Qualifier**  
Analysiert Restaurant-Website technisch. Score 0-100, Confidence, Pain Points.  
Nutzt: n8n Webhook (A1)

**A2 — Claude Code Builder**  
Generiert Premium-Website via Claude Code. Deployt auf Vercel.  
Designstandard: Project Napoli Premium + taste-skill + emilkowalski  
Nutzt: Claude Code (lokal/manuell) + A7-Webhook als Fallback

**A3 — Polish Agent**  
Bilder via Poe/Nano Banana. CSS + Animationen verbessern.  
Status: needs_connection (Poe Image Proxy fehlt)

**A4 — Human Writer**  
Verkaufs-E-Mails, DMs, Follow-ups auf Deutsch. Kein KI-Standardtext.  
Nutzt: Poe API via /api/pepe-ask

**A5 — Pricing Agent**  
Preisberechnung client-side. Min/Empfehlung/Premium + Closing-Chance.  
Nutzt: client-side Logik

**A6 — Fact Checker**  
URL, Telefon, E-Mail, Name validieren. Trust Score + Versandstatus.  
Nutzt: client-side (URL-Erreichbarkeit braucht noch needs_webhook)

---

## Command Center

URL: https://command-center-lac-one.vercel.app  
Zugang: Passwort → nicht hier gespeichert

Features:
- Active Lead System (Lead aktivieren, Agenten starten)
- Lead-Archiv (Score < 50 archivieren)
- 8 KPI-Kacheln (echte Daten)
- Agent City (interaktive 6-Agenten-Karte)
- TWIN PEPE Integration (ElevenLabs Voice)

---

## Aktueller Stand (2026-06-13)

- Command Center deployed und funktionsfähig
- A1, A2, A4, A5, A6 startbar
- A3 noch nicht vollständig verbunden
- Noch kein zahlender Kunde
- Nächster Schritt: erste Outreach-Kampagne

---

## Lernpunkte aus alter Architektur

- Automatische Pipeline (A1→A7 Kette) war unzuverlässig
- Zu viele Agenten gleichzeitig = zu viele Fehlerquellen
- Manuell ist besser: Pepe behält Kontrolle und Qualität
- Claude Code > Poe API für Premium-Websites

---

#pdstudio #masterplan #agents #ground-truth

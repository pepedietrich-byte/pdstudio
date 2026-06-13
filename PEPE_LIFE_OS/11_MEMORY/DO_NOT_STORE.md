---
date: 2026-06-13
status: active
rag_priority: none
twin_context: none
---

# DO NOT STORE

> Explizite rote Linie. Diese Dinge gehören NICHT in den Vault und NICHT in ElevenLabs RAG.

---

## Absolutes Verbot

Diese Daten dürfen NIEMALS in diesem Vault gespeichert werden:

- **Passwörter** (Command Center, Vercel, n8n, iCloud, alles)
- **API Keys** (Poe, ElevenLabs, OpenAI, Anthropic, Google, etc.)
- **Tokens** (Bearer Tokens, Session Tokens, JWT)
- **Webhook-URLs mit eingebetteten Secrets**
- **Private Finanzdaten** (Kontonummern, Steuerdaten)
- **Sensible Personendaten Dritter** (Kunden, Restaurantbesitzer privat)
- **Login-Credentials** jeglicher Art

---

## Warum diese Regel

Dieser Vault wird teilweise in ElevenLabs RAG hochgeladen.  
ElevenLabs ist ein externer Dienst.  
Alles was hochgeladen wird, verlässt die lokale Umgebung.

Auch ohne RAG-Upload: Obsidian-Vaults können versehentlich gesyncronisiert werden.

---

## Wo diese Daten stattdessen hin

- Passwörter → 1Password oder Bitwarden
- API Keys → `.env` Dateien (lokal, nicht committed)
- Vercel ENV → Vercel Dashboard
- n8n Credentials → n8n Credential Store

---

## Grauzone (mit Vorsicht)

Diese Daten können genannt werden, aber nur generisch:

- Allgemeine Projektstruktur (kein Sicherheitsrisiko)
- Agentenlogik und -reihenfolge (kein Sicherheitsrisiko)
- Technischer Stack (kein Sicherheitsrisiko)
- Deploy-URLs (öffentliche URLs sind ok)

---

#memory #security #do-not-store #rules

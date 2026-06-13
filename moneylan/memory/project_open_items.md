---
name: open-items-agent-pipeline
description: Offene Punkte aus dem Agent-Bau, die am Ende durchgegangen werden müssen
metadata:
  type: project
---

Nach Agent 1 und Agent 2 Bau offene Punkte zu klären:

1. **Agent 1 Test-Lauf**: User muss in n8n UI "Test workflow" klicken → dann Execution-Results prüfen + 7 Testfälle aus Abschnitt 10 fahren
2. **Agent 1 Supabase**: Credentials (URL + Anon-Key) noch nicht konfiguriert — Supabase HTTP-Node ist Placeholder
3. **Agent 1 Dedup-Node**: Read-before-Loop (Google Sheets → Code:Dedup) noch nicht eingebaut
4. **Agent 1 ScreenshotOne**: User bestätigt ScreenshotOne als Screenshot-Dienst (Empfehlung) — aber PSI-Screenshots werden aktuell verwendet (kein externer Dienst nötig)
5. **Alle meine offenen Fragen**: User hat mit "yes" beantwortet — kein Klärungsbedarf

**Why:** User möchte Pipeline zügig bauen, offene Details am Ende in einem Block klären.
**How to apply:** Am Ende des Agent-6-Baus alle Punkte dieser Liste gesammelt vorlegen.

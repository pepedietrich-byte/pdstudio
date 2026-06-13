# PDSTUDIO — Design-Regeln

> Gilt für alle Frontend-, UI-, Dashboard-, Landing-Page-, Layout-, Animation-, und Komponenten-Änderungen.
> Kein generisches AI SaaS Template. Kein Demo-Look. Kein Basic Admin Panel.

---

## Qualitätsstandard

**Referenz:** Emil Kowalski Level of Polish
**Gefühl:** Game-inspired Interactive Control Hub
**Ziel:** Das Command Center soll sich anfühlen wie ein Premium-Betriebssystem für KI-Agenten

Jede Komponente muss diese Frage bestehen: "Wirkt das wie ein echtes Produkt oder wie ein Template?"

---

## Typografie

- **Hierarchie:** Klare visuelle Gewichtung. Ein dominantes Heading, nicht drei gleichwertige.
- **Schriftarten:** Geringer Mix. Max 2 Typefaces. Technisch + Human (z.B. monospaced für Daten, sans-serif für Fließtext).
- **Tracking:** Uppercase Labels haben weiten Letter-Spacing (0.08–0.15em).
- **Zeilenlänge:** Max 65–75 Zeichen bei Fließtext.
- **Größen:** Konsequente Skala — nicht ad-hoc.

---

## Spacing & Layout

- **Konsistente Spacing-Einheit:** 4px-Grid oder 8px-Grid — nie gemischt.
- **Weißraum ist Premium:** Lieber zu viel als zu wenig.
- **Sections haben klare Grenzen** — Padding top/bottom mind. 48px.
- **Karten:** Subtiler Border (1px rgba) + Border-Radius 8–16px. Kein harter Schatten außer bei Hover-State.

---

## Farbe

**Command Center Farbwelt:**
- Background: sehr dunkles Blau-Schwarz (`#080c14`, `#0d1117`)
- Surface: leicht aufgehelltes Blau-Grau (`#161b26`, `#1a2332`)
- Border: subtiles Blau-Weiß (`rgba(255,255,255,0.08)`)
- Text Primary: Fast-Weiß (`#e8edf4`)
- Text Secondary: Gedämpftes Blau-Grau (`#6b7a90`)
- Accent: Klares Blau (`#3b82f6`) oder Cyan (`#06b6d4`)
- Error: Gedämpftes Rot (`#ef4444` mit 70% Opacity im Background)
- Success: Gedämpftes Grün (`#22c55e`)
- Warning: Amber (`#f59e0b`)

**Niemals:** Knallbunt, Neon ohne Kontext, zu viele Farben gleichzeitig.

**Demo-Websites (restaurant-spezifisch):**
- Drenched Paletten — satte, tiefe Farben die zur Küche passen
- Traditional German: warme Erdtöne, Holz, dunkles Braun, Creme
- Modern Bistro: Clean Weiß, Anthrazit, ein starker Akzent
- Fine Dining: Schwarz, Gold, sehr zurückhaltendes Layout
- Mediterranean: Terracotta, Olivgrün, Weiß

---

## Animation

**Prinzip:** Jede Animation hat einen Zweck. Keine Dekoration ohne Funktion.

**Erlaubte Animationen:**
- Hover States: Transform scale(1.02) + opacity, duration 150–200ms, ease-out
- Panel-Reveal: Slide + Fade, duration 250–350ms, spring-easing
- Status-Updates: Kurzes Pulse (300ms) wenn sich ein Wert ändert
- Loading States: Shimmer-Skeleton, nie Spinner wenn vermeidbar
- Agent "alive"-State: Langsames, organisches Pulsieren (nicht blinkend)
- TWIN Orb: Ambient Pulse, Zustandsänderungen fließend

**Verbotene Animationen:**
- Bounce ohne Grund
- Lange Fade-Ins (>500ms) für Hauptinhalte
- Animationen die bei jedem Scroll-Event auslösen
- Spinning Loader als Haupt-Loading-Indikator
- Parallax auf mobil

**Performance-Regel:** Nur `transform` und `opacity` animieren. Keine Layout-Eigenschaften (width, height, top, left).

---

## TWIN Voice Orb

Das zentrale Interface-Element des Command Centers.

**Visual:**
- Kreisförmig, 120–150px Durchmesser
- Ambient-Pulse Animation (langsam, ca. 3s Zyklus)
- Position: prominent im Control-Tab, visuell zentral

**Zustandsfarben:**
| Zustand | Farbe | Animation |
|---------|-------|-----------|
| Idle | Dunkles Blau mit Glow | Langsames Pulsieren (3s) |
| Listening | Hellblau | Schnelleres Pulsieren (1.5s) |
| Speaking | Grün-Schimmer | Reaktiv auf Audio-Amplitude |
| Error | Gedämpftes Rot | Stilles Blinken (2s) |
| Autopilot | Amber | Gleichmäßiger Puls (4s) |

**Mikrofon-Button:** Direkt unterhalb, minimalistisch, kein Text. Push-to-Talk.

**Transkript:** Rechts neben oder unterhalb des Orbs — scrollbare Textanzeige der letzten TWIN-Nachrichten.

---

## Agent City Vision

**Kernidee:** Jeder Agent ist visuell repräsentiert als aktiver "Bereich" im Command Center.

**Jeder Agent-Bereich enthält:**
- Eine kleine Worker/Mini-Charakter-Figur (SVG-Animation) die sich bewegt wenn der Agent läuft
- Statusbalken mit letztem Execution-Status
- Live-Indikator: Grün wenn läuft, Grau wenn idle, Rot wenn letzter Run fehlschlug
- Klick → Detail-Panel öffnet sich (Premium Transition: Slide + Scale)

**Detail-Panel enthält:**
- Agent-Name, Beschreibung
- Letzter Run: Timestamp, Dauer, Status
- Fehleranzahl (letzten 24h)
- Direkter Start-Button für diesen Lead
- Log-Snippet

**TWIN Orb ist zentral:** Buchstäblich in der Mitte der Agent-Anordnung positioniert.

---

## Leere / Loading / Error States

**Kein leeres Weiß.** Jeder State hat ein Design.

**Loading:**
- Skeleton-Shimmer in der Farbe des Components
- TWIN-Orb pulsiert schneller während geladen wird
- Max 3s bis Fallback oder Error-State

**Leer (keine Daten):**
- Klarer Grund-Text: "Noch keine Leads für heute" — kein "No data found"
- Handlungs-Aufforderung: "Starte A1 für deinen ersten Scan"
- Illustration oder Icon — nie nur Text auf leerem Hintergrund

**Error:**
- Error-Text konkret: was ging falsch, nicht "Ein Fehler ist aufgetreten"
- Retry-Button wenn möglich
- TWIN-Orb wechselt zu Error-State

---

## Branding

- **Name:** PDSTUDIO (nicht MONEYLAN in der UI)
- **Logo:** Sichtbar im Command Center Header, nicht versteckt
- **Footer Landing Page:** Impressum, Datenschutz, AGB, Kontakt — alle echten Seiten
- **Demo-Websites:** "PDSTUDIO" im Sticky-Banner, nicht MONEYLAN

---

## Responsive

- **Mobile-First** für Demo-Websites
- **Desktop-First** für Command Center (primär auf Mac genutzt)
- Breakpoints: 768px (tablet), 1280px (desktop), 1536px (wide)
- Kein horizontales Scrollen auf keinem Breakpoint

---

## Verbotene Muster

- Gradient-Button mit Glow auf weißem Hintergrund (100% SaaS-Klischee)
- "Try it free" als primärer CTA ohne Kontext
- Card-Grid mit identischen Höhen erzwungen (natürliche Höhen sind besser)
- Modal über Modal
- Tooltips ohne Delay (min 500ms hover bevor Tooltip erscheint)
- Font-Size unter 13px für Fließtext
- Mehr als 3 verschiedene Grau-Töne auf einer Seite
- Placeholder-Text der wie Content aussieht ("Lorem Ipsum" verboten)

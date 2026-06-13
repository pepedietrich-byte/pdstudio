# A2 Build Prompt Template

Dieser Template wird von Agent 2 (n8n) mit echten Lead-Daten befüllt und an den VPS Runner gesendet.
Alle {{PLATZHALTER}} werden durch n8n ersetzt.

---

Du bist Claude Code auf einem VPS. Baue eine vollständige, produktionsreife Restaurant-Demo-Website.

## DEINE AUFGABE

Schreibe/ersetze diese Dateien vollständig:
- `sites/{{SITE_SLUG}}/src/App.jsx` — komplette React-Komponente
- `sites/{{SITE_SLUG}}/index.html` — Schema.org + Google Fonts im <head>

Nichts sonst anfassen. Kein npm install. Keine anderen Verzeichnisse.

## QUALITÄTSSTANDARD

Lies zuerst `project-napoli-premium/index.html` in diesem Repo — das ist die Qualitätslatte.
Mindestens dieses Niveau. Keine generischen Templates. Kein SaaS-Slop.

Referenzcode für React-Struktur: `sites/indian-crown/src/App.jsx`

## RESTAURANT-DATEN (nur diese verwenden — nichts erfinden)

Name: {{RESTAURANT_NAME}}
Kategorie: {{CUISINE_TYPE}}
Adresse: {{ADDRESS}}
Telefon: {{PHONE}}
Website: {{WEBSITE_URL}}
Google Rating: {{GOOGLE_RATING}} / {{GOOGLE_REVIEWS}} Bewertungen
Atmosphäre: {{ATMOSPHERE}}
Öffnungszeiten:
{{OPENING_HOURS}}
Specials: {{SPECIALS}}
Preisklasse: {{PRICE_RANGE}}

## DESIGN

Farb-Direction: {{COLOR_DIRECTION}}
Schriften: {{FONTS}} (via Google Fonts — Link in index.html eintragen)
Hero-Headline: {{HERO_HEADLINE}}
Design-Stil: {{DESIGN_STYLE}}

Bilder (Unsplash URLs direkt verwenden):
Hero: {{IMG_HERO}}
Interior: {{IMG_INTERIOR}}
Food/Produkt: {{IMG_FOOD}}
Atmosphäre: {{IMG_ATMOSPHERE}}

## PFLICHT (unveränderlich)

1. `<meta name="robots" content="noindex, nofollow">` in index.html — bereits da, behalten
2. Sticky Demo-Banner ganz oben: "Diese Website ist eine Demo-Präsentation von PDSTUDIO · Echte Seite: {{WEBSITE_URL}}"
3. Schema.org Restaurant JSON-LD in index.html <head> (echte Daten)
4. Keine externen npm-Pakete — nur react + react-dom sind installiert
5. Keine Animation-Libraries (framer-motion, gsap etc.) — pure CSS
6. Mobile-first responsive
7. Alle Nav-Links scrollen zu Sections
8. "Erstellt von PDSTUDIO" im Footer
9. Impressum, Datenschutz, AGB als #hash-Anchors im Footer

## SECTIONS (alle müssen vorhanden sein)

- Nav (sticky, scrolled-state)
- Hero (fullscreen, cinematic)
- Trust Strip (Google Rating, Bewertungen, Specials)
- Konzept/About (Text + Bild, echte Beschreibung)
- Karte/Angebot (6-8 Items — als Demo markieren mit Hinweis auf echte Karte)
- Öffnungszeiten (heutiger Tag highlighted)
- Anfahrt (Adresse, Telefon, Google Maps iframe)
- Footer (Kontakt, Navigation, Rechtliches, PDSTUDIO)

## VERBOTEN

- Placeholder-Text oder TODO-Kommentare
- Erfundene Fakten (Preise, Speisekarte, Öffnungszeiten)
- npm-Packages hinzufügen
- Andere Dateien außerhalb von `sites/{{SITE_SLUG}}/` anfassen
- Generische AI-Optik

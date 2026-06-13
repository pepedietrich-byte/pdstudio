# PDSTUDIO — Build-Regeln

> Für alle Website-Build-, Deployment-, und Code-Generierungs-Aufgaben.

---

## Demo-Website Aufbau (A2 Output)

Jede generierte Demo-Website ist ein vollständiges React + Vite + Tailwind CSS Projekt.

### Pflicht-Dateien (immer vorhanden)
```
restaurant-site/
  src/
    App.jsx              ← Haupt-Komponente, alle Sections
    components/
      Hero.jsx
      Menu.jsx
      About.jsx
      Contact.jsx
      OpeningHours.jsx
      Footer.jsx
      DemoBanner.jsx     ← PFLICHT: Sticky Demo-Banner oben
      InterestModal.jsx  ← PFLICHT: Modal bei Klick
    data/
      restaurant.js      ← Alle echten Daten (aus Sheets)
    styles/
      index.css
  index.html             ← Schema.org + noindex + OG Tags
  package.json
  vite.config.js
  tailwind.config.js
  vercel.json
  public/
    favicon.ico
  pages/
    impressum.html       ← PFLICHT: Echte Pflichtseite
    datenschutz.html     ← PFLICHT: Echte Pflichtseite
    agb.html             ← PFLICHT: Echte Pflichtseite
```

### Demo-Banner (NIEMALS weglassen)
```jsx
// DemoBanner.jsx — immer sticky am Top, z-index 9999
<div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-black text-center py-2 text-sm font-medium">
  Diese Website ist eine Demo-Präsentation von{' '}
  <a href="https://pdstudio.de" className="underline font-bold">PDSTUDIO</a>.
  Für weitere Informationen:{' '}
  <a href="tel:+49XXXXXXXXXX" className="underline">{restaurant.phone}</a>
</div>
```

### noindex Meta (NIEMALS weglassen)
```html
<!-- index.html -->
<meta name="robots" content="noindex, nofollow">
```

### Schema.org (PFLICHT)
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "{restaurant.name}",
  "address": { "@type": "PostalAddress", "streetAddress": "...", "addressLocality": "...", "postalCode": "...", "addressCountry": "DE" },
  "telephone": "{restaurant.phone}",
  "openingHoursSpecification": [...],
  "servesCuisine": "{restaurant.cuisine}",
  "priceRange": "{restaurant.priceRange}"
}
</script>
```

---

## Daten-Regel: Nichts erfinden

**Hard Rule:** Demo-Websites zeigen nur echte Daten die aus der Original-Website oder Google Maps extrahiert wurden.

Was erlaubt ist:
- Design-Direction (Farben, Fonts, Layout-Style)
- Atmosphäre-Beschreibungen (aus A2 Interpretation-Feld)
- Claim/Slogan wenn er vom Restaurant selbst stammt oder klar als "Interpretation" markiert ist

Was NICHT erfunden werden darf:
- Adresse
- Telefonnummer
- E-Mail
- Öffnungszeiten
- Preise
- Speisekarte-Items
- Anzahl Sitzplätze
- Mitarbeiterzahl

Bei fehlenden Pflichtfeldern: Abschnitt weglassen oder mit Platzhalter "Bitte anfragen" arbeiten. Niemals Daten ausdenken.

---

## Vercel Deployment Regeln

### Neues Projekt anlegen + deployen

**Schritt 1: Projekt anlegen**
```bash
POST https://api.vercel.com/v9/projects
Authorization: Bearer {VERCEL_TOKEN}
{
  "name": "ml-{restaurant-slug}-{7-char-timestamp}",
  "framework": null,       # PFLICHT: null für statische Sites
  "buildCommand": null,    # PFLICHT: null für statische Sites
  "outputDirectory": "dist"
}
```

**Schritt 2: Deployment erstellen**
```bash
POST https://api.vercel.com/v13/deployments
Authorization: Bearer {VERCEL_TOKEN}
{
  "name": "ml-{restaurant-slug}-{7-char-timestamp}",
  "project": "{project_id}",
  "files": [...],
  "framework": null,       # PFLICHT: immer null bei statischen Sites
  "buildCommand": null,
  "outputDirectory": "dist"
}
```

**Schritt 3: Deployment-Status verifizieren**
```bash
GET https://api.vercel.com/v13/deployments/{deployment_id}
# Warten bis status = "READY"
# Max 3 Versuche × 10s Abstand
```

**Schritt 4: Protection deaktivieren (öffentlicher Zugriff)**
```bash
PATCH https://api.vercel.com/v9/projects/{project_id}
{ "ssoProtection": null, "passwordProtection": null }
```

### Kritische Vercel-Bugs (bekannte Fallstricke)

**Bug: Framework-Caching**
Wenn ein Projekt zuerst mit `framework: "vite"` deployed wird und dann als statisches HTML, schlägt der Build fehl (Vercel sucht `package.json` und `npm run build`).
**Fix:** Bei JEDEM Deployment explizit `"framework": null` und `"buildCommand": null` im Payload setzen.

**Bug: DEPLOYMENT_NOT_FOUND**
Tritt auf wenn der Verify-Schritt zu früh läuft (Race Condition).
**Fix:** 15s warten nach Deployment-Erstellung bevor Verify. Bei DEPLOYMENT_NOT_FOUND: nochmal 10s warten + Retry (max 3x). KEIN neues Deployment starten.

**Bug: 7-Char Timestamp**
Vercel-Projektnamen haben ein Zeichen-Limit. Timestamps müssen gekürzt werden.
**Fix:** `Date.now().toString(36).slice(-7)` als Suffix.

### Deployment-Namen Format
```
ml-{restaurant-slug}-{7-char-timestamp}
Beispiel: ml-trattoria-rosso-leipzig-xk4p2am
```

Slug-Regeln:
- Nur Kleinbuchstaben, Zahlen, Bindestriche
- Max 50 Zeichen gesamt
- Umlaute ersetzen: ä→ae, ö→oe, ü→ue, ß→ss

---

## Poe API Regeln

**Endpoint:** `https://api.poe.com/v1/chat/completions`
**Modell:** `Claude-Sonnet-4.6`
**Temperature:** 0 (für Code-Generierung), 0.3 (für Text-Generierung)

### n8n Poe-Node Pflicht-Einstellungen
```json
{
  "neverError": true,
  "continueOnFail": true,
  "timeout": 90000
}
```

**`neverError: true` ist NICHT optional.** Ohne diese Einstellung crasht der gesamte n8n-Workflow bei einem Poe-Fehler und kein Status wird gespeichert.

### Fehler-Handling nach Poe-Call
```javascript
// In Code-Node nach Poe-HTTP-Node
const poeStatus = $input.item.json.statusCode || 200
const poeBody = $input.item.json.body || {}

if (poeStatus >= 400) {
  return [{
    json: {
      status: 'error',
      error_type: poeStatus === 429 ? 'rate_limit' : 
                  poeStatus >= 500 ? 'external_blocker' : 'api_error',
      error_message: poeBody.error || `HTTP ${poeStatus}`,
      lead_id: $input.item.json.lead_id,
    }
  }]
}
```

### Cloudflare-Blocking
Poe blockiert manchmal via Cloudflare. Status: `external_blocker`.
**Nicht sofort retry** — warten 5–10 Minuten. Das ist ein temporärer Block, kein Fehler im Code.

---

## Prompt-Qualität für A2 Website-Builder

Der Claude-Code-Bauauftrag (A6-Output) sollte ~7500 Zeichen haben und enthalten:

```
1. Identität des Restaurants (Name, Ort, Küche, Zielgruppe)
2. Alle echten Fakten (Adresse, Tel, Öffnungszeiten, Menü)
3. Design-Direction (Farbtokens, Fonts, Stil, Hero-Direction)
4. Do-Not-Invent-Liste (explizit alle nicht verfügbaren Felder)
5. Pflicht-Sections-Liste (Hero, Menü, Über-uns, Öffnungszeiten, Kontakt, Footer)
6. Qualitäts-Checkliste (Schema.org, noindex, Demo-Banner, Mobile-first)
7. Code-Struktur-Vorgabe (Dateiliste, Komponenten-Aufteilung)
```

Prompts kürzer als 4000 Zeichen produzieren generische Websites.

---

## FLUX-pro Bild-Generierung (A3 Polish)

**Endpoint:** Poe API mit `FLUX-pro` Modell

### Prompt-Template
```
Professional food photography for {restaurant_name}, a {cuisine_type} restaurant in {city}.
{atmosphere_description}. 
{specific_direction}.
Cinematic lighting, editorial style, no text, no watermarks, photorealistic.
Aspect ratio: {aspect_ratio}.
```

**Pflicht-Regeln für Bild-Prompts:**
- Immer Restaurant-Name und Küche nennen
- Atmosphäre aus A3-Output verwenden
- "no text, no watermarks" immer dabei
- Nie generische "restaurant food" Prompts ohne Kontext
- Aspect Ratio explizit angeben

### Slots für Bild-Injection in App.jsx
```javascript
// App.jsx sollte ein IMG-Objekt haben
const IMG = {
  hero: 'https://...',      // 16:9 oder 3:1
  gallery_1: 'https://...', // 1:1
  gallery_2: 'https://...', // 1:1
  gallery_3: 'https://...', // 1:1
  interior: 'https://...',  // 4:3
}
```

A3 findet und ersetzt dieses Objekt — das ist das Injection-Target.

---

## Build & Deploy Workflow für Command Center

```bash
# Lokal entwickeln
cd /Users/law/Desktop/MONEYLAN/command-center
npm run dev

# Lint prüfen
npm run lint

# Build prüfen
npm run build

# Auf Vercel deployen (Preview)
npx vercel

# Auf Vercel deployen (Production)
npx vercel --prod
```

**Pflicht vor jedem "fertig":** Build muss erfolgreich sein. Keine Warnungen die zu Fehlern werden.

---

## React + Vite Projekt-Template für Demo-Sites

### package.json Minimum
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "vite": "^5.0.0"
  }
}
```

### vercel.json für Demo-Sites
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Tailwind config Minimum
```javascript
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

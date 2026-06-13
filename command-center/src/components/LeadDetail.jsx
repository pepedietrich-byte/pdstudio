import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Globe, Phone, Mail, MapPin, Star, Clock,
  Check, X, Rocket, Zap, ExternalLink, Eye, Building2,
  Image, Layout, BarChart2, ChevronDown, ChevronUp,
  RefreshCw, AlertTriangle, Lightbulb, TrendingUp, Shield,
  Target, Info, CheckCircle, XCircle, HelpCircle, Lock,
  Wifi, WifiOff, Copy, DollarSign, FileText, Search as SearchIcon,
  CheckSquare,
} from 'lucide-react'
import { getLeadStage, getConfidence, getScoreBreakdown } from '../lib/sheets'
import { triggerAgent, triggerWebsiteBuild, isWebhookConfigured } from '../lib/n8n'
import VpsBuildPanel from './VpsBuildPanel'
import { AGENTS } from '../lib/agents'
import { JOB_STATUS, JOB_STATUS_COLOR, JOB_STATUS_LABEL } from '../lib/status'
import { useLeadResults } from '../hooks/useLeadResults'
import ErrorBoundary from './ErrorBoundary'

const EASE = [0.23, 1, 0.32, 1]
const STAGE_LABELS = ['','LEAD','TEXT','IMG','VALID','CONCEPT','BUILD','LIVE']
const STAGE_COLORS = ['','#00d4ff','#e8197f','#2ddb72','#f5a623','#9b6ef3','#00d4ff','#e8197f']

const BREAKDOWN_META = {
  no_https:        { label: 'Keine HTTPS-Verschlüsselung',         hint: 'schadet Google-Ranking + Nutzervertrauen', color: '#ff3b3b' },
  not_mobile:      { label: 'Nicht mobiloptimiert',                hint: 'über 60 % der Nutzer kommen per Smartphone', color: '#ff3b3b' },
  slow_pagespeed:  { label: 'Schlechte Ladezeit (PSI)',            hint: 'Google PageSpeed unter 50/100', color: '#f5a623' },
  missing_legal:   { label: 'Impressum / Datenschutz fehlt',       hint: 'rechtliches Risiko für Betreiber', color: '#f5a623' },
  weak_seo:        { label: 'SEO-Basics fehlen',                   hint: 'kein Title-Tag, Meta-Description, H1 oder Schema.org', color: '#f5a623' },
  outdated_design: { label: 'Veraltetes Design / Tech',            hint: 'WordPress-Altlast, jQuery < 3, Flash, kein Viewport-Meta', color: '#f5a623' },
  weak_contact:    { label: 'Kein Anruf-Button / Kontaktformular', hint: 'Nutzer können nicht direkt anfragen', color: '#9b6ef3' },
  weak_hero:       { label: 'Schwacher / fehlender Hero-Bereich',  hint: 'Erster Eindruck wirkt amateurhaft', color: '#e8197f' },
  no_visual_hero:  { label: 'Kein visueller Hero erkannt',         hint: 'Screenshot-Analyse: keine Hero-Section', color: '#e8197f' },
  no_cta:          { label: 'Kein Call-to-Action sichtbar',        hint: 'Kein Reservierungs- oder Anruf-Button', color: '#e8197f' },
  no_cta_data:     { label: 'CTA-Daten nicht auswertbar',          hint: 'Screenshot-Analyse nicht verfügbar', color: '#9b6ef3' },
  visual_outdated: { label: 'Visuell veraltet vs. 2026',           hint: 'Design-Benchmark: Modernität und Frische fehlen', color: '#f5a623' },
  visual_no_data:  { label: 'Keine Visual-Daten',                  hint: 'Kein Screenshot vom PageSpeed-Service', color: '#9b6ef3' },
  low_substance:   { label: 'Geringe Google-Substanz',             hint: 'Wenig Bewertungen oder Rating < 4.0', color: '#52526b' },
}

function safePct(c) { return (c >= 0.8) ? '#2ddb72' : (c >= 0.5) ? '#f5a623' : '#ff3b3b' }
function safeScore(n) { return (+n >= 60) ? '#2ddb72' : (+n >= 40) ? '#f5a623' : '#ff3b3b' }

// A2 Start modes
const A2_MODES = {
  manual:  { id: 'manual',  label: 'Manual Mode',      note: 'Prompt kopieren → Claude Code lokal starten', color: '#9b6ef3', status: 'manual_claude_code_required' },
  remote:  { id: 'remote',  label: 'Remote / Desktop', note: 'Prompt für Claude Code Remote / Handy-Start', color: '#00d4ff', status: 'remote_claude_code_ready' },
  runner:  { id: 'runner',  label: 'Runner (VPS)',      note: 'Vollautomatisch — git → claude → build → vercel', color: '#9b6ef3', status: 'ready' },
  fallback:{ id: 'fallback',label: 'A7 API Fallback',  note: 'Schnell, schwächerer Output — kein Claude Code', color: '#52526b', status: 'api_builder_fallback' },
}

const RESERVATION_MODES = {
  with:    { id: 'with',    label: 'Mit Reservierung',  cta: 'Jetzt reservieren' },
  without: { id: 'without', label: 'Ohne Reservierung', cta: null },
}

// A2 Build options
const POE_IMAGE_MODELS = [
  { id: 'Flux-Pro-1.1',        label: 'FLUX Pro 1.1',       note: 'Beste Qualität, realistisch', recommended: true },
  { id: 'Flux-Dev',            label: 'FLUX Dev',            note: 'Schneller, gute Qualität' },
  { id: 'Ideogram-v2',         label: 'Ideogram v2',         note: 'Gut für Text in Bildern' },
  { id: 'Stable-Diffusion-3-5',label: 'SD 3.5',              note: 'Zuverlässig, variabel' },
  { id: 'DALL-E-3',            label: 'DALL·E 3',            note: 'OpenAI, kreativ' },
  { id: 'StableDiffusionXL',   label: 'SDXL',                note: 'Schnell, günstig' },
]

const ANIMATION_LEVELS = [
  { id: 'minimal',  label: 'Minimal',   note: 'Nur Fade-ins' },
  { id: 'standard', label: 'Standard',  note: 'Napoli-Standard (empfohlen)', recommended: true },
  { id: 'premium',  label: 'Premium',   note: 'Parallax, Stagger, Hover-Depth' },
]

const COLOR_MOODS = [
  { id: 'dark-premium',  label: 'Dark Premium',   note: 'Tiefes Schwarz + Gold (empfohlen)', recommended: true },
  { id: 'warm-earthy',   label: 'Warm & Erdig',   note: 'Braun, Terrakotta, Creme' },
  { id: 'light-minimal', label: 'Hell & Minimal',  note: 'Weiß, Grau, Akzent' },
  { id: 'vibrant',       label: 'Vibrant',         note: 'Satte Farben, mutig' },
  { id: 'monochrome',    label: 'Monochrom',       note: 'Schwarz/Weiß + ein Akzent' },
]

const TYPOGRAPHY_STYLES = [
  { id: 'serif-modern',  label: 'Serif Modern',   note: 'Playfair + Inter (empfohlen)', recommended: true },
  { id: 'sans-clean',    label: 'Sans Clean',     note: 'Outfit / DM Sans, modern' },
  { id: 'display-bold',  label: 'Display Bold',   note: 'Starke Headlines, Impact' },
]

const SITE_SECTIONS = [
  { id: 'hero',          label: 'Hero Section',       default: true },
  { id: 'trust',         label: 'Trust / Stats',      default: true },
  { id: 'about',         label: 'Über uns',           default: true },
  { id: 'cuisine',       label: 'Küche / Highlights', default: true },
  { id: 'reservation',   label: 'Reservierung',       default: true },
  { id: 'hours',         label: 'Öffnungszeiten',     default: true },
  { id: 'gallery',       label: 'Foto-Galerie',       default: false },
  { id: 'testimonials',  label: 'Bewertungen',        default: false },
  { id: 'team',          label: 'Team / Chef',        default: false },
  { id: 'events',        label: 'Events / Specials',  default: false },
  { id: 'cta_banner',    label: 'CTA Banner',         default: true },
  { id: 'footer',        label: 'Footer + Legal',     default: true },
]

function buildClaudeCodePrompt(lead, reservationMode = 'with', selectedImageUrls = [], buildOptions = {}) {
  const content = lead.content || {}
  const concept = lead.concept || {}
  const images  = lead.images  || {}

  const phone  = content.telefon || lead.phone || ''
  const email  = content.email || ''
  const addr   = content.adresse || lead.address || ''
  const hours  = content.oeffnungszeiten || ''
  const cuisine = Array.isArray(content.kueche) ? content.kueche.join(', ') : content.kueche || ''
  const specials = Array.isArray(content.spezialitaeten) ? content.spezialitaeten.join(', ') : ''
  const colors  = Array.isArray(images.farbpalette) ? images.farbpalette.join(', ') : ''
  const improvements = Array.isArray(concept.improvements_vs_original) ? concept.improvements_vs_original.join('\n- ') : ''

  const withRes = reservationMode === 'with'

  // Build options defaults
  const poeModel   = buildOptions.poeModel   || 'Flux-Pro-1.1'
  const animLevel  = buildOptions.animLevel  || 'standard'
  const colorMood  = buildOptions.colorMood  || 'dark-premium'
  const typo       = buildOptions.typo       || 'serif-modern'
  const sections   = buildOptions.sections   || SITE_SECTIONS.filter(s => s.default).map(s => s.id)
  const pageType   = buildOptions.pageType   || 'single-page'

  // Determine primary CTA if no reservation
  let primaryCta = 'Jetzt anrufen'
  if (!withRes) {
    if (phone) primaryCta = `Jetzt anrufen: ${phone}`
    else if (email) primaryCta = `Schreib uns: ${email}`
    else primaryCta = 'Kontakt aufnehmen'
  }

  const imgList = selectedImageUrls.length
    ? selectedImageUrls.map((u, i) => `  ${i+1}. ${u}`).join('\n')
    : images.logo_url || images.hero_url
      ? [images.logo_url, images.hero_url, ...(Array.isArray(images.galerie_urls) ? images.galerie_urls : [])].filter(Boolean).map((u, i) => `  ${i+1}. ${u}`).join('\n')
      : '  (keine Bild-URLs verfügbar — eigene Assets verwenden)'

  return `# PDSTUDIO — A2 Claude Code Build Prompt
# Lead: ${lead.name || lead.lead_id}
# Lead-ID: ${lead.lead_id || '—'}
# Datum: ${new Date().toISOString().slice(0, 10)}
# Modus: Claude Code (Premium Build)
# Reservierung: ${withRes ? 'JA — Reservierungsbereich einbauen' : 'NEIN — alternativer CTA'}
# Poe Bildmodell: ${poeModel}
# Animationslevel: ${animLevel}
# Farbstimmung: ${colorMood}
# Typografie: ${typo}
# Seitentyp: ${pageType}
# Sektionen: ${sections.join(', ')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 DEIN AUFTRAG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Baue eine Premium-Restaurant-Website für "${lead.name || 'dieses Restaurant'}" als React-App.
Deploye sie auf Vercel. Gib die Preview-URL zurück.

PFLICHT-PARAMETER aus Konfiguration:
- Bildgenerierung via Poe mit Modell: ${poeModel}
- Animationslevel: ${animLevel === 'minimal' ? 'Nur Fade-ins, keine komplexen Animationen' : animLevel === 'standard' ? 'Project Napoli Standard — Scroll-Fades, Hover-States, subtile Bewegung' : 'Premium — Parallax, Stagger-Animationen, Hover-Depth, Scroll-Triggered Reveals'}
- Farbstimmung: ${colorMood}
- Typografie: ${typo === 'serif-modern' ? 'Playfair Display (Headlines) + Inter (Body)' : typo === 'sans-clean' ? 'DM Sans oder Outfit — kein Serif' : 'Display-Font für starke Headlines (z.B. Fraunces, Cabinet Grotesk)'}
- Folgende Sektionen einbauen: ${sections.join(', ')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 DESIGNREFERENZ — PROJECT NAPOLI PREMIUM (PFLICHT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Das visuelle Hauptvorbild ist "Project Napoli Premium" — ein PDSTUDIO-Standard für
lokale Restaurant-Websites der Spitzenklasse. Alle Designentscheidungen orientieren
sich KONKRET an diesen Merkmalen:

PFLICHT-DESIGNMERKMALE (nicht weglassen, nicht vereinfachen):

1. HERO-SECTION (stark, bildgewaltig)
   - Vollbild-Hero mit echtem Restaurant-Bild als Hintergrund
   - Kurzer, merkbarer Claim in großer Schrift (1-2 Zeilen max.)
   - Subline mit 1 Satz Beschreibung
   - ${withRes ? 'Prominenter "Reservieren"-CTA Button im Hero' : `Prominenter CTA im Hero: "${primaryCta}"`}
   - Kein generisches Stockfoto — echte Lead-Bilder verwenden

2. TYPOGRAFIE
   - Serif-Font für Headlines (z.B. Playfair Display, Lora, oder ähnlich)
   - Sans-Serif für Body-Text
   - Starke Hierarchie: H1 groß, Sublines mittel, Body klein
   - Klare Gewichtung durch Font-Weight-Kontrast

3. FARBWELT
   - Dunkle, satte, lokale Premium-Anmutung (kein helles AI-Weiß-Layout)
   - ${colors ? `Lead-Farbpalette: ${colors} — diese verwenden` : 'Warme, erdige Töne passend zum Restaurant-Typ'}
   - Kontrastierende CTA-Farbe (z.B. Goldton, Amber, oder satte Akzentfarbe)

4. TRUST & KENNZAHLEN-SECTION
   - ${lead.google_rating ? `Google-Rating ${lead.google_rating}★ (${lead.google_reviews || 0} Bewertungen) prominent zeigen` : 'Trust-Elemente einbauen (Gründungsjahr, Erfahrung, Kundenzahl)'}
   - Kurze "Warum wir" oder "Unsere Qualität" Aussagen
   - Icons/Zahlen die Vertrauen aufbauen

5. ANGEBOTS-/PRODUKTKARTEN
   - Küche/Spezialitäten als visuelle Karten: ${cuisine || 'Restaurant-typische Gerichte'}
   ${specials ? `- Spezialitäten hervorheben: ${specials}` : ''}
   - Schöne Card-Optik mit Hover-Effekt
   - Kein Preismenü nötig — Highlights reichen

6. ${withRes ? `RESERVIERUNGS-SECTION (PFLICHT bei diesem Lead)
   - Dedizierte Reservierungs-Section (nicht nur Footer)
   - CTA "Tisch reservieren" / "Jetzt reservieren"
   - ${phone ? `Telefon prominent: ${phone}` : 'Telefon-CTA einbauen'}
   - Auch im Hero und in der Navigation verlinkt
   - Optional: einfaches Formular (Name, Datum, Personenzahl, Nachricht)` : `KONTAKT / HAUPT-CTA-SECTION
   - Primär-CTA: "${primaryCta}"
   - ${phone ? `Klickbares Telefon: ${phone}` : ''}
   - ${email ? `E-Mail: ${email}` : ''}
   - Klarer Call-to-Action ohne künstliche Reservierung`}

7. ÖFFNUNGSZEITEN & ANFAHRT
   - Öffnungszeiten klar lesbar: ${hours || 'Platzhalter für Öffnungszeiten'}
   - Adresse: ${addr || 'Adresse einbauen'}
   - Google Maps Embed oder Link
   - Mobile: große, klickbare Telefon/Maps-Buttons

8. FOOTER
   - Adresse, Telefon, Öffnungszeiten kompakt
   - Legal: Impressum / Datenschutz (Platzhalter falls keine echten Daten)
   - Copyright ${new Date().getFullYear()} ${lead.name || 'Restaurant'}
   - Social-Media-Links falls vorhanden

9. MOBILE-FIRST
   - Vollständig responsive, getestet für Smartphone
   - Große Touch-Targets für Telefon/CTA
   - Kein horizontal scrollbarer Overflow

10. ANIMATIONEN (subtil, performant)
    - Smooth fade-in für Sections beim Scrollen
    - Hover-States auf allen interaktiven Elementen
    - Kein Bling — Eleganz over Effekte

SKILLS (zwingend anwenden):
- taste-skill: impeccable visual taste, not generic AI output
- emilkowalski: clean interactions, purposeful motion, no decoration
- premium local business standard: looks like an agency built this

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 RESTAURANT-DATEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Name:          ${lead.name || '—'}
Adresse:       ${addr || '—'}
Telefon:       ${phone || '—'}
E-Mail:        ${email || '—'}
Öffnungszeiten:${hours || '—'}
Website alt:   ${lead.website || '—'}
Google:        ${lead.google_rating || '—'}★ (${lead.google_reviews || 0} Bewertungen)
Küche:         ${cuisine || '—'}
Spezialitäten: ${specials || '—'}
Claim/Slogan:  ${content.claim_slogan || '(selbst formulieren)'}
Über uns:      ${content.ueber_uns || '(aus Restaurant-Kontext ableiten)'}
Atmosphäre:    ${content.atmosphaere || '—'}
Zielgruppe:    ${content.zielgruppe || '—'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BILDER (verwenden falls URLs erreichbar)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${imgList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 KONZEPT-HINWEISE (aus A-Pipeline)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Design Direction: ${concept.design_direction || '(selbst ableiten aus Daten)'}
Hero Headline:    ${concept.hero_headline || '(selbst formulieren)'}
${improvements ? `Verbesserungen vs. Original:\n- ${improvements}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 TECH-STACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- React (Vite) + Tailwind CSS
- framer-motion für Animationen
- Deployment: Vercel (vercel deploy --prod)
- Output: Preview-URL zurückgeben
- Kein Backend nötig — statische React-Site

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 QUALITÄTS-PRÜFUNG vor Deploy
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[ ] Hero-Section mit echtem Bild und Claim
[ ] ${withRes ? 'Reservierungs-CTA im Hero und in eigener Section' : `Primärer CTA "${primaryCta}" prominent platziert`}
[ ] Öffnungszeiten und Adresse klar sichtbar
[ ] Mobile-Version geprüft
[ ] Impressum/Datenschutz im Footer
[ ] npm run build fehlerfrei
[ ] vercel deploy --prod ausgeführt
[ ] Preview-URL an PDSTUDIO zurückgeben
`
}

// ─────────────────────────────────────────────────────────────────────────────

export default function LeadDetail({ lead, onBack }) {
  const leadId = lead?.lead_id || null
  const { results: saved, set: saveResult, setMany: saveManyResults } = useLeadResults(leadId)

  // Ephemeral UI states (reset per lead)
  const [selImgs,       setSelImgs]       = useState(new Set())
  const [a1Status,      setA1Status]      = useState(JOB_STATUS.NOT_STARTED)
  const [a1Msg,         setA1Msg]         = useState('')
  const [a2Status,      setA2Status]      = useState(JOB_STATUS.NOT_STARTED)
  const [a2Msg,         setA2Msg]         = useState('')
  const [a3Status,      setA3Status]      = useState(JOB_STATUS.NOT_STARTED)
  const [a3Step,        setA3Step]        = useState('')
  const [a3ServerOnline,setA3ServerOnline]= useState(null) // null=unchecked, true, false
  const [a4Status,      setA4Status]      = useState(JOB_STATUS.NOT_STARTED)
  const [a4Msg,         setA4Msg]         = useState('')
  const [a5Status,      setA5Status]      = useState(JOB_STATUS.NOT_STARTED)
  const [a6Status,      setA6Status]      = useState(JOB_STATUS.NOT_STARTED)
  const [a6Msg,         setA6Msg]         = useState('')
  const [bdExpand,      setBdExpand]      = useState(false)
  const [promptCopied,  setPromptCopied]  = useState(false)
  const [copiedKey,     setCopiedKey]     = useState(null)

  // Persisted results via localStorage
  const a2Mode     = saved.a2Mode     ?? 'manual'
  const reservMode = saved.reservMode ?? 'with'
  const a4Texts    = saved.a4Texts    ?? null
  const a4Tone     = saved.a4Tone     ?? 'direkt'
  const a5Result   = saved.a5Result   ?? null
  const a6Result   = saved.a6Result   ?? null
  // A3 Score (new: website quality scorer)
  const a3Score    = saved.a3Score    ?? null  // full score result
  const a3ScoredUrl= saved.a3ScoredUrl?? ''    // URL that was scored
  // A3 Polish (image generation + deploy)
  const a3Images   = saved.a3Images   ?? null
  const a3Url      = saved.a3Url      ?? null
  const a3DemoUrl  = saved.a3DemoUrl  ?? ''
  const a3SiteDir  = saved.a3SiteDir  ?? ''
  const a3Cuisine  = saved.a3Cuisine  ?? ''
  // A2 Build options (persisted)
  const a2PoeModel  = saved.a2PoeModel  ?? 'Flux-Pro-1.1'
  const a2AnimLevel = saved.a2AnimLevel ?? 'standard'
  const a2ColorMood = saved.a2ColorMood ?? 'dark-premium'
  const a2Typo      = saved.a2Typo      ?? 'serif-modern'
  const a2PageType  = saved.a2PageType  ?? 'single-page'
  const a2Sections  = saved.a2Sections  ?? SITE_SECTIONS.filter(s => s.default).map(s => s.id)
  // A2 build tracking
  const a2DeployedUrl = saved.a2DeployedUrl ?? ''

  const setA2Mode      = (v) => saveResult('a2Mode', v)
  const setReservMode  = (v) => saveResult('reservMode', v)
  const setA4Texts     = (v) => saveResult('a4Texts', v)
  const setA4Tone      = (v) => saveResult('a4Tone', v)
  const setA5Result    = (v) => saveResult('a5Result', v)
  const setA6Result    = (v) => saveResult('a6Result', v)
  const setA3Score     = (v) => saveResult('a3Score', v)
  const setA3ScoredUrl = (v) => saveResult('a3ScoredUrl', v)
  const setA3Images    = (v) => saveResult('a3Images', v)
  const setA3Url       = (v) => saveResult('a3Url', v)
  const setA3DemoUrl   = (v) => saveResult('a3DemoUrl', v)
  const setA3SiteDir   = (v) => saveResult('a3SiteDir', v)
  const setA3Cuisine   = (v) => saveResult('a3Cuisine', v)
  const setA2PoeModel  = (v) => saveResult('a2PoeModel', v)
  const setA2AnimLevel = (v) => saveResult('a2AnimLevel', v)
  const setA2ColorMood = (v) => saveResult('a2ColorMood', v)
  const setA2Typo      = (v) => saveResult('a2Typo', v)
  const setA2PageType  = (v) => saveResult('a2PageType', v)
  const setA2Sections  = (v) => saveResult('a2Sections', v)
  const setA2DeployedUrl=(v) => saveResult('a2DeployedUrl', v)

  const images = useMemo(() => {
    if (!lead) return {}
    return (lead.images && typeof lead.images === 'object') ? lead.images : {}
  }, [lead])

  const allImages = useMemo(() => {
    const imgs = []
    if (images.logo_url) imgs.push({ type: 'logo',    url: images.logo_url, label: 'Logo' })
    if (images.hero_url) imgs.push({ type: 'hero',    url: images.hero_url, label: 'Hero' })
    const gallery = Array.isArray(images.galerie_urls) ? images.galerie_urls : []
    gallery.forEach((u, i) => u && imgs.push({ type: 'gallery', url: u, label: `Galerie ${i+1}` }))
    return imgs
  }, [images])

  const leadKey = lead?.lead_id || lead?.website || lead?.name || ''
  useEffect(() => {
    setSelImgs(new Set(allImages.map((_, i) => i)))
    setA1Status(JOB_STATUS.NOT_STARTED); setA1Msg('')
    setA2Status(JOB_STATUS.NOT_STARTED); setA2Msg('')
    setA3Status(JOB_STATUS.NOT_STARTED); setA3Step('')
    setA4Status(JOB_STATUS.NOT_STARTED); setA4Msg('')
    setA5Status(JOB_STATUS.NOT_STARTED)
    setA6Status(JOB_STATUS.NOT_STARTED); setA6Msg('')
    setBdExpand(false)
  }, [leadKey])

  // Check if local A3 server is running (once per lead open)
  useEffect(() => {
    setA3ServerOnline(null)
    fetch('http://localhost:3033/health', { signal: AbortSignal.timeout(2000) })
      .then(r => r.ok ? setA3ServerOnline(true) : setA3ServerOnline(false))
      .catch(() => setA3ServerOnline(false))
  }, [leadKey])

  if (!lead) {
    return (
      <div className="flex flex-col items-center py-20 gap-3" style={{ color: 'var(--text-dim)' }}>
        <HelpCircle size={24} />
        <span className="font-mono text-xs">Kein Lead ausgewählt</span>
        <button onClick={onBack} className="font-mono text-xs underline mt-2">Zurück</button>
      </div>
    )
  }

  const stage      = getLeadStage(lead)
  const score      = +lead.score || 0
  const content    = (lead.content    && typeof lead.content    === 'object') ? lead.content    : {}
  const concept    = (lead.concept    && typeof lead.concept    === 'object') ? lead.concept    : {}
  const build      = (lead.build      && typeof lead.build      === 'object') ? lead.build      : {}
  const validation = (lead.validation && typeof lead.validation === 'object') ? lead.validation : {}
  const stageColor = STAGE_COLORS[stage] || 'var(--text-dim)'
  const args       = Array.isArray(lead.verkaufsargumente) ? lead.verkaufsargumente : []

  const hasDemo  = !!(build.demo_url && !build.demo_url.startsWith('/files') && /^https?:\/\//.test(build.demo_url))
  const conf     = getConfidence(lead)
  const breakdown = getScoreBreakdown(lead) || {}
  const hasBreakdown = Object.keys(breakdown).length > 0

  const negatives = hasBreakdown
    ? Object.entries(breakdown).filter(([, v]) => +v > 0).map(([k, pts]) => ({
        key: k, label: BREAKDOWN_META[k]?.label || k,
        hint: BREAKDOWN_META[k]?.hint || '', pts: +pts,
        color: BREAKDOWN_META[k]?.color || '#9b6ef3',
      }))
    : args.map((a, i) => ({ key: `arg_${i}`, label: a, hint: '', pts: 0, color: '#9b6ef3' }))
  const bdAll   = negatives
  const bdSlice = bdExpand ? bdAll : bdAll.slice(0, 5)
  const bdMax   = bdAll.length ? Math.max(...bdAll.map(n => n.pts || 0), 1) : 1

  // ── A1 Lead Qualifier ──────────────────────────────────────────────────────
  async function runA1() {
    if (!lead.lead_id) { setA1Msg('lead_id fehlt'); return }
    setA1Status(JOB_STATUS.RUNNING); setA1Msg('A1 Lead Qualifier wird gestartet...')
    try {
      await triggerAgent(1, { lead_id: lead.lead_id, website: lead.website, source: 'manual' })
      setA1Status(JOB_STATUS.DONE)
      setA1Msg('A1 gestartet — Score-Aktualisierung in wenigen Minuten sichtbar')
    } catch (e) {
      setA1Status(JOB_STATUS.ERROR)
      setA1Msg('Fehler: ' + e.message)
    }
  }

  // ── A2 Claude Code Builder ─────────────────────────────────────────────────
  async function runA2Webhook() {
    if (!lead.lead_id) { setA2Msg('lead_id fehlt'); return }
    setA2Status(JOB_STATUS.RUNNING); setA2Msg('A2 Build wird gestartet...')
    try {
      const urls = allImages.filter((_, i) => selImgs.has(i)).map(img => img.url)
      await triggerWebsiteBuild(lead.lead_id, urls.length ? { selected_images: urls } : {})
      setA2Status(JOB_STATUS.DONE)
      setA2Msg('A2/A7 gestartet — Website-Build läuft. Demo-URL erscheint im Sheet nach Abschluss.')
    } catch (e) {
      setA2Status(JOB_STATUS.ERROR)
      setA2Msg('Fehler: ' + e.message)
    }
  }

  function copyPrompt() {
    const selectedUrls = allImages.filter((_, i) => selImgs.has(i)).map(img => img.url)
    const buildOptions = { poeModel: a2PoeModel, animLevel: a2AnimLevel, colorMood: a2ColorMood, typo: a2Typo, pageType: a2PageType, sections: a2Sections }
    const prompt = buildClaudeCodePrompt(lead, reservMode, selectedUrls, buildOptions)
    navigator.clipboard.writeText(prompt)
    setPromptCopied(true)
    setTimeout(() => setPromptCopied(false), 2000)
    // Auto-update A2 build tracking state to "awaiting deploy URL"
    setA2Status(JOB_STATUS.RUNNING)
    setA2Msg('Prompt kopiert — Build läuft. Demo-URL unten eintragen sobald deployed.')
  }

  // ── A3 Website Quality Scorer ─────────────────────────────────────────────
  async function runA3Score() {
    const url = a3ScoredUrl || a2DeployedUrl || build?.demo_url || ''
    if (!url) { setA3Step('Demo URL eingeben'); return }

    setA3Status(JOB_STATUS.RUNNING)
    setA3Step('Website wird analysiert via Gemini Flash...')

    try {
      const r = await fetch('/api/a3-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          demo_url: url,
          lead_name: lead.name || lead.lead_id,
          lead_data: {
            google_rating: lead.google_rating,
            google_reviews: lead.google_reviews,
            address: lead.address || lead.content?.adresse,
            score: lead.score,
          },
        }),
      })
      const data = await r.json()
      if (data.error) throw new Error(data.error)
      setA3Score(data)
      setA3Status(JOB_STATUS.DONE)
      setA3Step(`Score: ${data.overall_score}/100 — Confidence: ${data.confidence_score}%`)
      // Auto-update A5 pricing guidance and A6 trust
      if (data.estimated_value_eur) {
        saveResult('a5_a3_guidance', { estimated_value: data.estimated_value_eur, price_adjustment: data.a5_price_adjustment })
      }
      if (data.a6_trust_factor !== undefined) {
        saveResult('a6_a3_trust', data.a6_trust_factor)
      }
    } catch (e) {
      setA3Status(JOB_STATUS.ERROR)
      setA3Step('Fehler: ' + e.message)
    }
  }

  // ── A4 Human Writer ────────────────────────────────────────────────────────
  async function runA4() {
    setA4Status(JOB_STATUS.RUNNING); setA4Msg('Texte werden generiert...')
    const toneMap = {
      direkt: 'Direkt und auf den Punkt. Kein Smalltalk.',
      locker: 'Locker und freundlich, aber professionell.',
      premium: 'Hochwertig und professionell. Seriöser Ton.',
    }
    const systemPrompt = `Du schreibst personalisierte Restaurant-Verkaufstexte auf Deutsch.
Ton: ${toneMap[a4Tone] || toneMap.direkt}
Schreibe für ein Restaurant das eine neue Website braucht. Der Lead wurde durch technische Analyse identifiziert.
Gib JSON zurück mit Feldern: email_v1, email_v2, dm_text, followup, call_script.
Keine Begrüßungsformeln wie "Gerne!" oder "Natürlich!".`

    const userPrompt = `Restaurant: ${lead.name || '—'}
Website: ${lead.website || '—'}
Score: ${score} (technische Schwächen erkannt)
Hauptprobleme: ${bdAll.slice(0, 3).map(n => n.label).join(', ') || args.slice(0, 3).join(', ') || 'Verbesserungspotenzial'}
Google: ${lead.google_rating || '—'}★ (${lead.google_reviews || 0} Bewertungen)
Adresse: ${lead.address || content.adresse || '—'}

Schreibe:
- email_v1: Kurze E-Mail (5-7 Sätze), Betreff + Text
- email_v2: Alternative mit anderem Einstieg
- dm_text: Instagram/Facebook DM (3-4 Sätze, casual)
- followup: Follow-up E-Mail nach 5 Tagen ohne Antwort
- call_script: Gesprächsleitfaden für 60-Sekunden-Call (Aufhänger, Pitch, CTA)

Antworte NUR mit JSON, kein Markdown außen rum.`

    try {
      const res = await fetch('/api/pepe-ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userPrompt, system: systemPrompt }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data._error) throw new Error(data._error)
      const text = data.answer || data.reply || data.message || ''
      // Parse JSON from response
      const match = text.match(/\{[\s\S]*\}/)
      if (match) {
        const parsed = JSON.parse(match[0])
        setA4Texts(parsed)
        setA4Status(JOB_STATUS.DONE)
        setA4Msg('Texte generiert')
      } else {
        // Fallback: show raw text
        setA4Texts({ email_v1: text })
        setA4Status(JOB_STATUS.DONE)
        setA4Msg('Text generiert (kein JSON-Format)')
      }
    } catch (e) {
      setA4Status(JOB_STATUS.ERROR)
      setA4Msg('Fehler: ' + e.message)
    }
  }

  // ── A5 Pricing Agent ───────────────────────────────────────────────────────
  function runA5() {
    setA5Status(JOB_STATUS.RUNNING)
    const rating  = +lead.google_rating || 0
    const reviews = +lead.google_reviews || 0
    const s       = score || 50

    // A3 quality score influences pricing
    const a3Guidance   = saved.a5_a3_guidance || null
    const a3SiteScore  = a3Score?.overall_score || null
    const a3EstValue   = a3Score?.estimated_value_eur || null
    const hasSiteScore = !!a3SiteScore

    const base    = 790
    const scoreBonus  = Math.round((s - 50) * 8)
    const ratingBonus = rating >= 4.5 ? 200 : rating >= 4.0 ? 100 : 0
    const reviewBonus = reviews >= 100 ? 150 : reviews >= 50 ? 75 : 0

    // priceMin calculated after A3 adjustment below
    let priceRec  = base + scoreBonus + ratingBonus + reviewBonus
    let pricePrem = priceRec + 300
    let closingChance = s >= 75 ? 75 : s >= 60 ? 55 : s >= 50 ? 35 : 20

    let a3Adjustment = ''
    // Adjust based on A3 site quality score
    if (hasSiteScore) {
      if (a3SiteScore >= 85) {
        priceRec  = Math.round(priceRec  * 1.35)
        pricePrem = Math.round(pricePrem * 1.4)
        closingChance = Math.min(90, closingChance + 20)
        a3Adjustment = `A3 Site-Score ${a3SiteScore}/100 → Preis +35% (Premium-Qualität)`
      } else if (a3SiteScore >= 70) {
        priceRec  = Math.round(priceRec  * 1.15)
        pricePrem = Math.round(pricePrem * 1.2)
        closingChance = Math.min(80, closingChance + 10)
        a3Adjustment = `A3 Site-Score ${a3SiteScore}/100 → Preis +15% (gute Qualität)`
      } else if (a3SiteScore < 55) {
        priceRec  = Math.round(priceRec  * 0.75)
        pricePrem = Math.round(pricePrem * 0.8)
        closingChance = Math.max(10, closingChance - 15)
        a3Adjustment = `A3 Site-Score ${a3SiteScore}/100 → Preis -25% (schwache Qualität — A3 Polish nötig)`
      } else {
        a3Adjustment = `A3 Site-Score ${a3SiteScore}/100 → Kein Preiseinfluss (durchschnittlich)`
      }
    }

    const priceMin = Math.max(490, Math.round(priceRec * 0.75))

    setA5Result({
      price_min: priceMin,
      price_recommended: priceRec,
      price_premium: pricePrem,
      closing_chance: closingChance,
      a3_site_score: a3SiteScore,
      a3_estimated_value: a3EstValue,
      reasoning: `Basis €${base} + Score-Bonus €${scoreBonus} + Rating €${ratingBonus} + Reviews €${reviewBonus}.${a3Adjustment ? ' ' + a3Adjustment + '.' : ''} Closing-Chance: ${closingChance}%.`,
    })
    setA5Status(JOB_STATUS.DONE)
  }

  // ── A3 Polish Agent ────────────────────────────────────────────────────────
  async function runA3() {
    const demoUrl  = a3DemoUrl || build?.demo_url || ''
    const siteName = lead.name || ''
    const cuisine  = a3Cuisine || 'Indian'

    setA3Status(JOB_STATUS.RUNNING)

    // Step 1: Generate images via Vercel API
    setA3Step('Bilder werden generiert via Poe FLUX...')
    let generatedImages = []
    try {
      const r = await fetch('/api/a3-polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_name: siteName, cuisine_type: cuisine, color_mood: 'warm dark premium', count: 6 }),
      })
      const data = await r.json()
      if (data.images) {
        generatedImages = data.images
        setA3Images(generatedImages)
        setA3Step(`${generatedImages.length} Bilder generiert (${generatedImages[0]?.source || 'poe'})`)
      }
    } catch (e) {
      setA3Step('Bildgenerierung fehlgeschlagen: ' + e.message)
      setA3Status(JOB_STATUS.ERROR)
      return
    }

    // Step 2: If site_dir provided, update + deploy via local server
    if (a3SiteDir && a3SiteDir.trim()) {
      setA3Step('Bilder werden in site_dir injiziert...')
      try {
        const r = await fetch('http://localhost:3033/polish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            site_dir: a3SiteDir.trim(),
            images: generatedImages,
            lead_name: siteName,
            demo_url: demoUrl,
          }),
        })
        const data = await r.json()
        if (data.error) throw new Error(data.error)
        const newUrl = data.url || demoUrl
        setA3Url(newUrl)
        setA3Step(`✓ Deployed: ${newUrl}`)
        setA3Status(JOB_STATUS.DONE)
      } catch (e) {
        setA3Step('Deploy fehlgeschlagen: ' + e.message + ' — Ist der A3-Server aktiv? node a3-server.js')
        setA3Status(JOB_STATUS.ERROR)
      }
    } else {
      // No site_dir: images generated, show them + iframe
      setA3Url(demoUrl)
      setA3Step(`✓ ${generatedImages.length} Bilder bereit — site_dir eingeben für Auto-Deploy`)
      setA3Status(JOB_STATUS.DONE)
    }
  }

  // ── A6 Fact Checker ───────────────────────────────────────────────────────
  function runA6() {
    setA6Status(JOB_STATUS.RUNNING)
    setA6Msg('Daten werden geprüft...')

    const checks = []
    let hardErrors = 0

    // Website URL
    const url = lead.website || ''
    if (!url) {
      checks.push({ field: 'Website', status: 'blocked', note: 'Keine Website-URL vorhanden', type: 'hard' })
      hardErrors++
    } else {
      const isValidUrl = /^https?:\/\/.+\..+/.test(url)
      checks.push({
        field: 'Website URL',
        value: url,
        status: isValidUrl ? 'ok' : 'warning',
        note: isValidUrl ? 'URL-Format gültig' : 'URL-Format ungültig',
        type: isValidUrl ? 'ok' : 'soft',
      })
      if (!url.startsWith('https://'))
        checks.push({ field: 'HTTPS', value: url, status: 'warning', note: 'Kein HTTPS — schadet SEO und Vertrauen', type: 'soft' })
    }

    // Phone
    const phone = content.telefon || lead.phone || ''
    if (!phone) {
      checks.push({ field: 'Telefon', status: 'missing', note: 'Keine Telefonnummer im Lead', type: 'soft' })
    } else {
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
      const isGermanPhone = /^(\+49|0049|0)[1-9]\d{5,13}$/.test(cleanPhone)
      checks.push({
        field: 'Telefon', value: phone,
        status: isGermanPhone ? 'ok' : 'warning',
        note: isGermanPhone ? 'Deutsches Format erkannt' : 'Format ungewöhnlich — manuell prüfen',
        type: isGermanPhone ? 'ok' : 'soft',
      })
    }

    // Email
    const email = content.email || ''
    if (!email) {
      checks.push({ field: 'E-Mail', status: 'missing', note: 'Keine E-Mail im Lead', type: 'soft' })
    } else {
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      checks.push({
        field: 'E-Mail', value: email,
        status: isValidEmail ? 'ok' : 'blocked',
        note: isValidEmail ? 'E-Mail-Format gültig' : 'Ungültiges E-Mail-Format',
        type: isValidEmail ? 'ok' : 'hard',
      })
      if (!isValidEmail) hardErrors++
    }

    // Address
    const addr = content.adresse || lead.address || ''
    if (!addr) {
      checks.push({ field: 'Adresse', status: 'warning', note: 'Keine Adresse vorhanden', type: 'soft' })
    } else {
      checks.push({ field: 'Adresse', value: addr.slice(0, 50), status: 'ok', note: 'Vorhanden — manuell auf Korrektheit prüfen', type: 'ok' })
    }

    // Name
    if (!lead.name) {
      checks.push({ field: 'Firmenname', status: 'blocked', note: 'Kein Name vorhanden', type: 'hard' })
      hardErrors++
    } else {
      checks.push({ field: 'Firmenname', value: lead.name, status: 'ok', note: 'Name vorhanden', type: 'ok' })
    }

    // Opening hours
    if (!content.oeffnungszeiten) {
      checks.push({ field: 'Öffnungszeiten', status: 'missing', note: 'Keine Öffnungszeiten — Platzhalter nötig', type: 'soft' })
    } else {
      checks.push({ field: 'Öffnungszeiten', value: String(content.oeffnungszeiten).slice(0, 40), status: 'ok', note: 'Vorhanden', type: 'ok' })
    }

    // Images
    const hasImages = !!(images.logo_url || images.hero_url || (Array.isArray(images.galerie_urls) && images.galerie_urls.length > 0))
    checks.push({
      field: 'Bilder', status: hasImages ? 'ok' : 'warning',
      note: hasImages ? `${allImages.length} Bild(er) vorhanden` : 'Keine Bilder — Platzhalter oder A3 nötig',
      type: hasImages ? 'ok' : 'soft',
    })

    // Demo URL
    if (hasDemo) {
      checks.push({ field: 'Demo-Site', value: build.demo_url?.slice(0, 40), status: 'ok', note: 'Live — CTA-Links manuell prüfen', type: 'ok' })
    } else {
      checks.push({ field: 'Demo-Site', status: 'missing', note: 'Noch nicht deployt — A2 zuerst starten', type: 'soft' })
    }

    // Legal (nur Warnung, da wir nicht scrapen)
    checks.push({ field: 'Impressum / Datenschutz', status: 'warning', note: 'Manuell prüfen — Server-seitiger Check benötigt n8n-Webhook', type: 'soft' })

    // Trust Score berechnen
    const okCount      = checks.filter(c => c.type === 'ok').length
    const totalChecks  = checks.length
    const softWarnings = checks.filter(c => c.type === 'soft' || c.type === 'missing').length
    let trustScore     = Math.max(0, Math.round((okCount / totalChecks) * 100 - softWarnings * 3))

    // A3 site quality feeds into trust score
    const a3TrustFactor = saved.a6_a3_trust ?? null
    let a3TrustNote = ''
    if (a3TrustFactor !== null) {
      // Blend: 60% data checks + 40% A3 site quality
      trustScore = Math.round(trustScore * 0.6 + a3TrustFactor * 0.4)
      a3TrustNote = `A3 Site-Qualität: ${a3TrustFactor}% (40% Gewichtung)`
    }

    // Send status
    let sendStatus = 'ready_to_send'
    if (hardErrors > 0) sendStatus = 'blocked'
    else if (softWarnings > 2 || trustScore < 50) sendStatus = 'needs_review'

    const result = {
      trust_score: trustScore,
      hard_errors: hardErrors,
      soft_warnings: softWarnings,
      send_status: sendStatus,
      a3_trust_factor: a3TrustFactor,
      checks,
      checked_at: new Date().toISOString(),
      note: `Client-seitiger Check. ${a3TrustNote || 'A3-Score noch nicht vorhanden — nur Datenpunkte bewertet.'}`,
    }

    setA6Result(result)
    setA6Status(JOB_STATUS.DONE)
    setA6Msg(
      sendStatus === 'blocked'      ? `Blockiert — ${hardErrors} harte Fehler` :
      sendStatus === 'needs_review' ? `${softWarnings} Warnungen — Review empfohlen` :
      `Trust Score ${trustScore}% — bereit zum Versand`
    )
  }

  function copyText(key, value) {
    navigator.clipboard.writeText(value)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <ErrorBoundary>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: EASE }}
        className="space-y-3"
      >
        {/* BACK */}
        <button onClick={onBack}
          className="flex items-center gap-1.5 font-mono text-xs transition-colors"
          style={{ color: 'var(--text-dim)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}>
          <ArrowLeft size={11} /> ZURÜCK
        </button>

        {/* ── HERO ── */}
        <Card>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="font-mono text-[9px] tracking-widest mb-1" style={{ color: 'var(--text-dim)' }}>
                {lead.lead_id || '—'}
              </div>
              <h2 className="font-ui font-bold leading-tight mb-1" style={{ color: 'var(--text-hi)', fontSize: 22 }}>
                {lead.name || content.name || lead.lead_id || 'Unbekanntes Lokal'}
              </h2>
              {(lead.address || content.adresse) && (
                <div className="font-ui text-sm mb-0.5" style={{ color: 'var(--text-dim)' }}>
                  {(lead.address || content.adresse || '').replace(', Deutschland', '')}
                </div>
              )}
              {lead.website && (
                <a href={lead.website} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-xs"
                  style={{ color: '#00d4ff' }}>
                  <Globe size={9} />
                  {lead.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '').slice(0, 50)}
                </a>
              )}
            </div>
            <div className="flex items-center gap-5 flex-shrink-0">
              <Stat value={score || '?'} label="SCORE" color={safeScore(score)} xl />
              <Stat
                value={conf > 0 ? `${Math.round(conf * 100)}%` : '—'}
                label="CONF" color={safePct(conf)} />
              <Stat value={`A${stage}`} label={STAGE_LABELS[stage] || '—'} color={stageColor} />
            </div>
          </div>

          {args.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {args.map((v, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full font-mono text-[10px]"
                  style={{ background: 'rgba(255,59,59,0.07)', color: '#ff6b6b', border: '1px solid rgba(255,59,59,0.15)' }}>
                  {v}
                </span>
              ))}
            </div>
          )}
        </Card>

        {/* ── A1: LEAD QUALIFIER ── */}
        <AgentSection agentId={1} status={a1Status}>
          <div className="flex items-start gap-4 flex-wrap">
            <div className="flex-1 min-w-0 space-y-3">
              {score > 0 ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Score', value: score, color: safeScore(score) },
                      { label: 'Confidence', value: conf > 0 ? `${Math.round(conf * 100)}%` : '—', color: safePct(conf) },
                      { label: 'Demo-Potenzial', value: score >= 60 ? 'Hoch' : score >= 40 ? 'Mittel' : 'Gering', color: score >= 60 ? '#2ddb72' : '#f5a623' },
                      { label: 'Google', value: lead.google_rating ? `${lead.google_rating}★` : '—', color: +lead.google_rating >= 4 ? '#2ddb72' : '#f5a623' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="p-2 rounded"
                        style={{ background: `${color}08`, border: `1px solid ${color}18` }}>
                        <div className="font-mono text-[9px]" style={{ color: 'var(--text-dim)' }}>{label}</div>
                        <div className="font-mono text-sm font-bold" style={{ color }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  {bdAll.length > 0 && (
                    <div className="space-y-1.5">
                      <FieldLabel>Erkannte Mängel ({bdAll.length})</FieldLabel>
                      {bdSlice.map(item => (
                        <div key={item.key}>
                          <div className="flex items-start justify-between gap-2 mb-0.5">
                            <span className="font-mono text-[10px]" style={{ color: 'var(--text-dim)' }}>{item.label}</span>
                            {item.pts > 0 && (
                              <span className="font-mono text-[10px] font-bold tabular-nums flex-shrink-0"
                                style={{ color: item.color }}>+{item.pts}</span>
                            )}
                          </div>
                          {item.pts > 0 && (
                            <div className="h-[2px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                              <motion.div className="h-full rounded-full"
                                style={{ background: item.color, opacity: 0.75 }}
                                initial={{ width: 0 }} animate={{ width: `${Math.round(item.pts / bdMax * 100)}%` }}
                                transition={{ duration: 0.5, ease: EASE }} />
                            </div>
                          )}
                        </div>
                      ))}
                      {bdAll.length > 5 && (
                        <button onClick={() => setBdExpand(v => !v)}
                          className="flex items-center gap-1 font-mono text-[10px]"
                          style={{ color: 'var(--text-dim)' }}>
                          {bdExpand ? <ChevronUp size={9}/> : <ChevronDown size={9}/>}
                          {bdExpand ? 'Weniger' : `+${bdAll.length - 5} weitere`}
                        </button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <EmptyState icon={HelpCircle}>
                  Technischer Audit noch nicht durchgeführt. A1 starten mit Google Maps URL.
                </EmptyState>
              )}
            </div>
          </div>

          <AgentAction
            label="A1 NEU QUALIFIZIEREN"
            status={a1Status}
            msg={a1Msg}
            onClick={runA1}
            disabled={!isWebhookConfigured(1)}
            disabledNote={!isWebhookConfigured(1) ? 'needs_connection — VITE_N8N_AGENT1_WEBHOOK fehlt' : null}
            color="#00d4ff"
            icon={<Target size={11} />}
          />
        </AgentSection>

        {/* ── KONTAKT ── */}
        <Card title="KONTAKT & FAKTEN" icon={Building2}>
          <ContactRow icon={Globe}  label="Website"        value={lead.website}                  link={lead.website} />
          <ContactRow icon={Phone}  label="Telefon"        value={content.telefon || lead.phone} />
          <ContactRow icon={Mail}   label="E-Mail"         value={content.email} />
          <ContactRow icon={MapPin} label="Adresse"        value={content.adresse || lead.address} />
          <ContactRow icon={Clock}  label="Öffnungszeiten" value={content.oeffnungszeiten} />
          {lead.google_rating && (
            <ContactRow icon={Star} label="Google"
              value={`${lead.google_rating} ★  (${lead.google_reviews || 0} Bewertungen)`} />
          )}
        </Card>

        {/* ── A2: CLAUDE CODE BUILDER ── */}
        <AgentSection agentId={2} status={a2Status}>

          {/* Live Demo Banner */}
          {hasDemo && (
            <div className="flex items-center gap-3 p-3 rounded-md mb-4"
              style={{ background: 'rgba(45,219,114,0.05)', border: '1px solid rgba(45,219,114,0.2)' }}>
              <motion.div className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: '#2ddb72' }}
                animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2.5, repeat: Infinity }} />
              <div className="flex-1 min-w-0">
                <div className="font-mono text-xs font-bold" style={{ color: '#2ddb72' }}>SITE LIVE</div>
                <div className="font-mono text-[10px] truncate" style={{ color: 'var(--text-dim)' }}>{build.demo_url}</div>
              </div>
              <a href={build.demo_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-xs font-bold flex-shrink-0"
                style={{ background: 'rgba(45,219,114,0.12)', color: '#2ddb72', border: '1px solid rgba(45,219,114,0.25)' }}>
                <ExternalLink size={10} /> OPEN
              </a>
            </div>
          )}

          {/* Build status */}
          {build.build_status && !hasDemo && (
            <div className="flex items-center gap-2 p-2.5 rounded-md mb-4 font-mono text-[10px]"
              style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.12)', color: 'var(--text-dim)' }}>
              <RefreshCw size={10} style={{ color: '#00d4ff' }} />
              {build.build_status}
            </div>
          )}

          {/* ── START MODUS ── */}
          <div className="mb-4">
            <FieldLabel>START-MODUS</FieldLabel>
            <div className="grid grid-cols-2 gap-1.5 mt-1">
              {Object.values(A2_MODES).map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setA2Mode(mode.id)}
                  className="flex flex-col gap-0.5 p-2.5 rounded text-left transition-all"
                  style={{
                    background: a2Mode === mode.id ? `${mode.color}12` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${a2Mode === mode.id ? `${mode.color}45` : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: a2Mode === mode.id ? mode.color : 'rgba(255,255,255,0.2)' }} />
                    <span className="font-mono text-[10px] font-bold" style={{ color: a2Mode === mode.id ? mode.color : 'var(--text-dim)' }}>
                      {mode.label}
                    </span>
                  </div>
                  <span className="font-mono text-[9px] leading-relaxed" style={{ color: 'var(--text-dim)', paddingLeft: 12 }}>
                    {mode.note}
                  </span>
                </button>
              ))}
            </div>

            {/* Mode status badge */}
            <div className="mt-2 font-mono text-[9px] px-2 py-1 rounded inline-flex items-center gap-1.5"
              style={{
                color: A2_MODES[a2Mode].color,
                background: `${A2_MODES[a2Mode].color}10`,
                border: `1px solid ${A2_MODES[a2Mode].color}30`,
              }}>
              <div className="w-1 h-1 rounded-full" style={{ background: A2_MODES[a2Mode].color }} />
              {A2_MODES[a2Mode].status}
            </div>
          </div>

          {/* ── RESERVIERUNGSMODUS ── */}
          <div className="mb-4">
            <FieldLabel>RESERVIERUNGSOPTION</FieldLabel>
            <div className="flex items-center gap-2 mt-1">
              {Object.values(RESERVATION_MODES).map(rm => (
                <button
                  key={rm.id}
                  onClick={() => setReservMode(rm.id)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded font-mono text-[10px] font-medium transition-all"
                  style={{
                    background: reservMode === rm.id ? 'rgba(155,110,243,0.12)' : 'rgba(255,255,255,0.02)',
                    color: reservMode === rm.id ? '#9b6ef3' : 'var(--text-dim)',
                    border: `1px solid ${reservMode === rm.id ? 'rgba(155,110,243,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  <div className="w-3 h-3 rounded border flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: reservMode === rm.id ? '#9b6ef3' : 'rgba(255,255,255,0.2)', background: reservMode === rm.id ? '#9b6ef3' : 'transparent' }}>
                    {reservMode === rm.id && <Check size={7} style={{ color: '#fff' }} />}
                  </div>
                  {rm.label}
                </button>
              ))}
            </div>
            <div className="mt-1.5 font-mono text-[9px]" style={{ color: 'var(--text-dim)' }}>
              {reservMode === 'with'
                ? '→ Reservierungsbereich + "Jetzt reservieren" CTA wird prominent platziert'
                : `→ Alternativer Haupt-CTA: ${lead.phone || lead.content?.telefon ? `"Jetzt anrufen: ${lead.phone || lead.content?.telefon}"` : '"Kontakt aufnehmen"'}`}
            </div>
          </div>

          {/* ── BUILD OPTIONS ── */}
          <div className="mb-4 space-y-4">
            {/* Poe Image Model */}
            <div>
              <FieldLabel>POE BILDMODELL</FieldLabel>
              <div className="grid grid-cols-3 gap-1.5 mt-1">
                {POE_IMAGE_MODELS.map(m => (
                  <button key={m.id} onClick={() => setA2PoeModel(m.id)}
                    className="flex flex-col gap-0.5 px-2.5 py-2 rounded text-left transition-all"
                    style={{
                      background: a2PoeModel === m.id ? 'rgba(155,110,243,0.12)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${a2PoeModel === m.id ? 'rgba(155,110,243,0.4)' : 'rgba(255,255,255,0.07)'}`,
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: a2PoeModel === m.id ? '#9b6ef3' : 'rgba(255,255,255,0.2)' }} />
                      <span className="font-mono text-[10px] font-bold" style={{ color: a2PoeModel === m.id ? '#9b6ef3' : 'var(--text-dim)' }}>
                        {m.label}{m.recommended ? ' ★' : ''}
                      </span>
                    </div>
                    <span className="font-mono text-[8px]" style={{ color: 'var(--text-dim)', paddingLeft: 12 }}>{m.note}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Animation Level */}
              <div>
                <FieldLabel>ANIMATION</FieldLabel>
                <div className="flex flex-col gap-1 mt-1">
                  {ANIMATION_LEVELS.map(a => (
                    <button key={a.id} onClick={() => setA2AnimLevel(a.id)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded text-left"
                      style={{ background: a2AnimLevel === a.id ? 'rgba(155,110,243,0.1)' : 'transparent', border: `1px solid ${a2AnimLevel === a.id ? 'rgba(155,110,243,0.3)' : 'rgba(255,255,255,0.06)'}` }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: a2AnimLevel === a.id ? '#9b6ef3' : 'rgba(255,255,255,0.15)' }} />
                      <div>
                        <div className="font-mono text-[9px] font-bold" style={{ color: a2AnimLevel === a.id ? '#9b6ef3' : 'var(--text-dim)' }}>{a.label}{a.recommended ? ' ★' : ''}</div>
                        <div className="font-mono text-[8px]" style={{ color: 'var(--text-dim)', opacity: 0.6 }}>{a.note}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Mood */}
              <div>
                <FieldLabel>FARBSTIMMUNG</FieldLabel>
                <div className="flex flex-col gap-1 mt-1">
                  {COLOR_MOODS.map(c => (
                    <button key={c.id} onClick={() => setA2ColorMood(c.id)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded text-left"
                      style={{ background: a2ColorMood === c.id ? 'rgba(155,110,243,0.1)' : 'transparent', border: `1px solid ${a2ColorMood === c.id ? 'rgba(155,110,243,0.3)' : 'rgba(255,255,255,0.06)'}` }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: a2ColorMood === c.id ? '#9b6ef3' : 'rgba(255,255,255,0.15)' }} />
                      <div>
                        <div className="font-mono text-[9px] font-bold" style={{ color: a2ColorMood === c.id ? '#9b6ef3' : 'var(--text-dim)' }}>{c.label}{c.recommended ? ' ★' : ''}</div>
                        <div className="font-mono text-[8px]" style={{ color: 'var(--text-dim)', opacity: 0.6 }}>{c.note}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Typography */}
              <div>
                <FieldLabel>TYPOGRAFIE</FieldLabel>
                <div className="flex flex-col gap-1 mt-1">
                  {TYPOGRAPHY_STYLES.map(t => (
                    <button key={t.id} onClick={() => setA2Typo(t.id)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded text-left"
                      style={{ background: a2Typo === t.id ? 'rgba(155,110,243,0.1)' : 'transparent', border: `1px solid ${a2Typo === t.id ? 'rgba(155,110,243,0.3)' : 'rgba(255,255,255,0.06)'}` }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: a2Typo === t.id ? '#9b6ef3' : 'rgba(255,255,255,0.15)' }} />
                      <div>
                        <div className="font-mono text-[9px] font-bold" style={{ color: a2Typo === t.id ? '#9b6ef3' : 'var(--text-dim)' }}>{t.label}{t.recommended ? ' ★' : ''}</div>
                        <div className="font-mono text-[8px]" style={{ color: 'var(--text-dim)', opacity: 0.6 }}>{t.note}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sections */}
            <div>
              <FieldLabel>SEKTIONEN</FieldLabel>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {SITE_SECTIONS.map(s => {
                  const active = a2Sections.includes(s.id)
                  return (
                    <button key={s.id}
                      onClick={() => setA2Sections(prev =>
                        prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id]
                      )}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-[9px] transition-all"
                      style={{
                        background: active ? 'rgba(155,110,243,0.1)' : 'rgba(255,255,255,0.02)',
                        color: active ? '#9b6ef3' : 'var(--text-dim)',
                        border: `1px solid ${active ? 'rgba(155,110,243,0.35)' : 'rgba(255,255,255,0.07)'}`,
                      }}
                    >
                      <div className="w-2 h-2 rounded border flex items-center justify-center flex-shrink-0"
                        style={{ borderColor: active ? '#9b6ef3' : 'rgba(255,255,255,0.2)', background: active ? '#9b6ef3' : 'transparent' }}>
                        {active && <Check size={7} style={{ color: '#fff' }} />}
                      </div>
                      {s.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── BILD-AUSWAHL ── */}
          {allImages.length > 0 && (
            <div className="mb-4">
              <FieldLabel>BILDER FÜR BUILD ({selImgs.size}/{allImages.length} gewählt)</FieldLabel>
              <div className="grid grid-cols-4 gap-2 mt-1.5">
                {allImages.map((img, i) => (
                  <ImageCard key={i} img={img} selected={selImgs.has(i)}
                    onToggle={() => setSelImgs(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n })} />
                ))}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <button onClick={() => setSelImgs(new Set(allImages.map((_, i) => i)))}
                  className="font-mono text-[9px] px-2 py-0.5 rounded"
                  style={{ color: 'var(--text-dim)', border: '1px solid var(--border-dim)' }}>Alle</button>
                <button onClick={() => setSelImgs(new Set())}
                  className="font-mono text-[9px] px-2 py-0.5 rounded"
                  style={{ color: 'var(--text-dim)', border: '1px solid var(--border-dim)' }}>Keine</button>
              </div>
            </div>
          )}

          {/* ── PROMPT GENERATOR ── */}
          <div className="mb-4 rounded overflow-hidden" style={{ border: '1px solid rgba(155,110,243,0.25)' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2"
              style={{ background: 'rgba(155,110,243,0.08)', borderBottom: '1px solid rgba(155,110,243,0.15)' }}>
              <div>
                <div className="font-mono text-[10px] font-bold" style={{ color: '#9b6ef3' }}>
                  CLAUDE CODE BUILD-PROMPT
                </div>
                <div className="font-mono text-[9px] mt-0.5" style={{ color: 'var(--text-dim)' }}>
                  Designreferenz: Project Napoli Premium · taste-skill · emilkowalski · impeccable
                </div>
              </div>
              <button
                onClick={copyPrompt}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-[10px] font-bold flex-shrink-0"
                style={{
                  color: promptCopied ? '#2ddb72' : '#9b6ef3',
                  background: promptCopied ? 'rgba(45,219,114,0.1)' : 'rgba(155,110,243,0.1)',
                  border: `1px solid ${promptCopied ? 'rgba(45,219,114,0.35)' : 'rgba(155,110,243,0.35)'}`,
                }}
              >
                {promptCopied ? <Check size={9} /> : <Copy size={9} />}
                {promptCopied ? 'KOPIERT' : 'KOPIEREN'}
              </button>
            </div>

            {/* Prompt preview — key parameters */}
            <div className="px-3 py-3 space-y-1.5">
              {[
                { label: 'Lead',        value: lead.name || lead.lead_id },
                { label: 'Designref.',  value: 'Project Napoli Premium', color: '#9b6ef3' },
                { label: 'Skills',      value: 'taste-skill + emilkowalski + impeccable', color: '#9b6ef3' },
                { label: 'Reservierung',value: reservMode === 'with' ? 'Mit Reservierung' : 'Ohne Reservierung', color: reservMode === 'with' ? '#2ddb72' : '#f5a623' },
                { label: 'Bildmodell',  value: a2PoeModel, color: '#e8197f' },
                { label: 'Animation',   value: a2AnimLevel, color: '#9b6ef3' },
                { label: 'Farbe',       value: a2ColorMood, color: '#9b6ef3' },
                { label: 'Typografie',  value: a2Typo, color: '#9b6ef3' },
                { label: 'Sektionen',   value: `${a2Sections.length} aktiv`, color: '#2ddb72' },
                { label: 'Bilder',      value: `${selImgs.size} ausgewählt`, color: selImgs.size > 0 ? '#2ddb72' : '#f5a623' },
                { label: 'Modus',       value: A2_MODES[a2Mode].status, color: A2_MODES[a2Mode].color },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-start gap-2">
                  <span className="font-mono text-[9px] w-20 flex-shrink-0 mt-0.5" style={{ color: 'var(--text-dim)' }}>{label}</span>
                  <span className="font-mono text-[9px]" style={{ color: color || 'var(--text)' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── START BUTTONS nach Modus ── */}
          <div className="space-y-2">
            {/* EMPFOHLEN: Manual / Remote */}
            {(a2Mode === 'manual' || a2Mode === 'remote') && (
              <div className="p-3 rounded" style={{ background: 'rgba(155,110,243,0.06)', border: '1px solid rgba(155,110,243,0.2)' }}>
                <div className="font-mono text-[9px] font-bold mb-2" style={{ color: '#9b6ef3' }}>
                  ★ EMPFOHLEN — Claude Code {a2Mode === 'remote' ? 'Remote / Desktop' : 'Manual'}
                </div>
                <ol className="space-y-1">
                  {(a2Mode === 'manual' ? [
                    'Prompt oben kopieren (KOPIEREN Button)',
                    'Terminal öffnen → claude (Claude Code CLI starten)',
                    'Prompt einfügen → Enter',
                    'Claude Code baut und deployt die Site',
                    'Preview-URL in das Feld unten eintragen',
                  ] : [
                    'Prompt oben kopieren (KOPIEREN Button)',
                    'Claude.ai oder Claude Code Desktop App öffnen',
                    'Neues Gespräch → Prompt einfügen',
                    'Claude Code Remote baut und deployt die Site',
                    'Preview-URL in das Feld unten eintragen',
                  ]).map((step, i) => (
                    <li key={i} className="flex items-start gap-2 font-mono text-[9px]" style={{ color: 'var(--text-dim)' }}>
                      <span className="flex-shrink-0 font-bold" style={{ color: '#9b6ef3' }}>{i+1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
                <button
                  onClick={copyPrompt}
                  className="mt-3 flex items-center gap-2 px-4 py-2 rounded font-mono text-xs font-bold w-full justify-center"
                  style={{ background: 'rgba(155,110,243,0.14)', color: '#9b6ef3', border: '1px solid rgba(155,110,243,0.4)' }}
                >
                  <Copy size={11} />
                  {promptCopied ? 'PROMPT KOPIERT ✓' : 'BUILD-PROMPT KOPIEREN'}
                </button>
              </div>
            )}

            {/* Runner Mode — VPS Builder, vollautonom */}
            {a2Mode === 'runner' && <VpsBuildPanel lead={lead} />}

            {/* A7 Fallback */}
            {a2Mode === 'fallback' && (
              <div className="p-3 rounded" style={{ background: 'rgba(82,82,107,0.08)', border: '1px solid rgba(82,82,107,0.25)' }}>
                <div className="font-mono text-[9px] font-bold mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  A7 API Builder Fallback — schwächerer Output
                </div>
                <div className="font-mono text-[9px] mb-2 leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                  Nutzt den n8n A7-Webhook (Poe/Claude API). Kein lokales Repo-Kontext, keine Claude Code Skills.
                  Für schnelle Prototypen oder wenn kein Claude Code verfügbar.
                </div>
                <AgentAction
                  label="A7 API FALLBACK STARTEN"
                  status={a2Status}
                  msg={a2Msg}
                  onClick={runA2Webhook}
                  disabled={!isWebhookConfigured(7)}
                  disabledNote={!isWebhookConfigured(7) ? 'needs_connection — VITE_N8N_AGENT7_WEBHOOK fehlt' : null}
                  color="rgba(255,255,255,0.35)"
                  icon={<Zap size={11} />}
                />
              </div>
            )}
          </div>

          {/* Preview URL input — editable, auto-links to A3 */}
          {(a2Mode === 'manual' || a2Mode === 'remote' || a2Mode === 'runner') && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <FieldLabel>PREVIEW-URL (nach Build eintragen → A3 Score starten)</FieldLabel>
                {a2DeployedUrl && (
                  <span className="font-mono text-[9px]" style={{ color: '#2ddb72' }}>✓ URL gesetzt — A3 bereit</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  placeholder="https://dein-restaurant.vercel.app"
                  className="flex-1 px-3 py-2 rounded font-mono text-xs outline-none"
                  style={{
                    background: a2DeployedUrl ? 'rgba(45,219,114,0.04)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${a2DeployedUrl ? 'rgba(45,219,114,0.25)' : 'rgba(255,255,255,0.12)'}`,
                    color: 'var(--text)',
                  }}
                  value={a2DeployedUrl || build.demo_url || ''}
                  onChange={e => { setA2DeployedUrl(e.target.value); setA3ScoredUrl(e.target.value) }}
                />
                {(a2DeployedUrl || build.demo_url) && (
                  <a href={a2DeployedUrl || build.demo_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-2 rounded font-mono text-[10px] flex-shrink-0"
                    style={{ color: '#2ddb72', background: 'rgba(45,219,114,0.08)', border: '1px solid rgba(45,219,114,0.25)' }}>
                    <ExternalLink size={9} /> Open
                  </a>
                )}
              </div>
              {a2DeployedUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="font-mono text-[9px] px-2 py-1 rounded flex-1"
                    style={{ background: 'rgba(232,25,127,0.06)', border: '1px solid rgba(232,25,127,0.2)', color: '#e8197f' }}>
                    ✓ URL gespeichert — A3 Quality Score automatisch verfügbar. Scrolle zu A3 Agent.
                  </div>
                </div>
              )}
            </div>
          )}
        </AgentSection>

        {/* ── A3: QUALITY SCORER ── */}
        <AgentSection agentId={3} status={a3Status}>
          {/* URL Input — auto-filled from A2 */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <FieldLabel>DEMO URL ZUM ANALYSIEREN</FieldLabel>
              {(a2DeployedUrl || build?.demo_url) && !a3ScoredUrl && (
                <button onClick={() => setA3ScoredUrl(a2DeployedUrl || build?.demo_url)}
                  className="font-mono text-[9px] px-2 py-0.5 rounded flex items-center gap-1"
                  style={{ color: '#e8197f', border: '1px solid rgba(232,25,127,0.3)', background: 'rgba(232,25,127,0.06)' }}>
                  ← Von A2 übernehmen
                </button>
              )}
            </div>
            <input
              type="text"
              placeholder="https://dein-restaurant.vercel.app"
              value={a3ScoredUrl || a2DeployedUrl || build?.demo_url || ''}
              onChange={e => setA3ScoredUrl(e.target.value)}
              className="w-full px-3 py-2 rounded font-mono text-xs outline-none"
              style={{
                background: (a3ScoredUrl || a2DeployedUrl || build?.demo_url) ? 'rgba(232,25,127,0.04)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${(a3ScoredUrl || a2DeployedUrl || build?.demo_url) ? 'rgba(232,25,127,0.25)' : 'rgba(255,255,255,0.12)'}`,
                color: 'var(--text)',
              }}
            />
          </div>

          {/* Progress */}
          {a3Step && (
            <div className="mb-3 font-mono text-[9px] px-3 py-2 rounded flex items-center gap-2"
              style={{
                background: a3Status === JOB_STATUS.ERROR ? 'rgba(255,59,59,0.06)' : 'rgba(232,25,127,0.06)',
                border: `1px solid ${a3Status === JOB_STATUS.ERROR ? 'rgba(255,59,59,0.2)' : 'rgba(232,25,127,0.2)'}`,
                color: a3Status === JOB_STATUS.ERROR ? '#ff3b3b' : '#e8197f',
              }}>
              {a3Status === JOB_STATUS.RUNNING && <RefreshCw size={9} className="animate-spin flex-shrink-0" />}
              {a3Step}
            </div>
          )}

          {/* Score Results */}
          {a3Score && (
            <div className="space-y-3 mb-4">
              {/* Main scores */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'GESAMT-SCORE', value: a3Score.overall_score, suffix: '/100', color: a3Score.overall_score >= 80 ? '#2ddb72' : a3Score.overall_score >= 65 ? '#f5a623' : '#ff3b3b' },
                  { label: 'CONFIDENCE', value: a3Score.confidence_score, suffix: '%', color: a3Score.confidence_score >= 75 ? '#2ddb72' : a3Score.confidence_score >= 50 ? '#f5a623' : '#ff3b3b' },
                  { label: 'SCHÄTZWERT', value: `€${(a3Score.estimated_value_eur || 0).toLocaleString('de')}`, suffix: '', color: '#9b6ef3', raw: true },
                ].map(({ label, value, suffix, color, raw }) => (
                  <div key={label} className="p-3 rounded text-center"
                    style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                    <div className="font-mono text-[9px] mb-1.5" style={{ color: 'var(--text-dim)' }}>{label}</div>
                    <div className="font-mono font-black" style={{ fontSize: 24, color, lineHeight: 1 }}>
                      {raw ? value : value}
                    </div>
                    {suffix && !raw && <div className="font-mono text-[9px] mt-0.5" style={{ color: `${color}80` }}>{suffix}</div>}
                  </div>
                ))}
              </div>

              {/* Grade + Verdict */}
              <div className="p-3 rounded" style={{ background: 'rgba(232,25,127,0.06)', border: '1px solid rgba(232,25,127,0.2)' }}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono font-black text-2xl" style={{ color: '#e8197f' }}>
                    {a3Score.grade || '—'}
                  </span>
                  <span className="font-mono text-[9px]" style={{ color: '#e8197f' }}>
                    {a3Score.a5_price_adjustment === 'increase' ? '↑ Preis erhöhen' : a3Score.a5_price_adjustment === 'decrease' ? '↓ Preis senken' : '→ Preis neutral'}
                  </span>
                </div>
                {a3Score.verdict && (
                  <p className="font-ui text-xs italic" style={{ color: 'var(--text-dim)' }}>"{a3Score.verdict}"</p>
                )}
              </div>

              {/* Criteria grid */}
              {a3Score.criteria && (
                <div>
                  <FieldLabel>12 BEWERTUNGSKRITERIEN</FieldLabel>
                  <div className="space-y-1.5 mt-1">
                    {Object.entries(a3Score.criteria).map(([key, val]) => {
                      const label = {
                        design_quality: 'Design', modernity: 'Modernität', mobile_experience: 'Mobile',
                        ux_ui: 'UX/UI', animation_quality: 'Animationen', content_quality: 'Content',
                        image_quality: 'Bilder', conversion_potential: 'Conversion', load_performance: 'Performance',
                        brand_impact: 'Markenwirkung', trust_professionalism: 'Vertrauen', agency_comparison: 'vs. Agenturen',
                      }[key] || key
                      const c = val >= 80 ? '#2ddb72' : val >= 60 ? '#f5a623' : '#ff3b3b'
                      return (
                        <div key={key}>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-mono text-[9px]" style={{ color: 'var(--text-dim)' }}>{label}</span>
                            <span className="font-mono text-[10px] font-bold" style={{ color: c }}>{val}</span>
                          </div>
                          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <motion.div className="h-full rounded-full" style={{ background: c }}
                              initial={{ width: 0 }} animate={{ width: `${val}%` }}
                              transition={{ duration: 0.5, ease: EASE }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-2 gap-3">
                {a3Score.strengths?.length > 0 && (
                  <div>
                    <FieldLabel>STÄRKEN</FieldLabel>
                    {a3Score.strengths.map((s, i) => (
                      <div key={i} className="flex items-start gap-1.5 font-mono text-[9px] mt-1.5" style={{ color: '#2ddb72' }}>
                        <CheckCircle size={8} className="flex-shrink-0 mt-0.5" /> {s}
                      </div>
                    ))}
                  </div>
                )}
                {a3Score.weaknesses?.length > 0 && (
                  <div>
                    <FieldLabel>SCHWÄCHEN</FieldLabel>
                    {a3Score.weaknesses.map((w, i) => (
                      <div key={i} className="flex items-start gap-1.5 font-mono text-[9px] mt-1.5" style={{ color: '#ff6b6b' }}>
                        <XCircle size={8} className="flex-shrink-0 mt-0.5" /> {w}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Improvement actions */}
              {a3Score.improvement_actions?.length > 0 && (
                <div>
                  <FieldLabel>VERBESSERUNGS-MASSNAHMEN (priorisiert)</FieldLabel>
                  {a3Score.improvement_actions.map((a, i) => (
                    <div key={i} className="flex items-start gap-2 font-mono text-[9px] mt-1.5" style={{ color: '#00d4ff' }}>
                      <span className="flex-shrink-0 font-bold" style={{ color: '#9b6ef3' }}>{i+1}.</span>
                      {a}
                    </div>
                  ))}
                </div>
              )}

              {/* A5 / A6 Feed notice */}
              <div className="p-2 rounded font-mono text-[9px]"
                style={{ background: 'rgba(155,110,243,0.06)', border: '1px solid rgba(155,110,243,0.2)', color: '#9b6ef3' }}>
                ✓ A5 und A6 verwenden diesen Score automatisch — Preis + Trust werden angepasst.
              </div>

              {/* Live Site iframe */}
              {(a3ScoredUrl || a2DeployedUrl || build?.demo_url) && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <FieldLabel>BEWERTETE SITE (LIVE)</FieldLabel>
                    <a href={a3ScoredUrl || a2DeployedUrl || build?.demo_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 font-mono text-[9px]" style={{ color: '#e8197f' }}>
                      <ExternalLink size={9} /> Öffnen
                    </a>
                  </div>
                  <div className="rounded overflow-hidden" style={{ border: '1px solid rgba(232,25,127,0.2)', height: 380 }}>
                    <iframe src={a3ScoredUrl || a2DeployedUrl || build?.demo_url} title="Site Preview"
                      style={{ width: '100%', height: '100%', border: 0, background: '#fff' }} loading="lazy" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No score yet — show iframe if URL available */}
          {!a3Score && (a3ScoredUrl || a2DeployedUrl || build?.demo_url) && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <FieldLabel>SITE VORSCHAU</FieldLabel>
                <a href={a3ScoredUrl || a2DeployedUrl || build?.demo_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 font-mono text-[9px]" style={{ color: '#e8197f' }}>
                  <ExternalLink size={9} /> Öffnen
                </a>
              </div>
              <div className="rounded overflow-hidden" style={{ border: '1px solid rgba(232,25,127,0.2)', height: 380 }}>
                <iframe src={a3ScoredUrl || a2DeployedUrl || build?.demo_url} title="Site Preview"
                  style={{ width: '100%', height: '100%', border: 0, background: '#fff' }} loading="lazy" />
              </div>
            </div>
          )}

          <AgentAction
            label={a3Score ? 'A3 NEU BEWERTEN' : 'A3 QUALITY SCORE STARTEN'}
            status={a3Status}
            msg=""
            onClick={runA3Score}
            disabled={!a3ScoredUrl && !a2DeployedUrl && !build?.demo_url}
            disabledNote={!a3ScoredUrl && !a2DeployedUrl && !build?.demo_url ? 'Demo URL eingeben (A2 zuerst deployen)' : null}
            color="#e8197f"
            icon={<BarChart2 size={11} />}
          />
          <div className="font-mono text-[9px] mt-2" style={{ color: 'var(--text-dim)' }}>
            Modell: Gemini Flash (schnell + günstig) · HTML-Analyse + 12 Kriterien · strenger Maßstab
          </div>
        </AgentSection>

        {/* ── A4: HUMAN WRITER ── */}
        <AgentSection agentId={4} status={a4Status}>
          {/* Tone selector */}
          <div className="flex items-center gap-2 mb-3">
            <FieldLabel>Tonalität:</FieldLabel>
            {[['direkt', 'Direkt'], ['locker', 'Locker'], ['premium', 'Premium']].map(([v, l]) => (
              <button key={v} onClick={() => setA4Tone(v)}
                className="px-2.5 py-0.5 rounded font-mono text-[10px]"
                style={{
                  color: a4Tone === v ? '#f5a623' : 'var(--text-dim)',
                  background: a4Tone === v ? 'rgba(245,166,35,0.1)' : 'transparent',
                  border: `1px solid ${a4Tone === v ? 'rgba(245,166,35,0.35)' : 'var(--border-dim)'}`,
                }}>
                {l}
              </button>
            ))}
          </div>

          {/* Generated texts */}
          {a4Texts && (
            <div className="space-y-2 mb-3">
              {[
                ['email_v1',    'E-Mail Variante 1',      <Mail size={9} />],
                ['email_v2',    'E-Mail Variante 2',      <Mail size={9} />],
                ['dm_text',     'Instagram / DM',         <FileText size={9} />],
                ['followup',    'Follow-up (5 Tage)',     <RefreshCw size={9} />],
                ['call_script', 'Call Script (60 Sek.)', <Phone size={9} />],
              ].map(([key, label, icon]) => {
                const val = a4Texts[key]
                if (!val) return null
                return (
                  <div key={key} className="p-3 rounded" style={{ background: 'rgba(245,166,35,0.04)', border: '1px solid rgba(245,166,35,0.15)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span style={{ color: '#f5a623' }}>{icon}</span>
                        <FieldLabel>{label}</FieldLabel>
                      </div>
                      <button onClick={() => copyText(key, val)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[9px]"
                        style={{ color: copiedKey === key ? '#2ddb72' : '#f5a623', border: '1px solid currentColor', background: 'rgba(245,166,35,0.06)' }}>
                        {copiedKey === key ? <Check size={8} /> : <Copy size={8} />}
                        {copiedKey === key ? 'Kopiert!' : 'Kopieren'}
                      </button>
                    </div>
                    <p className="font-ui text-xs leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text)' }}>
                      {val}
                    </p>
                  </div>
                )
              })}
            </div>
          )}

          <AgentAction
            label="A4 VERKAUFSTEXT SCHREIBEN"
            status={a4Status}
            msg={a4Msg}
            onClick={runA4}
            color="#f5a623"
            icon={<FileText size={11} />}
          />
        </AgentSection>

        {/* ── A5: PRICING AGENT ── */}
        <AgentSection agentId={5} status={a5Status}>
          {a5Result && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                ['Min', a5Result.price_min, 'rgba(255,255,255,0.3)'],
                ['Empfehlung', a5Result.price_recommended, '#2ddb72'],
                ['Premium', a5Result.price_premium, '#9b6ef3'],
              ].map(([label, price, color]) => (
                <div key={label} className="p-3 rounded text-center"
                  style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                  <div className="font-mono text-[9px] mb-1" style={{ color: 'var(--text-dim)' }}>{label}</div>
                  <div className="font-mono text-xl font-black" style={{ color }}>€{price}</div>
                  <div className="font-mono text-[9px] mt-0.5" style={{ color: 'var(--text-dim)' }}>/ mo</div>
                </div>
              ))}
            </div>
          )}
          {a5Result && (
            <>
              <div className="flex items-center gap-2 mb-2 p-2.5 rounded"
                style={{ background: 'rgba(45,219,114,0.06)', border: '1px solid rgba(45,219,114,0.15)' }}>
                <TrendingUp size={10} style={{ color: '#2ddb72' }} />
                <span className="font-mono text-[10px]" style={{ color: '#2ddb72' }}>
                  Closing Chance: {a5Result.closing_chance}%
                </span>
                {a5Result.a3_site_score && (
                  <span className="ml-auto font-mono text-[9px] px-2 py-0.5 rounded"
                    style={{ color: '#e8197f', background: 'rgba(232,25,127,0.08)', border: '1px solid rgba(232,25,127,0.2)' }}>
                    A3 Site: {a5Result.a3_site_score}/100
                  </span>
                )}
              </div>
              {a5Result.a3_estimated_value && (
                <div className="mb-2 font-mono text-[9px] px-2.5 py-1.5 rounded"
                  style={{ background: 'rgba(155,110,243,0.06)', border: '1px solid rgba(155,110,243,0.2)', color: '#9b6ef3' }}>
                  A3 Schätzwert der Site: €{a5Result.a3_estimated_value.toLocaleString('de')} (Agentur-Benchmark)
                </div>
              )}
              <p className="font-mono text-[9px] leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                {a5Result.reasoning}
              </p>
              {!a3Score && (
                <p className="font-mono text-[9px] mt-1.5" style={{ color: 'rgba(232,25,127,0.5)' }}>
                  → A3 Quality Score starten für genauere Preisberechnung
                </p>
              )}
            </>
          )}

          <AgentAction
            label={a5Result ? 'A5 NEU BERECHNEN' : 'A5 PREIS BERECHNEN'}
            status={a5Status}
            msg=""
            onClick={runA5}
            color="#2ddb72"
            icon={<DollarSign size={11} />}
          />
        </AgentSection>

        {/* ── A6: FACT CHECKER ── */}
        <AgentSection agentId={6} status={a6Result ? JOB_STATUS.DONE : a6Status}>
          {/* Results wenn vorhanden */}
          {a6Result ? (
            <div className="space-y-3">
              {/* Trust Score + Send Status */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded text-center"
                  style={{
                    background: a6Result.trust_score >= 70 ? 'rgba(45,219,114,0.06)' : a6Result.trust_score >= 50 ? 'rgba(245,166,35,0.06)' : 'rgba(255,59,59,0.06)',
                    border: `1px solid ${a6Result.trust_score >= 70 ? 'rgba(45,219,114,0.2)' : a6Result.trust_score >= 50 ? 'rgba(245,166,35,0.2)' : 'rgba(255,59,59,0.2)'}`,
                  }}>
                  <div className="font-mono text-[9px] mb-1" style={{ color: 'var(--text-dim)' }}>TRUST SCORE</div>
                  <div className="font-mono text-2xl font-black" style={{ color: a6Result.trust_score >= 70 ? '#2ddb72' : a6Result.trust_score >= 50 ? '#f5a623' : '#ff3b3b' }}>
                    {a6Result.trust_score}%
                  </div>
                </div>
                <div className="p-3 rounded text-center"
                  style={{
                    background: a6Result.hard_errors === 0 ? 'rgba(45,219,114,0.06)' : 'rgba(255,59,59,0.06)',
                    border: `1px solid ${a6Result.hard_errors === 0 ? 'rgba(45,219,114,0.2)' : 'rgba(255,59,59,0.2)'}`,
                  }}>
                  <div className="font-mono text-[9px] mb-1" style={{ color: 'var(--text-dim)' }}>HARTE FEHLER</div>
                  <div className="font-mono text-2xl font-black" style={{ color: a6Result.hard_errors === 0 ? '#2ddb72' : '#ff3b3b' }}>
                    {a6Result.hard_errors}
                  </div>
                </div>
                <div className="p-3 rounded text-center"
                  style={{
                    background: a6Result.send_status === 'ready_to_send' ? 'rgba(45,219,114,0.06)' : a6Result.send_status === 'needs_review' ? 'rgba(245,166,35,0.06)' : 'rgba(255,59,59,0.06)',
                    border: `1px solid ${a6Result.send_status === 'ready_to_send' ? 'rgba(45,219,114,0.2)' : a6Result.send_status === 'needs_review' ? 'rgba(245,166,35,0.2)' : 'rgba(255,59,59,0.2)'}`,
                  }}>
                  <div className="font-mono text-[9px] mb-1" style={{ color: 'var(--text-dim)' }}>STATUS</div>
                  <div className="font-mono text-[10px] font-bold mt-1" style={{ color: a6Result.send_status === 'ready_to_send' ? '#2ddb72' : a6Result.send_status === 'needs_review' ? '#f5a623' : '#ff3b3b' }}>
                    {a6Result.send_status === 'ready_to_send' ? '✓ BEREIT' : a6Result.send_status === 'needs_review' ? '⚠ REVIEW' : '✗ BLOCKIERT'}
                  </div>
                </div>
              </div>

              {/* Check Details */}
              <div className="space-y-1">
                <FieldLabel>GEPRÜFTE FELDER ({a6Result.checks?.length || 0})</FieldLabel>
                {(a6Result.checks || []).map((c, i) => {
                  const statusColor = c.type === 'ok' ? '#2ddb72' : c.type === 'hard' ? '#ff3b3b' : c.type === 'soft' ? '#f5a623' : '#52526b'
                  const statusIcon = c.type === 'ok' ? '✓' : c.type === 'hard' ? '✗' : c.type === 'soft' ? '⚠' : '○'
                  return (
                    <div key={i} className="flex items-start gap-2 py-1" style={{ borderBottom: '1px solid var(--border-dim)' }}>
                      <span className="font-mono text-[10px] font-bold flex-shrink-0 w-4" style={{ color: statusColor }}>{statusIcon}</span>
                      <span className="font-mono text-[9px] w-24 flex-shrink-0" style={{ color: 'var(--text-dim)' }}>{c.field}</span>
                      <div className="flex-1 min-w-0">
                        {c.value && <div className="font-mono text-[9px] truncate" style={{ color: 'var(--text)' }}>{c.value}</div>}
                        <div className="font-mono text-[9px]" style={{ color: statusColor, opacity: 0.8 }}>{c.note}</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Server checks notice */}
              <div className="p-2 rounded font-mono text-[9px]"
                style={{ background: 'rgba(245,166,35,0.05)', border: '1px solid rgba(245,166,35,0.15)', color: '#f5a623' }}>
                needs_webhook — URL-Erreichbarkeit + Impressum-Prüfung brauchen n8n Server-Check
              </div>

              <div className="font-mono text-[9px]" style={{ color: 'var(--text-dim)' }}>
                Geprüft: {a6Result.checked_at ? new Date(a6Result.checked_at).toLocaleString('de-DE') : '—'}
              </div>
            </div>
          ) : (
            <div className="mb-3 space-y-1">
              <FieldLabel>WIRD GEPRÜFT (client-seitig):</FieldLabel>
              {[
                { label: 'Website URL-Format', value: lead.website },
                { label: 'HTTPS', value: lead.website?.startsWith('https://') ? 'ja' : null },
                { label: 'Telefon-Format (DE)', value: content.telefon || lead.phone },
                { label: 'E-Mail-Format', value: content.email },
                { label: 'Adresse', value: content.adresse || lead.address },
                { label: 'Firmenname', value: lead.name },
                { label: 'Öffnungszeiten', value: content.oeffnungszeiten },
                { label: 'Bilder', value: allImages.length > 0 ? `${allImages.length} vorhanden` : null },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center gap-2 font-mono text-[9px]">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: value ? 'rgba(45,219,114,0.5)' : 'rgba(255,59,59,0.4)' }} />
                  <span style={{ color: 'var(--text-dim)' }}>{label}:</span>
                  <span style={{ color: value ? 'var(--text)' : 'rgba(255,59,59,0.5)' }}>
                    {value ? String(value).slice(0, 35) : 'fehlt'}
                  </span>
                </div>
              ))}
              <div className="mt-2 font-mono text-[9px]" style={{ color: 'var(--text-dim)', opacity: 0.6 }}>
                needs_webhook — URL-Erreichbarkeit + Impressum brauchen n8n Server-Check
              </div>
            </div>
          )}

          <AgentAction
            label={a6Result ? 'A6 NEU PRÜFEN' : 'A6 FAKTEN PRÜFEN'}
            status={a6Status}
            msg={a6Msg}
            onClick={runA6}
            color="#ff6b35"
            icon={<Shield size={11} />}
          />
        </AgentSection>

        {/* ── CONTENT (A-Pipe) ── */}
        {(content.ueber_uns || content.claim_slogan) && (
          <Card title="CONTENT — EXTRAHIERT" icon={Eye}>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                {content.claim_slogan && (
                  <div>
                    <FieldLabel>Claim / Slogan</FieldLabel>
                    <p className="font-ui text-sm italic leading-relaxed" style={{ color: 'var(--text-hi)' }}>
                      &ldquo;{content.claim_slogan}&rdquo;
                    </p>
                  </div>
                )}
                {content.ueber_uns && (
                  <div>
                    <FieldLabel>Über uns</FieldLabel>
                    <p className="font-ui text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
                      {content.ueber_uns}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <TagGroup label="Küche"         tags={content.kueche}        color="#e8197f" />
                <TagGroup label="Spezialitäten" tags={content.spezialitaeten} color="#f5a623" />
                <TagGroup label="Angebot"       tags={content.angebot}        color="#9b6ef3" />
              </div>
            </div>
          </Card>
        )}

        {/* ── KONZEPT ── */}
        {(concept.design_direction || concept.hero_headline) && (
          <Card title="KONZEPT" icon={Layout}>
            <div className="grid md:grid-cols-2 gap-4">
              {concept.design_direction && (
                <div><FieldLabel>Design Direction</FieldLabel>
                  <p className="font-ui text-sm" style={{ color: 'var(--text-hi)' }}>{concept.design_direction}</p>
                </div>
              )}
              {concept.hero_headline && (
                <div><FieldLabel>Hero Headline</FieldLabel>
                  <p className="font-ui text-sm italic" style={{ color: 'var(--text-hi)' }}>
                    &ldquo;{concept.hero_headline}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}
      </motion.div>
    </ErrorBoundary>
  )
}

// ── AgentSection — wrapper for each agent block ───────────────────────────────

function AgentSection({ agentId, status, children }) {
  const agent      = AGENTS[agentId]
  const statusColor = JOB_STATUS_COLOR[status] || 'var(--text-dim)'
  const statusLabel = JOB_STATUS_LABEL[status] || status

  return (
    <div style={{
      background: 'var(--bg-panel)',
      border: `1px solid ${status === JOB_STATUS.DONE ? `${agent?.color}30` : status === JOB_STATUS.ERROR ? 'rgba(255,59,59,0.3)' : 'var(--border)'}`,
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      {/* Agent header */}
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid var(--border-dim)' }}>
        <div
          className="w-6 h-6 rounded flex items-center justify-center font-mono text-[10px] font-black flex-shrink-0"
          style={{
            background: `${agent?.color || '#fff'}15`,
            color: agent?.color || 'var(--text-dim)',
            border: `1px solid ${agent?.color || 'var(--border)'}30`,
          }}
        >
          {agent?.glyph || `A${agentId}`}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[10px] font-bold" style={{ color: agent?.color || 'var(--text-dim)' }}>
            {agent?.name || `Agent ${agentId}`}
          </div>
          <div className="font-mono text-[9px]" style={{ color: 'var(--text-dim)' }}>
            {agent?.role || '—'}
          </div>
        </div>
        <div
          className="font-mono text-[9px] px-2 py-0.5 rounded flex-shrink-0"
          style={{
            color: statusColor,
            background: `${statusColor}12`,
            border: `1px solid ${statusColor}30`,
          }}
        >
          {statusLabel}
        </div>
      </div>

      <div className="p-4">
        {children}
      </div>
    </div>
  )
}

// ── AgentAction — CTA button with status ─────────────────────────────────────

function AgentAction({ label, status, msg, onClick, disabled, disabledNote, color, icon, inline }) {
  const isRunning = status === JOB_STATUS.RUNNING
  const isDisabled = disabled || isRunning

  return (
    <div className={inline ? 'inline-flex flex-col items-start gap-1' : 'mt-3 flex flex-col gap-1'}>
      <motion.button
        onClick={onClick}
        disabled={isDisabled}
        className="flex items-center gap-2 px-4 py-2 rounded font-mono text-xs font-bold"
        style={{
          background: isDisabled ? 'rgba(255,255,255,0.02)' : `${color}12`,
          color:      isDisabled ? 'var(--text-dim)' : color,
          border:     `1px solid ${isDisabled ? 'var(--border)' : `${color}35`}`,
          cursor:     isDisabled ? 'not-allowed' : 'pointer',
        }}
        whileHover={!isDisabled ? { scale: 1.02, boxShadow: `0 0 12px ${color}25` } : {}}
        whileTap={!isDisabled ? { scale: 0.97 } : {}}
        transition={{ duration: 0.1 }}
      >
        {isRunning ? <RefreshCw size={11} className="animate-spin" /> : icon}
        {isRunning ? 'LÄUFT...' : label}
      </motion.button>
      {disabledNote && (
        <div className="font-mono text-[9px]" style={{ color: '#f5a623' }}>{disabledNote}</div>
      )}
      {msg && (
        <motion.div
          initial={{ opacity: 0, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-mono text-[10px]"
          style={{ color: status === JOB_STATUS.ERROR ? '#ff3b3b' : status === JOB_STATUS.DONE ? '#2ddb72' : 'var(--text-dim)' }}
        >
          {msg}
        </motion.div>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Card({ title, icon: Icon, children }) {
  return (
    <div className="p-4" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 8 }}>
      {title && (
        <div className="flex items-center gap-1.5 mb-3 pb-2.5" style={{ borderBottom: '1px solid var(--border-dim)' }}>
          {Icon && <Icon size={10} style={{ color: 'var(--text-dim)', opacity: 0.6 }} />}
          <span className="font-mono text-[9px] tracking-widest" style={{ color: 'var(--text-dim)' }}>{title}</span>
        </div>
      )}
      {children}
    </div>
  )
}

function Stat({ value, label, color, xl }) {
  return (
    <div className="text-center flex-shrink-0">
      <div className="font-mono font-black tabular-nums leading-none"
        style={{ color: color || 'var(--text-dim)', fontSize: xl ? 40 : 26 }}>
        {value !== undefined && value !== null && value !== '' ? value : '—'}
      </div>
      <div className="font-mono text-[9px] tracking-widest mt-1" style={{ color: 'var(--text-dim)' }}>{label}</div>
    </div>
  )
}

function FieldLabel({ children }) {
  return (
    <div className="font-mono text-[9px] tracking-widest mb-1" style={{ color: 'var(--text-dim)', opacity: 0.7 }}>
      {children}
    </div>
  )
}

function ContactRow({ icon: Icon, label, value, link }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2 py-1.5" style={{ borderBottom: '1px solid var(--border-dim)' }}>
      <Icon size={10} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--text-dim)' }} />
      <span className="font-mono text-[9px] w-20 flex-shrink-0 mt-0.5" style={{ color: 'var(--text-dim)' }}>{label}</span>
      {link
        ? <a href={link} target="_blank" rel="noopener noreferrer"
            className="font-mono text-xs truncate hover:opacity-80" style={{ color: '#00d4ff' }}>{value}</a>
        : <span className="font-ui text-xs leading-relaxed" style={{ color: 'var(--text)' }}>{value}</span>
      }
    </div>
  )
}

function TagGroup({ label, tags, color }) {
  if (!Array.isArray(tags) || !tags.length) return null
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex flex-wrap gap-1">
        {tags.filter(Boolean).map((t, i) => (
          <span key={i} className="px-1.5 py-0.5 rounded font-mono text-[10px]"
            style={{ background: `${color}12`, color, border: `1px solid ${color}22` }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}

function EmptyState({ children, icon: Icon }) {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center">
      {Icon && <Icon size={18} style={{ color: 'var(--text-dim)', opacity: 0.3 }} />}
      <p className="font-mono text-[10px] max-w-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
        {children}
      </p>
    </div>
  )
}

function ImageCard({ img, selected, onToggle }) {
  return (
    <motion.div onClick={onToggle} className="relative cursor-pointer overflow-hidden"
      style={{ borderRadius: 6, border: `2px solid ${selected ? '#9b6ef3' : 'rgba(255,255,255,0.05)'}`, transition: 'border-color 150ms' }}
      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.1 }}>
      <div style={{ aspectRatio: '16/10', background: 'rgba(255,255,255,0.03)' }}>
        <img src={img.url} alt={img.label} className="w-full h-full object-cover"
          style={{ opacity: selected ? 1 : 0.35, transition: 'opacity 150ms' }}
          onError={e => { e.target.style.display = 'none' }} />
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-2 py-1"
        style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
        <span className="font-mono text-[9px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{img.label}</span>
        <div className="w-4 h-4 rounded-full flex items-center justify-center"
          style={{ background: selected ? '#9b6ef3' : 'rgba(255,255,255,0.08)' }}>
          {selected ? <Check size={8} style={{ color: '#fff' }} /> : <X size={8} style={{ color: 'rgba(255,255,255,0.3)' }} />}
        </div>
      </div>
    </motion.div>
  )
}

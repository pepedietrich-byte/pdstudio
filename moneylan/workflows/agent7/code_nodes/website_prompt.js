// Agent 7 — Node: "Website-Prompt bauen"
// Model: Claude-3-Haiku (test) → switch to impeccable/taste-skill/emilkowski after validation
const data       = $input.first().json;
const leadId     = data.lead_id;
const lead       = data.lead       || {};
const content    = data.content    || {};
const images     = data.images     || {};
const concept    = data.concept    || {};
const promptData = data.prompt_data || {};

let originalHtml = '';
try {
  const htmlNode = $('Original-URL fetchen').first();
  originalHtml = htmlNode.json.body || htmlNode.json.data || '';
  if (typeof originalHtml !== 'string') originalHtml = '';
  originalHtml = originalHtml.slice(0, 2000);
} catch(e) {}

const pos    = concept.positionierung   || {};
const tokens = concept.design_tokens    || {};
const copy   = concept.copy             || {};
const secs   = concept.sections         || [];
const constr = concept.constraints      || {};

const colors = tokens.colors     || promptData.design_system?.colors || {};
const typo   = tokens.typography || promptData.design_system?.typography || {};

const direction    = pos.design_direction    || 'elegant_modern';
const fontHeading  = typo.font_heading       || 'Playfair Display';
const fontBody     = typo.font_body          || 'Lato';
const heroHeadline = copy.hero_headline      || lead.name || '';
const heroSub      = copy.hero_subheadline   || '';
const ctaPrimary   = copy.cta_primary        || 'Tisch reservieren';
const improvements = (concept.improvements_vs_original || []).slice(0, 5).join('; ');
const posStatement = pos.statement || pos.claim || '';
const mood         = pos.mood || pos.atmosphaere || '';

const f   = content.fakten         || {};
const it  = content.interpretation || {};
const name       = f.name          || lead.name  || '';
const adresse    = f.adresse       || lead.address || '';
const telefon    = f.telefon       || lead.phone  || '';
const email      = f.email         || '';
const oeffnung   = f.oeffnungszeiten || '';
const ueber_uns  = it.ueber_uns    || content.ueber_uns || '';
const spezisRaw  = it.spezialitaeten || content.spezialitaeten || [];
const spezis     = (Array.isArray(spezisRaw) ? spezisRaw : String(spezisRaw).split(',').map(s=>s.trim())).slice(0,8).join(', ');
const kuecheRaw  = it.kueche || content.kueche || [];
const kueche     = (Array.isArray(kuecheRaw) ? kuecheRaw : String(kuecheRaw).split(',').map(s=>s.trim())).join(', ');
const reservUrl  = f.reservierung_url || '';

const doNotInvent = constr.do_not_invent || [];
const demoText    = `Diese Website ist eine Demo-Praesentation von MONEYLAN fuer ${name || 'diesen Betrieb'}.`;

const directionGuide = {
  traditional_german: `DIRECTION: Traditional German — Warm, Holz + Cremweiss + tiefes Gruen.
Typography: Serif (Playfair Display). Layout: Asymmetrisch, linke Kolumne + rechts Bild.
Hero: Dunkles Overlay, Headline links. Atmosphere: Gemeutlich, historisch.`,
  modern_bistro: `DIRECTION: Modern Bistro — Schwarz + Weiss + 1 Akzent.
Typography: Editorial Sans (Inter 900). Layout: Split-screen Hero, Bento-Grid.
Hero: Links Bild, rechts clamp(3rem,8vw,7rem). Atmosphere: Urban, curated.`,
  italian_traditional: `DIRECTION: Italian Traditional — Off-white + Dunkelgruen + Gold.
Typography: Serif Italic (Cormorant Garamond). Layout: Centered Hero OK, dann Links-Rechts.
Hero: Voll-Bild Vignette, Italic-Headline. Atmosphere: La dolce vita.`,
  elegant_modern: `DIRECTION: Elegant Modern — Dunkel + Creme/Ivory + Gold.
Typography: Thin Labels + Bold Headlines. Mix Serif + Sans.
Hero: Volle Hoehe, Headline unten-links absolut, Gradient Overlay. Atmosphere: Fine Dining.`,
  casual_friendly: `DIRECTION: Casual Friendly — Lebendige Farben, rund.
Typography: Runde Sans (Nunito). Layout: Cards leicht rotiert.
Hero: Flat-Color-Block, Headline fett. Atmosphere: Herzlich, lokal.`
};

const dirGuide = directionGuide[direction] || directionGuide['elegant_modern'];
const sectionsList = secs.length > 0 ? secs.map(s => s.id || s.order).join(', ') : 'hero, highlights, about, contact, footer';

function safeColor(c) { return (c && typeof c === 'string') ? c : '#888'; }
const colorBlock = `primary: ${safeColor(colors.primary)}, secondary: ${safeColor(colors.secondary)}, accent: ${safeColor(colors.accent)}, bg: ${safeColor(colors.background)}, text: ${safeColor(colors.text)}`;

const systemPrompt = `You are an elite frontend engineer building a SALES DEMO website for a German restaurant.

MISSION: Restaurant owner sees this demo and decides whether to hire MONEYLAN. Must feel better than their current site.

OUTPUT: Return ONLY a JSON object, no markdown, no code fences, no explanation:
{"files":[{"name":"path/to/file","content":"raw file content"}]}

DESIGN RULES:
NEVER: centered hero text (except Italian), generic teal/blue, lorem ipsum, 3-equal-card grids, gradient buttons, clip art, "Welcome to [Name]"
ALWAYS: left-aligned heroes, clamp() font sizes, CSS custom properties, sticky demo banner, IntersectionObserver animations, one accent color, hamburger nav mobile

HARD RULES:
1. No em-dashes. Use comma.
2. ALL Nav links: onClick={() => setModalOpen(true)}
3. DemoNotice: sticky top-0 z-50, non-dismissable
4. index.html: <meta name="robots" content="noindex,nofollow">
5. Hero: max 4 elements, fits 100dvh
6. Missing data: "Auf Anfrage". Never invent hours/prices/menu/address/phone
7. border-radius max 16px on cards
8. Google Fonts via @import in CSS

REQUIRED PACKAGES: react, react-dom, framer-motion
devDeps: vite, @vitejs/plugin-react, tailwindcss, autoprefixer, postcss`;

const userPrompt = `Build premium sales demo for: ${name || leadId}
Lead ID: ${leadId}

DESIGN DIRECTION: ${direction.toUpperCase()}
${dirGuide}

DESIGN TOKENS:
Colors: ${colorBlock}
Font heading: ${fontHeading}
Font body: ${fontBody}

BRAND:
${posStatement ? `Claim: "${posStatement}"` : ''}
${mood ? `Atmosphere: ${mood}` : ''}
Hero headline: "${heroHeadline}"
Hero sub: "${heroSub}"
CTA: "${ctaPrimary}"
${improvements ? `Improvements: ${improvements}` : ''}

FACTS (use exactly):
Name: ${name || 'Auf Anfrage'}
Address: ${adresse || 'Auf Anfrage'}
Phone: ${telefon || 'Auf Anfrage'}
Email: ${email || 'Auf Anfrage'}
Hours: ${oeffnung || 'Auf Anfrage'}
Reservations: ${reservUrl || telefon || 'Auf Anfrage'}

CONTENT:
About: ${ueber_uns ? ueber_uns.slice(0, 600) : 'Auf Anfrage'}
Specialties: ${spezis || 'Auf Anfrage'}
Cuisine: ${kueche || 'Auf Anfrage'}

DO NOT INVENT: ${doNotInvent.join(', ') || 'oeffnungszeiten, preise, menue, adresse, telefon'}
Demo banner: "${demoText}"
Sections: ${sectionsList}

REQUIRED FILES — generate ALL:
package.json, vite.config.js, tailwind.config.js, postcss.config.js, index.html,
src/main.jsx, src/App.jsx, src/styles/tokens.css, src/data/site.js,
src/components/Nav.jsx, src/components/DemoNotice.jsx, src/components/Hero.jsx,
src/components/Highlights.jsx, src/components/About.jsx, src/components/Contact.jsx,
src/components/Footer.jsx, src/components/InterestedModal.jsx

site.js = single source of truth for ALL data (name, address, phone, email, hours, specialties, about, cta, demoNotice, claim).
App.jsx manages modalOpen state, passes open handler as: onNavClick, onCtaClick, onCTAClick, onCta, openModal.
tokens.css defines all CSS custom properties.`;

const llmPayload = {
  model: 'Claude-3-Haiku',
  messages: [{ role: 'user', content: userPrompt }],
  max_tokens: 16000,
  temperature: 0.3,
  system: systemPrompt,
};

return [{json: {
  lead_id:      leadId,
  lead:         lead,
  content:      content,
  images:       images,
  concept:      concept,
  llm_payload:  llmPayload,
  name:         name,
  demo_text:    demoText,
  do_not_invent: doNotInvent,
}}];

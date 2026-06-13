// ─── A5 Concept Architect ───────────────────────────────────────────────────
// Erzeugt für jeden Lead ein kategorie-individuelles Konzept.
// Input: validierte Fakten + validierte Assets
// Output: Designrichtung, Hero-Komposition, Animation, Section-Rhythmus, CTAs
//
// Verhindert: alle Sites sehen gleich aus.

import { getCategory } from './categoryIntelligence'

// ─── Per-Kategorie Konzept-Recipes ─────────────────────────────────────────
const CONCEPT_RECIPES = {
  burger: {
    design_direction: 'Urban Energy mit Premium-Food-Craft. Pop-Color statt verspielt. Sticker-Style Labels.',
    hero_compositions: [
      { id: 'full_bleed_burger', desc: 'Hero-Bild full-bleed, fettes Display-Headline überlagert' },
      { id: 'split_burger_text', desc: 'Bild rechts, Text links, asymmetrische Hierarchie' },
      { id: 'centered_with_marquee', desc: 'Hero zentriert, Marquee-Text mit Specials drüber/drunter' },
    ],
    color_world: 'Deep black + ONE pop color (magenta/cyan/lime). High contrast. Cream-white text. Akzent-Blocks.',
    section_rhythm: ['nav', 'hero', 'trust_marquee', 'about_split', 'menu_grid_3col', 'hours_compact', 'order_block', 'maps_split', 'footer_minimal'],
    animation_concept: 'Snappy: 0.97 scale on click. Marquee horizontal. Glitch-fade on reveal. Diagonal cuts. Sticker rotation -2/+2deg.',
    cta_strategy: 'ORDER NOW als primärer CTA (uppercase, monospace). Telefon sekundär. Demo-Modal bei Klick auf Specials.',
    no_go: ['Kein Fine-Dining-Look', 'Kein Editorial-Whitespace', 'Keine Italic-Display-Headlines'],
    asset_requirements: [
      { role: 'hero', min_score: 90, must_contain: ['burger', 'beef'] },
      { role: 'product_close', min_score: 80 },
      { role: 'vibe', min_score: 75 },
    ],
  },

  pizza: {
    design_direction: 'Drenched Mediterranean Warmth. Project-Napoli-Premium-Standard. Rotating Pizza-Disc als Hero-Element.',
    hero_compositions: [
      { id: 'rotating_disc', desc: 'Pizza-Disc rotiert langsam im Hintergrund, Headline davor' },
      { id: 'cinematic_oven', desc: 'Holzofen-Showcase als Hero, Text unten' },
      { id: 'showcase_strip', desc: 'Strip mit Signature-Pizza + Slogan überlagert' },
    ],
    color_world: 'Drenched cinnabar (#a73a1f) / cream (#f0e8d5). Saturated mediterranean clay.',
    section_rhythm: ['nav', 'hero', 'showcase_cinematic', 'manifesto_2col', 'menu_signature', 'menu_full', 'hours_elegant', 'order_grid', 'maps_split', 'footer_warm'],
    animation_concept: 'Slow rotate 90s. Pulse heartbeat. Reveal-Animations beim Scroll. Italic-Akzente fade-in.',
    cta_strategy: 'Reservieren als CTA wenn Tisch-Bistro, sonst Bestellen (Lieferando-Link). Telefon prominent.',
    no_go: ['Kein Neon', 'Kein Sticker-Style', 'Kein Off-White Editorial'],
    asset_requirements: [
      { role: 'hero', min_score: 90, must_contain: ['pizza'] },
      { role: 'showcase', min_score: 85 },
      { role: 'signature_dish', min_score: 80 },
    ],
  },

  asian: {
    design_direction: 'Dark Luxury Minimalism mit Japanese-Influence. Goldene Akzente. Sehr restrained.',
    hero_compositions: [
      { id: 'dark_cinematic_bowl', desc: 'Ramen/Sushi-Bowl cinematic dark gradient, vertikales Story-Layout' },
      { id: 'minimalist_counter', desc: 'Sushi-Counter weitläufig, Headline klein elegant darüber' },
      { id: 'editorial_vertical', desc: 'Vertikales Editorial-Layout mit numerierten Sections (01., 02.)' },
    ],
    color_world: 'Obsidian #0a0a0a / charcoal #1a1a1a / antique gold #c9922a / cream #f5e6c8.',
    section_rhythm: ['nav', 'hero', 'manifesto_vertical', 'menu_numbered', 'showcase_chef', 'hours_minimal', 'reserve_form', 'maps_compact', 'footer_dark'],
    animation_concept: 'Sehr subtil: opacity fades only, kein scale. Sticky-image scroll. Numbered sections fade-in sequenziell.',
    cta_strategy: 'Reservieren elegant unterspielt. Telefon dezent. Kein "Order now"-Pop.',
    no_go: ['Keine Stockfotos', 'Keine billigen Asia-Klischees', 'Kein Buffet-Look'],
    asset_requirements: [
      { role: 'hero', min_score: 90, must_contain: ['sushi', 'ramen', 'pho'] },
      { role: 'ambience', min_score: 85 },
      { role: 'chef_detail', min_score: 75 },
    ],
  },

  cafe: {
    design_direction: 'Editorial Magazine-Style. Massive Whitespace. Riesige Serif-Display-Headlines.',
    hero_compositions: [
      { id: 'editorial_full_bleed', desc: 'Vollbild-Hero mit massiver Times-Now-Headline darüber' },
      { id: 'magazine_split', desc: 'Magazine-Layout: Bild oben, große Headline + Text unten' },
      { id: 'minimal_portrait', desc: 'Portrait-Style Hero, viel Weiß rundherum' },
    ],
    color_world: 'Off-white #f7f3ee / ink #1a1a1a / single accent hue. Massive contrast. Minimal saturation.',
    section_rhythm: ['nav', 'hero', 'portrait_split', 'manifesto_minimal', 'menu_editorial', 'hours_minimal', 'contact_minimal', 'maps_subtle', 'footer_clean'],
    animation_concept: 'Page-turn feel. Slow scroll. Hover: underline grow. Minimalistic — fast unsichtbar.',
    cta_strategy: 'Anfragen statt Reservieren (Brunch nicht typisch reservierbar). Telefon dezent.',
    no_go: ['Kein Dark-Mode', 'Keine Neon-Akzente', 'Keine bold Sans-Display'],
    asset_requirements: [
      { role: 'hero_full_bleed', min_score: 90 },
      { role: 'portrait', min_score: 85 },
      { role: 'product_close_up', min_score: 80 },
    ],
  },

  bar: {
    design_direction: 'Dark Speakeasy-Luxury. Goldene Glassware-Akzente. Dim moody Photography.',
    hero_compositions: [
      { id: 'dim_cocktail', desc: 'Cocktail close-up dim lighting, Headline klein elegant' },
      { id: 'bar_interior_wide', desc: 'Bar-Interior weite Sicht, Hero-Headline darüber' },
      { id: 'bottle_shelf', desc: 'Bottle-Shelf als Hintergrund, Hero-Text davor' },
    ],
    color_world: 'Obsidian + antique gold. Velvety dark. Cream text.',
    section_rhythm: ['nav', 'hero_dim', 'manifesto_intimate', 'drinks_menu', 'hours_evening', 'reserve_form', 'maps_compact', 'footer_dark'],
    animation_concept: 'Sehr langsame Fades. Glow-Hover. Optionaler "lights coming on"-Effect beim Page-Load.',
    cta_strategy: 'Tisch reservieren prominent. Telefon prominent. Kein "Order".',
    no_go: ['Keine helle Tageslicht-Bilder', 'Kein Family-Setting', 'Kein Fußball-Bar-Look'],
    asset_requirements: [
      { role: 'hero', min_score: 90 },
      { role: 'ambience', min_score: 85 },
    ],
  },

  doener: {
    design_direction: 'Street Food Energy mit warmen Erdtönen. Polaroid-style Vibes.',
    hero_compositions: [
      { id: 'spit_close', desc: 'Döner-Spit als Hero, Text überlagert' },
      { id: 'wrap_split', desc: 'Dürüm split-screen, halbes Bild halber Text' },
    ],
    color_world: 'Warm earthy Sand/Olive/Terracotta. Polaroid-Filter.',
    section_rhythm: ['nav', 'hero_warm', 'about_polaroid', 'menu_grid', 'hours_simple', 'order_block', 'maps_compact', 'footer_warm'],
    animation_concept: 'Playful tilt -2deg. Polaroid-Style Bilder leicht rotiert. Subtle hover bounce.',
    cta_strategy: 'Bestellen primär. Telefon prominent.',
    no_go: ['Kein Fine-Dining', 'Kein dark luxury'],
    asset_requirements: [
      { role: 'hero', min_score: 90, must_contain: ['döner', 'kebab'] },
      { role: 'food', min_score: 80 },
    ],
  },

  sushi: {
    design_direction: 'Sehr restrained dark Japanese-Editorial. Gold + Cream. Numbered sections.',
    hero_compositions: [
      { id: 'omakase_plating', desc: 'Omakase-Plating cinematic close-up, minimaler Text' },
      { id: 'chef_counter', desc: 'Sushi-Counter Detail, weite Sicht' },
    ],
    color_world: 'Obsidian + antique gold + cream. Tatami-Texture optional.',
    section_rhythm: ['nav', 'hero_minimal', 'philosophy_vertical', 'omakase_strip', 'menu_numbered', 'hours_minimal', 'reserve_form', 'maps_dark', 'footer_dark'],
    animation_concept: 'Stille Eleganz. Opacity fades. Sehr lange Durations. Numbered sections sequenziell.',
    cta_strategy: 'Omakase-Reservierung als CTA. Sehr elegant.',
    no_go: ['Kein All-You-Can-Eat-Look', 'Kein casual'],
    asset_requirements: [
      { role: 'hero', min_score: 90, must_contain: ['sushi', 'sashimi', 'omakase'] },
    ],
  },

  indian: {
    design_direction: 'Drenched warm earthy. Gold + Tiefes Rot/Braun. Royale Atmosphäre.',
    hero_compositions: [
      { id: 'curry_close', desc: 'Curry-Bowl cinematic close-up' },
      { id: 'tandoor_flame', desc: 'Tandoor-Ofen mit Flammen als Hero' },
    ],
    color_world: 'Drenched warm — Tiefes Rot, Gold, Creme. Royale Wärme.',
    section_rhythm: ['nav', 'hero', 'manifesto_warm', 'menu_signature', 'hours_warm', 'order_block', 'maps_split', 'footer_warm'],
    animation_concept: 'Warm fade-in. Spice-Particle leichte Hintergrund-Animation optional. Hover golden glow.',
    cta_strategy: 'Reservieren/Bestellen je nach Konzept.',
    no_go: ['Keine westlichen Bilder im Hero'],
    asset_requirements: [
      { role: 'hero', min_score: 90, must_contain: ['curry', 'tandoor'] },
    ],
  },

  bakery: {
    design_direction: 'Editorial soft warm. Massive Whitespace. Riesige Sans-Serif-Display.',
    hero_compositions: [
      { id: 'bread_full_bleed', desc: 'Sourdough/Brot Full-Bleed Hero' },
      { id: 'baker_hands', desc: 'Baker-Hands Detail-Shot als Hero' },
    ],
    color_world: 'Cream off-white / warm beige / soft brown accent.',
    section_rhythm: ['nav', 'hero_editorial', 'manifesto_minimal', 'menu_minimal', 'hours_simple', 'contact_minimal', 'maps_subtle', 'footer_clean'],
    animation_concept: 'Soft page-turn fades. Sehr subtle.',
    cta_strategy: 'Anfragen / Vorbestellen je nach Konzept.',
    no_go: ['Kein dark mode', 'Keine Neon-Akzente'],
    asset_requirements: [
      { role: 'hero_full_bleed', min_score: 90 },
    ],
  },

  general: {
    design_direction: 'Warm Indie Premium. Sand/Olive/Terracotta. Magazine-Influence.',
    hero_compositions: [
      { id: 'lifestyle_split', desc: 'Lifestyle-Bild split-screen mit Hero-Text' },
      { id: 'centered_warm', desc: 'Zentriertes Hero-Bild, Headline darüber' },
    ],
    color_world: 'Warm sand + olive + terracotta + paper.',
    section_rhythm: ['nav', 'hero', 'about_warm', 'menu_grid', 'hours', 'contact', 'maps', 'footer'],
    animation_concept: 'Smooth reveal. Subtle hover. Warm-fade transitions.',
    cta_strategy: 'Kontextabhängig.',
    no_go: [],
    asset_requirements: [
      { role: 'hero', min_score: 90 },
    ],
  },
}

// Deterministisch wählen welcher Hero-Composition aus Lead-Hash
function hashSeed(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i)
  return Math.abs(h)
}

/**
 * generateConcept({ lead, gate_report, requested_style })
 * Liefert das individuelle Concept-Brief für A6/A7.
 */
export function generateConcept({ lead = {}, gate_report = null, requested_style = null } = {}) {
  const categoryId = lead.category_id || gate_report?.summary?.category || 'general'
  const recipe = CONCEPT_RECIPES[categoryId] || CONCEPT_RECIPES.general
  const cat = getCategory(categoryId)

  // Wähle deterministisch eine Hero-Composition für Anti-Template
  const seed = hashSeed(lead.lead_id || lead.business_name || 'fallback')
  const pickIdx = seed % recipe.hero_compositions.length
  const chosenHero = recipe.hero_compositions[pickIdx]

  // Style-Final aus Gate
  const styleFinal = requested_style ||
    gate_report?.build_context?.style_final ||
    cat.design_recommendation

  return {
    concept_id:        `concept-${lead.lead_id}-${seed.toString(36).slice(0, 6)}`,
    generated_at:      new Date().toISOString(),
    category_id:       categoryId,
    style_id:          styleFinal,

    design_direction:  recipe.design_direction,
    hero_composition:  chosenHero,
    color_world:       recipe.color_world,
    section_rhythm:    recipe.section_rhythm,
    animation_concept: recipe.animation_concept,
    cta_strategy:      recipe.cta_strategy,
    no_go_rules:       recipe.no_go,
    asset_requirements: recipe.asset_requirements,

    // Kategorie-Daten zur Referenz
    signature_products: cat.signature_products,
    category_keywords:  [...cat.keywords_de, ...cat.keywords_en].slice(0, 10),

    // Anti-Template-Marker (verhindert dass alle Builds identisch sind)
    anti_template: {
      hero_layout:  chosenHero.id,
      seed_used:    seed,
      composition_options: recipe.hero_compositions.map(h => h.id),
    },
  }
}

export function describeConceptForPrompt(concept) {
  if (!concept) return ''

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
A5 CONCEPT BRIEF (verbindlich für diesen Build):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

KATEGORIE: ${concept.category_id}
STYLE-VARIANTE: ${concept.style_id}

DESIGN-RICHTUNG: ${concept.design_direction}

HERO-KOMPOSITION: ${concept.hero_composition.id}
${concept.hero_composition.desc}

FARBWELT: ${concept.color_world}

SECTION-RHYTHMUS (in dieser Reihenfolge):
${concept.section_rhythm.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}

ANIMATION: ${concept.animation_concept}

CTA-STRATEGIE: ${concept.cta_strategy}

ASSET-ANFORDERUNGEN:
${concept.asset_requirements.map(a =>
  `  • ${a.role}: min score ${a.min_score}${a.must_contain ? ` · MUSS enthalten: ${a.must_contain.join(', ')}` : ''}`
).join('\n')}

NO-GO-REGELN:
${concept.no_go_rules.map(n => `  ✗ ${n}`).join('\n')}

ANTI-TEMPLATE: Hero-Layout "${concept.anti_template.hero_layout}" gewählt (von ${concept.anti_template.composition_options.length} Optionen).
Diese Site darf NICHT identisch wie andere ${concept.category_id}-Sites aussehen — diese Konkrete Hero-Composition muss durchgezogen werden.
`.trim()
}

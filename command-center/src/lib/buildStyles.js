// ─── 5 Premium Design-Varianten für A2 Build ────────────────────────────────
// Alle 5 sind visuell deutlich unterschiedlich, premium, und befolgen:
//   taste-skill · emil-kowalski · impeccable
// Pflicht: jede Variante hat PFLICHT-Bildslots damit nie wieder Bildlücken
// entstehen (Hauptkritik an Project Napoli).

export const BUILD_STYLES = {
  cinnabar: {
    id: 'cinnabar',
    name: 'Cinnabar',
    tagline: 'Drenched Warmth',
    description: 'Napoli-Evolution mit garantierten Bildslots. Italienisch, Pizza, Mediterran.',
    color_primary: '#a73a1f',
    color_accent: '#f0e8d5',
    fonts: ['Bricolage Grotesque', 'Inter'],
    suited_for: ['italienisch', 'pizza', 'pasta', 'mediterran'],
    image_slots: ['hero', 'showcase', 'signature_dish', 'interior', 'atmosphere'],
    palette_brief: 'Drenched Cinnabar #a73a1f / brand-deep #8a2f1a / cream #f0e8d5. Saturated, warm, mediterranean clay.',
    typography_brief: 'Bricolage Grotesque für Display (opsz 96), Inter für Body. Italic-Akzente. Letterspacing -0.025em.',
    layout_brief: 'Rotating hero element (pizza disc / sun). Full-bleed showcase. Signature menu-strip. Drenched section padding (>120px).',
    motion_brief: 'Slow rotate (90s). Pulse heartbeat on live elements. Reveal-Animations beim Scroll.',
    references: ['project-napoli-premium'],
    bg_class: 'from-orange-900 via-red-800 to-amber-700',
  },

  obsidian: {
    id: 'obsidian',
    name: 'Obsidian',
    tagline: 'Dark Luxury',
    description: 'Tiefes Schwarz + Gold. Editorial Italic Headlines. Fine Dining, Bars, Cocktail-Bars.',
    color_primary: '#0a0a0a',
    color_accent: '#c9922a',
    fonts: ['Cormorant Garamond', 'Inter Tight'],
    suited_for: ['fine_dining', 'steakhaus', 'cocktailbar', 'bar', 'sushi'],
    image_slots: ['hero', 'ambience', 'chef_detail', 'signature_plate', 'bar_or_wine', 'table_setting'],
    palette_brief: 'Obsidian #0a0a0a / charcoal #1a1a1a / antique gold #c9922a / cream #f5e6c8. Deep, refined, restrained.',
    typography_brief: 'Cormorant Garamond Italic für Headlines (Display 700). Inter Tight für Body. Schmale Tracking. Numerals: oldstyle, tabular.',
    layout_brief: 'Cinematic full-bleed Hero mit dunklem Gradient. Vertikales Story-Layout. Numbered sections (01. — 06.). Goldene Dividers.',
    motion_brief: 'Sehr subtil: opacity fades, kein scale. Sticky-image-scroll. Cinemagraph-style.',
    references: ['indian-crown'],
    bg_class: 'from-black via-stone-900 to-amber-900',
  },

  atelier: {
    id: 'atelier',
    name: 'Atelier',
    tagline: 'Editorial Minimal',
    description: 'Off-white + Anthrazit, große Serif-Headlines, Magazine-Style. Café, Bäckerei, Modern.',
    color_primary: '#f7f3ee',
    color_accent: '#1a1a1a',
    fonts: ['Times Now', 'Söhne'],
    suited_for: ['café', 'bäckerei', 'modern_cuisine', 'brunch', 'patisserie'],
    image_slots: ['hero_full_bleed', 'portrait', 'environment', 'product_close_up'],
    palette_brief: 'Cream-off-white #f7f3ee / ink #1a1a1a / muted accent (single hue von Brand). Massive contrast. Minimal saturation.',
    typography_brief: 'Times Now Display Bold für Hero. Söhne für Body. Riesige Display-Size (clamp 100px to 200px). Generous leading.',
    layout_brief: 'Magazine-Layout. Pflicht: massive Whitespace. Single-column. Mit 1 vollbild-Bild zwischen Sections. Numbered notes am Rand.',
    motion_brief: 'Page-turn feel. Slow scroll. Hover: underline grow. Minimalistic — fast unsichtbar.',
    references: [],
    bg_class: 'from-stone-100 via-stone-50 to-stone-200',
  },

  terrain: {
    id: 'terrain',
    name: 'Terrain',
    tagline: 'Warm Indie',
    description: 'Sand, Oliv, Terracotta. Asymmetrische Layouts, Polaroid-Vibe. Indie-Café, Bistro, Bagels.',
    color_primary: '#d4a574',
    color_accent: '#5a3a1f',
    fonts: ['GT Sectra', 'Söhne'],
    suited_for: ['indie_café', 'bistro', 'bagels', 'brunch', 'casual', 'breakfast'],
    image_slots: ['hero_lifestyle', 'people_at_work', 'kitchen', 'dish_top_down', 'neighborhood'],
    palette_brief: 'Sand #d4a574 / olive #6b7a3a / terracotta #c4621a / deep walnut #5a3a1f / paper #f5ede0. Earthy, lived-in.',
    typography_brief: 'GT Sectra Display Italic für Hero. Söhne für Body. Quirky display weights. Mix of italic + roman in same headline.',
    layout_brief: 'Asymmetrische Sections. Bilder leicht rotiert (-2deg, +1deg). Polaroid-borders. Handgeschriebene Notizen (ein Cursive Font).',
    motion_brief: 'Playful: subtle tilt on hover. Bilder leicht "fallen-lassen" beim Scroll. Warm.',
    references: ['luise-leipzig'],
    bg_class: 'from-amber-200 via-orange-200 to-stone-300',
  },

  neon: {
    id: 'neon',
    name: 'Neon',
    tagline: 'Urban Energy',
    description: 'Schwarz + ein Pop-Color. Bold Blocks. Burger, Asian Casual, Vegan, Street Food.',
    color_primary: '#0a0a0a',
    color_accent: '#ff2e63',
    fonts: ['Roobert', 'JetBrains Mono'],
    suited_for: ['burger', 'asian_casual', 'vegan', 'street_food', 'craft_beer'],
    image_slots: ['hero_energy', 'street_exterior', 'signature_product', 'crowd_vibe', 'detail_shot'],
    palette_brief: 'Deep black #0a0a0a + ONE pop color (magenta / cyan / lime / orange — per lead choice). High contrast. White text.',
    typography_brief: 'Roobert für Display (Heavy). JetBrains Mono für Labels und Numerals. UPPERCASE Labels mit weiter Tracking.',
    layout_brief: 'Bold block-based grid. Schwarze Hintergründe + farbige Akzent-Blocks. Diagonale Cuts. Sticker-Style Labels.',
    motion_brief: 'Snappy: scale(0.97) on click. Marquee Text. Glitch-fade beim Reveal. Energy.',
    references: [],
    bg_class: 'from-black via-stone-900 to-pink-900',
  },
}

export const STYLE_ORDER = ['cinnabar', 'obsidian', 'atelier', 'terrain', 'neon']

// Helper für n8n Workflow / direct API calls
export function getStyleConfig(id) {
  return BUILD_STYLES[id] || BUILD_STYLES.cinnabar
}

// Empfehlung basierend auf Cuisine
export function recommendStyle(cuisine = '') {
  const c = cuisine.toLowerCase()
  for (const [id, style] of Object.entries(BUILD_STYLES)) {
    if (style.suited_for.some(s => c.includes(s.replace(/_/g, ' ')))) return id
  }
  return 'cinnabar' // default
}

// Liefert die Style-Anweisungen als Markdown-Block für den Build-Prompt
export function getStylePromptBlock(styleId) {
  const s = getStyleConfig(styleId)
  return `
DESIGN-VARIANTE: ${s.name} — ${s.tagline}
${s.description}

PALETTE: ${s.palette_brief}

TYPOGRAFIE: ${s.typography_brief}
Google Fonts: ${s.fonts.join(', ')} (Link im <head> einbauen)

LAYOUT: ${s.layout_brief}

MOTION: ${s.motion_brief}

IMAGE-SLOTS (PFLICHT, alle ${s.image_slots.length} müssen visuell genutzt werden):
${s.image_slots.map((slot, i) => `  ${i + 1}. ${slot}`).join('\n')}

KRITISCH:
- Wenn ein image_slot keinen Pflicht-URL aus dem images-Array hat, fülle ihn mit einem PASSENDEN Unsplash-Bild (kuratiere selbst). KEINE leeren Bild-Container!
- Niemals "TODO image" oder Platzhalter-Boxen — immer echtes Bild oder gestaltetes SVG-Element.
${s.references.length ? `- Referenz: ${s.references.join(', ')} im Repo ansehen für Stil-Inspiration.` : ''}
`.trim()
}

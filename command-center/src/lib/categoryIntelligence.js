// ─── Category Intelligence Layer ────────────────────────────────────────────
// Harte Kategorien-Definitionen für die Build-Pipeline.
// Verhindert: Burger → Pizza-Hero, Asian → Fußball, etc.
//
// Genutzt von:
//   - lib/assetScore.js     → Kategorie-Fit Bewertung
//   - lib/preBuildGate.js   → Block bei Mismatch
//   - VpsBuildPanel.jsx     → Style-Empfehlung
//   - api/poe-image.js      → Generierungs-Prompts

export const CATEGORIES = {
  // ── BURGER · Fast Casual ────────────────────────────────────────────────
  burger: {
    id: 'burger',
    label: 'Burger / Smash Burger',
    keywords_de: ['burger', 'smashburger', 'cheeseburger', 'beef', 'patty', 'fries', 'pommes', 'shake'],
    keywords_en: ['burger', 'smash burger', 'beef', 'patty', 'fries', 'milkshake', 'craft beer'],

    allowed_image_terms: [
      'burger', 'smashburger', 'cheeseburger', 'beef patty', 'fries', 'truffle fries',
      'milkshake', 'craft beer', 'kitchen grill', 'flame', 'casual restaurant',
      'street food', 'urban kitchen', 'dark interior burger bar', 'neon sign burger',
    ],

    forbidden_image_terms: [
      // Andere Cuisines absolut verboten
      'pizza', 'pasta', 'sushi', 'ramen', 'pho', 'curry', 'kebab', 'döner',
      'tapas', 'paella', 'croissant', 'tartine', 'salat-bowl', 'salat',
      'sashimi', 'naan', 'samosa', 'falafel', 'shawarma',
      // Off-topic
      'football', 'soccer', 'fußball', 'sport bar tv',
      'wedding', 'cocktail dress', 'formal dining',
      // Quality killers
      'cartoon burger', 'fast food advertising', 'clipart', 'mcdonald',
    ],

    signature_products: [
      'Smashburger', 'Double Cheeseburger', 'Truffle Fries',
      'Craft Beer (lokale Brauerei)', 'Milkshake', 'Bacon Cheeseburger',
    ],

    website_signals: [
      'burger', 'patty', 'beef', 'fries', 'pommes', 'milkshake',
      'craft', 'smash', 'streetfood', 'casual',
    ],

    design_recommendation: 'neon',         // Pop-Color, Urban Energy
    fallback_styles: ['terrain'],          // Warm Indie als Alternative
    forbidden_styles: ['atelier', 'obsidian'],  // Editorial / Fine-Dining passt nicht

    no_go_rules: [
      'KEIN Hero-Bild mit Pizza, Pasta, Sushi oder anderen Cuisines',
      'KEIN Hero ohne sichtbares Burger-Motiv (Patty/Brioche/Cheese)',
      'KEINE generischen "Restaurant"-Stockbilder',
      'KEIN Fine-Dining-Setting (Tischdeko, Kerzen)',
    ],
  },

  // ── PIZZA · Pizzeria / Italian ──────────────────────────────────────────
  pizza: {
    id: 'pizza',
    label: 'Pizzeria / Italian',
    keywords_de: ['pizza', 'pizzeria', 'italienisch', 'pasta', 'antipasti', 'tiramisu', 'mozzarella'],
    keywords_en: ['pizza', 'pizzeria', 'italian', 'pasta', 'mozzarella', 'basil', 'wood fire'],

    allowed_image_terms: [
      'pizza', 'neapolitan pizza', 'wood fire pizza', 'mozzarella', 'basil', 'tomato sauce',
      'pizza oven', 'flames in oven', 'pizza dough', 'flour', 'italian pizzeria interior',
      'rustic wood table', 'antipasti', 'pasta', 'tiramisu', 'espresso italian',
      'pizzaiolo', 'pizza peel',
    ],

    forbidden_image_terms: [
      'burger', 'sushi', 'ramen', 'curry', 'kebab', 'döner', 'wok',
      'cocktail bar', 'club lights', 'neon lights', 'urban graffiti',
      'fast food chain', 'frozen pizza', 'cartoon pizza', 'pizza advertising',
      'football', 'sport bar',
    ],

    signature_products: [
      'Margherita', 'Diavola', 'Quattro Formaggi', 'Capricciosa',
      'Burrata Pizza', 'Tartufo', 'Hausgemachte Pasta', 'Tiramisu',
    ],

    website_signals: [
      'pizza', 'pizzeria', 'forno', 'mozzarella', 'pasta', 'italian',
      'napoletana', 'verace', 'antico', 'traditional',
    ],

    design_recommendation: 'cinnabar',
    fallback_styles: ['terrain'],
    forbidden_styles: ['neon', 'atelier'],

    no_go_rules: [
      'KEIN Hero mit Burger / Sushi / Curry / sonstiger Cuisine',
      'KEIN Stock-Pizza ohne erkennbare neapolitanische Qualität',
      'KEIN Pizza-Chain-Optik (Dominos, Pizza Hut Style)',
      'KEINE übertriebenen Promo-Photos',
    ],
  },

  // ── ASIAN · Sushi/Ramen/Pho/Wok ──────────────────────────────────────────
  asian: {
    id: 'asian',
    label: 'Asiatisch (Sushi/Ramen/Pho/Wok)',
    keywords_de: ['asia', 'asiatisch', 'sushi', 'ramen', 'pho', 'wok', 'dumpling', 'vietnamesisch', 'japanisch', 'thai'],
    keywords_en: ['asian', 'sushi', 'ramen', 'pho', 'wok', 'dim sum', 'dumpling', 'thai', 'japanese', 'vietnamese'],

    allowed_image_terms: [
      'sushi', 'sashimi', 'ramen bowl', 'tonkotsu', 'pho bowl', 'banh mi',
      'dumplings', 'gyoza', 'wok', 'asian noodles', 'chopsticks',
      'asian street food', 'japanese restaurant interior', 'minimalist asian',
      'sushi chef', 'ramen kitchen', 'lantern asian',
    ],

    forbidden_image_terms: [
      'pizza', 'burger', 'pasta', 'tapas', 'kebab', 'croissant',
      // Wichtig: KEIN Off-Topic
      'football', 'soccer', 'fußball', 'sport bar',
      'wedding', 'cocktail party',
      // Quality killers
      'cartoon asian', 'asian advertising', 'chinese takeout box generic',
      'fast food chain asian',
    ],

    signature_products: [
      'Sushi', 'Sashimi', 'Omakase', 'Tonkotsu Ramen', 'Miso Ramen',
      'Pho Bo', 'Banh Mi', 'Gyoza', 'Edamame',
    ],

    website_signals: [
      'sushi', 'ramen', 'pho', 'wok', 'dumpling', 'japanese',
      'vietnamese', 'thai', 'korean', 'asian',
    ],

    design_recommendation: 'obsidian',     // Dark luxury für Sushi
    fallback_styles: ['neon', 'cinnabar'], // Neon für Casual-Ramen, Cinnabar für Bistro-Asian
    forbidden_styles: ['terrain'],

    no_go_rules: [
      'KEIN Hero mit westlicher Cuisine',
      'KEIN All-You-Can-Eat-Buffet-Look',
      'KEINE Fußball/Sport-Bilder',
      'KEIN "China Garden" Klischee',
    ],
  },

  // ── CAFE · Coffee/Brunch/Patisserie ──────────────────────────────────────
  cafe: {
    id: 'cafe',
    label: 'Café / Coffee / Brunch',
    keywords_de: ['café', 'cafe', 'kaffee', 'brunch', 'kuchen', 'frühstück', 'patisserie', 'bäckerei'],
    keywords_en: ['café', 'coffee', 'brunch', 'breakfast', 'specialty coffee', 'pastry', 'patisserie'],

    allowed_image_terms: [
      'specialty coffee', 'flat white', 'pour over', 'latte art', 'espresso',
      'avocado toast', 'eggs benedict', 'pancakes', 'french toast',
      'croissant', 'pastry display', 'cake slice', 'coffee shop interior',
      'barista', 'warm cafe lighting', 'plants in cafe',
    ],

    forbidden_image_terms: [
      'burger', 'pizza', 'sushi', 'curry', 'kebab',
      // Nightlife is wrong
      'cocktail bar', 'club', 'neon nightclub', 'disco lights',
      // Off-topic
      'football', 'sport bar', 'wedding',
      // Quality killers
      'starbucks', 'fast food chain coffee', 'cartoon coffee',
      'coffee advertising stock', 'paper coffee cup logo',
    ],

    signature_products: [
      'Specialty Coffee (Filter / Espresso)', 'Hausgemachte Kuchen',
      'Brunch-Bowl', 'Avocado Toast', 'Eggs Benedict', 'Croissant',
      'Cookie / Cinnamon Roll',
    ],

    website_signals: [
      'café', 'cafe', 'kaffee', 'brunch', 'kuchen', 'specialty',
      'filter', 'roastery', 'hausgemacht', 'frühstück',
    ],

    design_recommendation: 'atelier',      // Editorial Minimal für Coffee
    fallback_styles: ['terrain'],          // Warm Indie für Bagel/Brunch
    forbidden_styles: ['neon', 'obsidian'],

    no_go_rules: [
      'KEIN Hero mit Hauptgericht (Burger/Pizza/etc)',
      'KEIN Bar-/Club-Setting',
      'KEIN Starbucks-Style Plastik-Becher',
      'KEINE Promo-Stockbilder von Kaffeeketten',
    ],
  },

  // ── BAR · Cocktail Bar / Wine Bar / Speakeasy ────────────────────────────
  bar: {
    id: 'bar',
    label: 'Bar / Cocktailbar',
    keywords_de: ['bar', 'cocktail', 'cocktailbar', 'drinks', 'wein', 'whisky', 'gin', 'speakeasy'],
    keywords_en: ['bar', 'cocktail bar', 'speakeasy', 'wine bar', 'whisky', 'spirits', 'mixology'],

    allowed_image_terms: [
      'cocktail', 'old fashioned', 'negroni', 'martini', 'bartender pouring',
      'bar shelf bottles', 'dim bar lighting', 'leather bar booth',
      'glassware', 'wine glass', 'whisky glass', 'bar counter wood',
      'speakeasy interior', 'velvet seating',
    ],

    forbidden_image_terms: [
      'pizza', 'burger', 'sushi', 'pasta',
      'family restaurant', 'kids menu',
      'football', 'soccer', 'sport bar tv',
      'fast food', 'cartoon cocktail', 'oktoberfest',
    ],

    signature_products: [
      'Signature Cocktail', 'Old Fashioned', 'Negroni', 'Whisky Sour',
      'Hausgemachte Bitter', 'Wein-Auswahl', 'Craft Spirits',
    ],

    website_signals: [
      'bar', 'cocktail', 'drinks', 'wine', 'whisky', 'gin',
      'mixology', 'spirits', 'evening', 'nightlife',
    ],

    design_recommendation: 'obsidian',
    fallback_styles: ['neon'],
    forbidden_styles: ['atelier', 'terrain'],

    no_go_rules: [
      'KEIN Tageslicht-Restaurant-Look',
      'KEIN Family-Setting',
      'KEIN Fußball/Sport-Bar-Look',
      'KEINE übertriebenen Promo-Cocktails',
    ],
  },

  // ── DÖNER / KEBAB · Street Food ─────────────────────────────────────────
  doener: {
    id: 'doener',
    label: 'Döner / Kebab',
    keywords_de: ['döner', 'doener', 'kebab', 'dürüm', 'türkisch', 'orientalisch', 'lahmacun'],
    keywords_en: ['kebab', 'döner', 'dürüm', 'turkish', 'shawarma', 'middle eastern'],

    allowed_image_terms: [
      'döner spit', 'kebab grill', 'döner sandwich', 'dürüm wrap',
      'fresh vegetables turkish', 'lahmacun', 'pide', 'baklava',
      'turkish bread', 'mezze', 'tea glass turkish', 'grill flames',
      'street food turkish',
    ],

    forbidden_image_terms: [
      'pizza', 'burger', 'sushi', 'pasta', 'curry indian',
      'football', 'cartoon kebab', 'fast food chain',
      'gourmet restaurant fine dining',
    ],

    signature_products: [
      'Döner Kebab', 'Dürüm', 'Lahmacun', 'Pide', 'Kebab-Teller',
      'Mezze-Platte', 'Türkischer Tee', 'Baklava',
    ],

    website_signals: [
      'döner', 'kebab', 'dürüm', 'türkisch', 'lahmacun', 'pide',
      'mezze', 'street food',
    ],

    design_recommendation: 'neon',         // Street Food Energy
    fallback_styles: ['terrain'],
    forbidden_styles: ['obsidian', 'atelier'],

    no_go_rules: [
      'KEIN Hero mit westlicher Cuisine',
      'KEIN Fine-Dining-Look',
      'KEINE Cartoon-Döner',
    ],
  },

  // ── SUSHI · spezifisch (für Premium-Sushi-Konzepte) ─────────────────────
  sushi: {
    id: 'sushi',
    label: 'Sushi / Japanese Fine',
    keywords_de: ['sushi', 'sashimi', 'japanisch', 'omakase', 'maki', 'nigiri'],
    keywords_en: ['sushi', 'sashimi', 'omakase', 'japanese fine', 'maki', 'nigiri'],

    allowed_image_terms: [
      'sushi nigiri', 'sashimi fresh tuna', 'maki roll',
      'sushi chef hands', 'sushi counter wood', 'japanese minimalism',
      'omakase plating', 'wasabi ginger', 'sake bottles',
      'japanese restaurant tea', 'ikebana', 'tatami',
    ],

    forbidden_image_terms: [
      'burger', 'pizza', 'pasta', 'curry',
      'cheap sushi conveyor belt', 'sushi advertising',
      'football', 'cocktail bar club',
    ],

    signature_products: [
      'Omakase', 'Nigiri-Selection', 'Sashimi-Variation',
      'Tuna Tartare', 'Sake-Pairing', 'Miso Soup',
    ],

    website_signals: ['sushi', 'sashimi', 'omakase', 'japanese', 'maki', 'nigiri'],
    design_recommendation: 'obsidian',
    fallback_styles: ['atelier'],
    forbidden_styles: ['neon', 'terrain'],

    no_go_rules: [
      'KEIN Conveyor-Belt-Sushi-Look',
      'KEIN westliches Hauptgericht im Hero',
      'KEIN Sushi-Buffet-Setting',
    ],
  },

  // ── INDIAN · Curry / Tandoori ───────────────────────────────────────────
  indian: {
    id: 'indian',
    label: 'Indisch',
    keywords_de: ['indisch', 'curry', 'tandoor', 'tandoori', 'naan', 'biryani', 'masala'],
    keywords_en: ['indian', 'curry', 'tandoor', 'tandoori', 'naan', 'biryani', 'tikka masala'],

    allowed_image_terms: [
      'butter chicken', 'tikka masala curry', 'tandoor oven', 'naan bread',
      'biryani', 'paneer curry', 'samosa', 'indian spices',
      'colorful indian dishes', 'lassi mango', 'indian restaurant gold ambient',
      'curry close up',
    ],

    forbidden_image_terms: [
      'pizza', 'burger', 'sushi', 'pasta',
      'football', 'cartoon curry', 'cheap takeout box',
    ],

    signature_products: [
      'Butter Chicken', 'Tikka Masala', 'Lamb Biryani', 'Tandoori Chicken',
      'Frisches Naan', 'Mango Lassi', 'Dal Makhani', 'Palak Paneer',
    ],

    website_signals: ['indian', 'curry', 'tandoor', 'naan', 'biryani', 'masala', 'tikka'],
    design_recommendation: 'cinnabar',     // Drenched warm earthy
    fallback_styles: ['obsidian'],
    forbidden_styles: ['atelier'],

    no_go_rules: [
      'KEIN westliches Hero-Bild',
      'KEIN Buffet-Stil',
      'KEIN Cartoon-Curry',
    ],
  },

  // ── BAKERY · Bäckerei / Konditorei ───────────────────────────────────────
  bakery: {
    id: 'bakery',
    label: 'Bäckerei / Konditorei',
    keywords_de: ['bäckerei', 'bakery', 'konditorei', 'brot', 'gebäck', 'patisserie'],
    keywords_en: ['bakery', 'patisserie', 'bread', 'pastry', 'artisan bread', 'sourdough'],

    allowed_image_terms: [
      'sourdough bread', 'artisan bread crust', 'baker hands flour', 'baker dough',
      'pastry display window', 'croissant lamination', 'fresh bread oven',
      'wheat flour baker', 'cake decoration', 'patisserie close up',
    ],

    forbidden_image_terms: [
      'burger', 'pizza', 'sushi', 'curry',
      'football', 'sport bar', 'cocktail',
      'industrial bread chain', 'cartoon bread',
    ],

    signature_products: [
      'Sourdough', 'Croissant', 'Pain au Chocolat', 'Hausgemachter Kuchen',
      'Saisonale Patisserie', 'Brot des Tages',
    ],

    website_signals: ['bäckerei', 'bakery', 'patisserie', 'brot', 'sourdough', 'gebäck'],
    design_recommendation: 'atelier',
    fallback_styles: ['terrain'],
    forbidden_styles: ['neon', 'obsidian'],

    no_go_rules: [
      'KEIN Hauptgericht im Hero',
      'KEIN Industrie-Bäckerei-Look',
      'KEIN Cartoon-Brot',
    ],
  },

  // ── GENERAL · Restaurant / Bistro (Fallback) ────────────────────────────
  general: {
    id: 'general',
    label: 'Restaurant / Bistro (Allgemein)',
    keywords_de: ['restaurant', 'bistro', 'gastronomie', 'küche', 'speisekarte'],
    keywords_en: ['restaurant', 'bistro', 'dining', 'cuisine'],

    allowed_image_terms: [
      'restaurant interior warm', 'plated dish modern', 'chef cooking kitchen',
      'restaurant table setting', 'casual dining atmosphere',
      'open kitchen restaurant', 'bistro food close up',
    ],

    forbidden_image_terms: [
      'football', 'cocktail party', 'club',
      'fast food chain', 'cartoon restaurant',
    ],

    signature_products: [
      'Tageskarte', 'Saisonale Gerichte', 'Hausspezialitäten',
    ],

    website_signals: ['restaurant', 'bistro', 'gastronomie', 'küche'],
    design_recommendation: 'terrain',
    fallback_styles: ['cinnabar', 'atelier'],
    forbidden_styles: [],

    no_go_rules: [
      'KEINE klar inkorrekte Cuisine-Bilder wenn Spezialisierung bekannt',
      'KEIN Stockbild-Klischee',
    ],
  },
}

export const CATEGORY_LIST = Object.keys(CATEGORIES)

// ─── Helpers ───────────────────────────────────────────────────────────────

// Detektiert Kategorie aus freiem Text (cuisine + atmosphere + name + url)
export function detectCategory(input = {}) {
  const text = [
    input.business_name, input.cuisine, input.atmosphere,
    input.website_url, input.specials, input.address,
  ].filter(Boolean).join(' ').toLowerCase()

  // Score je Kategorie: zähle keyword-Treffer
  const scores = {}
  for (const [id, cat] of Object.entries(CATEGORIES)) {
    let score = 0
    const allKeys = [...cat.keywords_de, ...cat.keywords_en, ...cat.website_signals]
    for (const kw of allKeys) {
      if (text.includes(kw.toLowerCase())) score++
    }
    scores[id] = score
  }

  // Wähle höchsten, mind. 1 Treffer
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1])
  const [bestId, bestScore] = sorted[0]
  const confidence = bestScore === 0 ? 0 : Math.min(1, bestScore / 4)

  return {
    category:   bestScore === 0 ? 'general' : bestId,
    confidence,
    detected_keywords: bestScore,
    runner_up:  sorted[1] ? { category: sorted[1][0], score: sorted[1][1] } : null,
    all_scores: scores,
  }
}

// Validiert ob ein image-Begriff / URL zur Kategorie passt
export function validateImageForCategory(categoryId, imageDescription = '') {
  const cat = CATEGORIES[categoryId]
  if (!cat) return { ok: true, reason: 'unknown category — no check' }

  const desc = imageDescription.toLowerCase()

  // 1. Forbidden check
  for (const f of cat.forbidden_image_terms) {
    if (desc.includes(f.toLowerCase())) {
      return {
        ok: false,
        reason: `forbidden term "${f}" in image for category "${categoryId}"`,
        severity: 'blocking',
      }
    }
  }

  // 2. Allowed signal
  for (const a of cat.allowed_image_terms) {
    if (desc.includes(a.toLowerCase())) {
      return { ok: true, reason: `matched allowed term "${a}"`, signal_strength: 1 }
    }
  }

  // 3. Neutral — kein blocking, aber kein positive match
  return {
    ok: true,
    reason: 'no explicit match — neutral (warning)',
    signal_strength: 0,
    warning: 'no positive category signal — may be off-topic',
  }
}

export function getCategory(id) {
  return CATEGORIES[id] || CATEGORIES.general
}

export function recommendStyleForCategory(categoryId) {
  const cat = getCategory(categoryId)
  return {
    primary:    cat.design_recommendation,
    fallbacks:  cat.fallback_styles || [],
    forbidden:  cat.forbidden_styles || [],
  }
}

// Check ob ein bestimmter Style für diese Kategorie verboten ist
export function isStyleForbiddenForCategory(categoryId, styleId) {
  const cat = getCategory(categoryId)
  return (cat.forbidden_styles || []).includes(styleId)
}

// ─── A6 Prompt Builder ──────────────────────────────────────────────────────
// Erzeugt FINALEN Build-Prompt aus:
//   - validierten Fakten (PreBuildGate verified)
//   - validierten Assets (nur 80+ scored)
//   - A5 Concept Brief
//   - Premium-Animation-Standard
//
// Garantien:
//   - "no_placeholder_policy" enforced
//   - rejected images NICHT im Prompt
//   - unsichere Preise NICHT als Konkretwert
//   - Style + Hero-Composition aus A5 binden
import { describeConceptForPrompt } from './conceptArchitect'
import { ANIMATION_SNIPPETS, getAnimationBlock } from './animationLibrary'

export function buildFinalPrompt({
  lead,
  gate_report,
  approved_assets = [],
  concept = null,
  category_data = null,
} = {}) {
  if (!lead || !lead.lead_id) throw new Error('promptBuilder: lead missing')
  if (!gate_report) throw new Error('promptBuilder: gate_report required')
  if (gate_report.verdict !== 'proceed' && gate_report.verdict !== 'proceed_forced') {
    throw new Error(`promptBuilder: gate verdict "${gate_report.verdict}" — cannot build prompt`)
  }
  if (!concept) throw new Error('promptBuilder: A5 concept required')

  // Hero asset prüfen
  const heroAsset = approved_assets.find(a => (a.role || '').toLowerCase().includes('hero') && (a.score_total >= 90))
  if (!heroAsset) {
    throw new Error('promptBuilder: no hero asset with score >= 90 found')
  }

  // Build asset block
  const assetLines = approved_assets.map(a => {
    const score = a.score_total ? ` [score ${a.score_total} ${a.verdict || ''}]` : ''
    const aiTag = a.ai_generated ? ' [AI-GEN]' : ''
    return `- ${a.role}: ${a.url}${score}${aiTag}${a.description ? ' — ' + a.description : ''}`
  }).join('\n')

  // Pricing safe strategy
  const pricingSafe = gate_report.build_context?.pricing_safe
  const pricingClause = pricingSafe && !pricingSafe.use_concrete_prices
    ? 'WICHTIG: KEINE konkreten Preise verwenden. Stattdessen: "Auswahl aus der Karte" oder "Preise auf Anfrage". Quellen sind unsicher.'
    : 'Preise: aus Daten direkt nutzen WENN sie im specials/menu-Feld konkret stehen.'

  // Uncertain fields warning
  const uncertain = gate_report.build_context?.uncertain_fields || []
  const uncertainNote = uncertain.length > 0
    ? `UNSICHER (nicht als hard fact verkaufen): ${uncertain.map(u => u.field + ' (' + u.reason + ')').join(', ')}`
    : 'Alle Pflichtdaten verifiziert.'

  const siteDir = `sites/${lead.lead_id}`
  const animationBlock = getAnimationBlock(concept.style_id, concept.animation_concept)

  const prompt = `Du bist Claude Code auf VPS (Opus 4.7). Baue PRODUCTION-READY Restaurant-Demo.

TARGETS (NUR diese zwei Dateien anfassen):
1. ${siteDir}/src/App.jsx — komplette React Single-Component
2. ${siteDir}/index.html — Schema.org + Google Fonts + Title im <head>

QUALITÄT: project-napoli-premium/index.html ist MINDEST-Standard.
Skills: taste-skill · emil-kowalski · impeccable.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GATES BESTANDEN (verifiziert vor diesem Build):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ required_data
✓ category: ${gate_report.summary.category} (confidence ${gate_report.summary.category_confidence})
✓ assets: ${gate_report.gates.assets.hero_ready} hero-ready · ${gate_report.gates.assets.usable} usable
✓ style: ${concept.style_id}
${uncertain.length === 0 ? '✓' : '⚠'} uncertain_data: ${uncertain.length} marked

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RESTAURANT-DATEN (VERIFIZIERT):
Name: ${lead.business_name}
Adresse: ${lead.address || 'k.A.'}
Telefon: ${lead.phone || 'k.A. → Kontakt-Form statt Telefon-CTA'}
Website-Status: ${lead.website_url || 'keine'}
Kategorie: ${gate_report.summary.category}
Atmosphäre: ${lead.atmosphere || ''}
Öffnungszeiten: ${lead.opening_hours || ''}
Google: ${lead.google_rating || ''}★ / ${lead.google_reviews_count || ''} Reviews
Specials: ${lead.specials || ''}
Preisklasse: ${lead.price_range || '€€'}

${uncertainNote}
${pricingClause}

${describeConceptForPrompt(concept)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BILDER (vom AssetScore validiert — NUR diese verwenden):
${assetLines}

KRITISCH:
- Hero MUSS dieses Bild sein: ${heroAsset.url}
- ALLE oben gelisteten Assets müssen VISUELL in der Site sein
- KEINE zusätzlichen Stockbilder
- KEINE generischen Restaurant-Bilder
- KEINE leeren Container ohne Bild

${animationBlock}

PFLICHT (unverhandelbar):
1. <meta name="robots" content="noindex,nofollow">
2. Sticky Demo-Banner: "Demo von PDSTUDIO · Konzept-Vorschlag für ${lead.business_name}"
3. Schema.org Restaurant/Cafe JSON-LD im <head>
4. NUR react + react-dom
5. KEINE externen Animation-Libraries — die animations.css unten wird kopiert/inline
6. Mobile-first responsive
7. "Erstellt von PDSTUDIO" im Footer
8. Impressum/Datenschutz/AGB als #-Anchors

NO-PLACEHOLDER-POLICY (absolut verboten):
- KEIN "Lorem ipsum" / "TODO" / "undefined" / "null" / "[Placeholder]"
- KEINE Test-Daten ("Test Restaurant", "Beispieladresse")
- KEINE erfundenen Preise wenn pricing_safe.use_concrete_prices = false
- KEINE kaputten Bild-Container (jedes <img> hat eine echte src oder wird durch SVG ersetzt)

VERBOTEN: Generic SaaS-Optik · Andere Files außerhalb ${siteDir}/ · Animation-Libs · Erfundene Daten.

WORKFLOW:
1. Lies project-napoli-premium/index.html (Quality Reference)
2. Lies die existierende ${siteDir}/src/App.jsx falls vorhanden
3. Implementiere nach A5-Concept oben mit Anti-Template-Variation: ${concept.hero_composition.id}
4. Verwende NUR die approved assets oben
5. Durchgängig style-${concept.style_id} Look
6. Final build sollte mit 'npm run build' fehlerfrei laufen`;

  return {
    prompt,
    prompt_size: prompt.length,
    hero_url:    heroAsset.url,
    concept_id:  concept.concept_id,
    gate_verdict: gate_report.verdict,
    metadata: {
      lead_id:     lead.lead_id,
      lead_name:   lead.business_name,
      site_dir:    siteDir,
      category_id: gate_report.summary.category,
      style_id:    concept.style_id,
      assets_used: approved_assets.length,
      hero_score:  heroAsset.score_total,
      gates_passed: gate_report.verdict === 'proceed',
    },
  }
}

// New PDSTUDIO Agent Architecture (A1–A6 + TWIN PEPE)
// Old n8n webhook IDs are preserved — only UI names/roles change.

export const AGENTS = {
  1: {
    id: 1,
    name: 'Lead Qualifier',
    role: 'Technischer Audit & Score-Berechnung',
    color: '#00d4ff',
    glyph: 'A1',
    // Uses old A1/Luthor webhook
    n8nAgentId: 1,
    webhookConfigured: true,
    description: 'Analysiert Restaurant-Website technisch: HTTPS, Mobile, PageSpeed, SEO, Design, CTA. Ergibt Score + Confidence.',
    inputRequired: 'google_maps_url oder website_url',
    outputFields: ['score', 'confidence', 'pain_points', 'reasoning', 'verkaufsargumente'],
    category: 'research',
  },
  2: {
    id: 2,
    name: 'Claude Code Builder',
    role: 'Website-Build & Deployment',
    color: '#9b6ef3',
    glyph: 'A2',
    // Uses old A7/Zuckerberg webhook internally
    n8nAgentId: 7,
    webhookConfigured: true,
    description: 'Generiert vollständigen Website-Code via Claude Code. Deployed auf Vercel. Benötigt Concept-Daten aus Lead.',
    inputRequired: 'lead_id + concept_data',
    outputFields: ['demo_url', 'build_status', 'build_log', 'deployment_id'],
    category: 'build',
    manualStepRequired: true,
    manualStepNote: 'Claude Code läuft lokal/server-side. Job-Creator generiert den Prompt — du startest den Build manuell oder via n8n Webhook.',
  },
  3: {
    id: 3,
    name: 'Polish Agent',
    role: 'Bild-Generierung & Code-Verbesserung',
    color: '#e8197f',
    glyph: 'A3',
    // Uses Poe API (Nano Banana image model) — no dedicated n8n webhook yet
    n8nAgentId: null,
    webhookConfigured: false,
    description: 'Generiert hochwertige Restaurant-Bilder via Poe/Nano Banana. Polisht CSS und Animationen der bestehenden Demo-Site.',
    inputRequired: 'lead_id + demo_url (A2 muss fertig sein)',
    outputFields: ['image_urls', 'polish_status', 'polished_demo_url'],
    category: 'polish',
    poeModel: 'Nano Banana',
    statusNote: 'needs_connection — Poe API Proxy wird für Bild-Calls genutzt. n8n-Webhook für Rückschreiben ausstehend.',
  },
  4: {
    id: 4,
    name: 'Human Writer',
    role: 'Verkaufstexte & Outreach',
    color: '#f5a623',
    glyph: 'A4',
    // Uses Poe API directly via /api proxy — no n8n webhook needed
    n8nAgentId: null,
    webhookConfigured: false,
    description: 'Schreibt personalisierte Verkaufs-E-Mails, DMs, Follow-ups und Call Scripts auf Basis aller Lead-Daten.',
    inputRequired: 'lead_id + score + content (A1 sollte fertig sein)',
    outputFields: ['email_v1', 'email_v2', 'email_v3', 'dm_text', 'followup', 'call_script'],
    category: 'outreach',
    poeModel: 'claude-3-7-sonnet',
    textLanguage: 'de',
    statusNote: 'Poe API Call via /api/pepe-ask — kein n8n-Webhook nötig.',
  },
  5: {
    id: 5,
    name: 'Pricing Agent',
    role: 'Preisberechnung & Closing-Chance',
    color: '#2ddb72',
    glyph: 'A5',
    // Client-side calculation + optional Poe reasoning
    n8nAgentId: null,
    webhookConfigured: false,
    description: 'Berechnet Min/Empfehlung/Premium-Preis basierend auf Score, Branche, Location. Schätzt Closing-Chance.',
    inputRequired: 'lead_id + score + google_reviews + google_rating',
    outputFields: ['price_min', 'price_recommended', 'price_premium', 'closing_chance', 'reasoning'],
    category: 'pricing',
    statusNote: 'Client-side Berechnung. Optional: Poe-Call für Begründung/Rhetorik.',
  },
  6: {
    id: 6,
    name: 'Fact Checker',
    role: 'Fakten-Prüfung & Versandfreigabe',
    color: '#ff6b35',
    glyph: 'A6',
    // New webhook needed — currently not configured
    n8nAgentId: null,
    webhookConfigured: false,
    description: 'Prüft ob Lead-Daten stimmen: Website erreichbar, Telefon korrekt, E-Mail valide. Gibt Trust Score und Versandstatus.',
    inputRequired: 'lead_id + website_url + contact_data',
    outputFields: ['trust_score', 'hard_errors', 'warnings', 'send_status'],
    category: 'validation',
    statusNote: 'needs_webhook — n8n-Webhook für Server-side URL-Checks noch nicht angelegt.',
    sendStatuses: ['ready_to_send', 'needs_review', 'blocked'],
  },
}

// TWIN PEPE is not an "agent" in the pipeline — it's the boss/orchestrator
export const TWIN_PEPE = {
  id: 8,
  name: 'TWIN PEPE',
  role: 'Command Center Orchestrator',
  color: '#ffd700',
  glyph: 'PD',
}

// Legacy n8n agent IDs → new agent IDs mapping (for UI labeling)
// The old webhook endpoints are reused but shown under new names
export const LEGACY_TO_NEW = {
  1: 1,  // Luthor → Lead Qualifier
  7: 2,  // Zuckerberg → Claude Code Builder
  // 2-6 are deprecated as standalone pipeline agents
}

// Which new agents can be started (have a real connection or client-side logic)
export function getAgentStatus(agentId) {
  const agent = AGENTS[agentId]
  if (!agent) return 'not_configured'
  if (agent.webhookConfigured) return 'ready'
  if (agent.statusNote?.includes('Poe API')) return 'poe_ready'
  if (agent.statusNote?.includes('Client-side')) return 'client_ready'
  return 'needs_connection'
}

export function getAgentById(id) {
  return AGENTS[id] || null
}

export function getAllAgents() {
  return Object.values(AGENTS)
}

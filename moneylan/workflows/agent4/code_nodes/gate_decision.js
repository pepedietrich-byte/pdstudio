/**
 * Gate-Entscheidung — Agent 4
 * Wendet Gate-Logik an, baut rückgabe_an[], schreibt validation.json.
 *
 * Input: $json = output von validate_all.js
 */

const GATE_THRESHOLD = 70;

const v = $json;
const checks = v.checks || [];

// ---- Gate-Logik (Abschnitt 7, deterministisch) ----
const blockerFailed = checks.some(c => !c.passed && c.severity === 'blocker');
const scoreFailed   = v.data_quality_score < GATE_THRESHOLD;
const riskHigh      = v.build_risk?.level === 'high';

// Ersatzstrategien zählen als Blocker-Entschärfung für major-Mängel
const hasErsatz  = (v.ersatzstrategie || []).length > 0;
// Blocker bleiben Blocker (keine Ersatzstrategie für harte Fakten-Mängel)
const readyForConcept = !blockerFailed && !scoreFailed && !riskHigh;

// ---- rückgabe_an aufbauen ----
const rueckgabeAn = [];
for (const c of checks) {
  if (c.passed) continue;
  let agent = null;
  const id = c.id;
  if (['c_logo','c_hero','c_usable_assets'].includes(id)) agent = 'agent3';
  else if (['c_hours','c_offer','c_about','k_address','k_phone','k_name','v_email','v_phone'].includes(id)) agent = 'agent2';
  else if (['c_website','c_address','c_contact','c_name','v_url','v_score'].includes(id)) agent = 'agent1';
  if (agent) {
    rueckgabeAn.push({ agent, grund: c.detail || c.id, feld: c.field });
  }
}
// Deduplizieren (gleicher Agent + Feld)
const dedupKey = r => `${r.agent}|${r.feld}`;
const seen = new Set();
const dedupRueckgabe = rueckgabeAn.filter(r => {
  const k = dedupKey(r);
  if (seen.has(k)) return false;
  seen.add(k); return true;
});

// ---- Schema v2.0 Validierungsobjekt ----
const validation = {
  schema_version:    '2.0',
  agent:             'data_validator',
  lead_id:           v.lead_id,
  generated_at:      new Date().toISOString(),
  ready_for_concept: readyForConcept,
  data_quality_score: v.data_quality_score,
  dimensions:        v.dimensions,
  checks:            v.checks,
  conflicts:         v.conflicts || [],
  missing_critical:  v.missing_critical || [],
  missing_optional:  v.missing_optional || [],
  build_risk:        v.build_risk,
  rückgabe_an:       dedupRueckgabe,
  ersatzstrategie:   v.ersatzstrategie || [],
  confidence:        v.confidence,
  warnings:          v.warnings || [],
  logs: [
    ...(v.logs || []),
    {
      ts:     new Date().toISOString(),
      step:   'gate_decision',
      status: 'ok',
      ready:  readyForConcept,
      reason: blockerFailed ? 'blocker_failed'
              : scoreFailed ? `score_${v.data_quality_score}<${GATE_THRESHOLD}`
              : riskHigh    ? 'build_risk_high'
              : 'passed',
    }
  ],
};

// ---- validation.json schreiben ----
try {
  const fs = require('fs');
  const dir = `/files/runs/${v.lead_id}`;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(`${dir}/validation.json`, JSON.stringify(validation, null, 2), 'utf8');
} catch (e) {
  validation.warnings.push('file_write_failed');
}

// _sources nicht in Output (zu groß)
delete validation._sources;
return [{ json: validation }];

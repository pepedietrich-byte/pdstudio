// ─── Auto-Repair v2 ─────────────────────────────────────────────────────────
// Echte Repair-Actions für jede Gate-Problem-Kategorie.
import { generateAIImage } from './poeImageGen'
import { generateConcept } from './conceptArchitect'

/**
 * runRepair(task, context) — führt einen Repair-Task aus.
 * Task struktur: { agent, task, fields?, detail? }
 * Returns: { success, updated_lead?, updated_assets?, updated_concept?, error? }
 */
export async function runRepair(task, context = {}) {
  const { lead, assets, concept, gate_report } = context

  switch (task.agent) {
    case 'A3_asset_collector': {
      // Hero-Replacement via Poe
      const category_id = gate_report?.summary?.category || lead.category_id
      try {
        const result = await generateAIImage({
          category_id,
          role: 'hero',
          business_name: lead.business_name,
          atmosphere: lead.atmosphere,
          style_id: gate_report?.build_context?.style_final || 'cinnabar',
          count: 2,
          context: { signature_products: gate_report?.build_context?.category_data?.signature_products },
        })

        if (!result.success || !result.images?.length) {
          return { success: false, error: 'Poe-Gen returned no images' }
        }

        // Pick best score
        const sorted = result.images.sort((a, b) => b.score.total - a.score.total)
        const newHero = sorted[0]

        // Replace hero in assets list
        const newAssets = [...(assets || [])]
        const heroIdx = newAssets.findIndex(a => (a.role || '').toLowerCase() === 'hero')
        if (heroIdx >= 0) {
          newAssets[heroIdx] = { ...newHero, score_total: newHero.score.total, verdict: newHero.score.verdict }
        } else {
          newAssets.unshift({ ...newHero, score_total: newHero.score.total, verdict: newHero.score.verdict })
        }

        return {
          success: true,
          message: `Hero generated via Poe FLUX (score ${newHero.score.total})`,
          updated_assets: newAssets,
          usage: result.usage,
        }
      } catch (e) {
        return { success: false, error: e.message }
      }
    }

    case 'A2_text_extractor': {
      // Wir können nicht automatisch Telefon erzwingen, aber wir markieren das Feld als "user_input_required"
      const missing = task.fields || []
      return {
        success: false,
        error: 'auto_repair_not_possible',
        message: `Pflicht-Felder ${missing.join(', ')} können nicht automatisch ergänzt werden. User muss manuell eintragen oder Lead via /api/enrich-lead neu enrichen.`,
        action_required: 'manual_data_entry',
        missing_fields: missing,
      }
    }

    case 'A5_concept_architect': {
      // Neuer Concept-Seed → andere Layout-Variante
      const newConcept = generateConcept({
        lead: { ...lead, lead_id: lead.lead_id + '-r' + Date.now().toString(36).slice(-3) },
        gate_report,
      })
      return {
        success: true,
        message: `Concept re-rolled: Hero-Layout "${newConcept.anti_template.hero_layout}"`,
        updated_concept: newConcept,
      }
    }

    case 'user': {
      return {
        success: false,
        error: 'user_action_required',
        message: task.task,
        action_required: 'user_input',
      }
    }

    default: {
      return {
        success: false,
        error: 'unknown_repair_agent',
        message: `Unbekannter Agent: ${task.agent}`,
      }
    }
  }
}

/**
 * runAllRepairs(tasks, context) — versucht alle auto-repair-fähigen Tasks
 */
export async function runAllRepairs(tasks = [], context = {}) {
  const results = []
  for (const t of tasks) {
    const r = await runRepair(t, context)
    results.push({ task: t, result: r })
  }
  return results
}

import { motion } from 'framer-motion'
import { Phone, Mail, Send, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react'
import { getLeadStage, getConfidence } from '../../lib/sheets'

const EASE = [0.23, 1, 0.32, 1]

/**
 * Sales Action Queue — derives concrete next actions from real lead state.
 * No AI calls. Pattern: status + score + missing data → action.
 */
export default function SalesActionQueue({ leads = [] }) {
  const validDemo = u => u && !u.startsWith('/files') && /^https?:\/\//.test(u)

  const actions = []

  // 1. Live demos → contact lead
  leads.filter(l => validDemo(l.build?.demo_url) && getLeadStage(l) === 7).forEach(l => {
    const score = +l.score || 0
    const phone = l.content?.telefon || l.phone
    actions.push({
      priority: score >= 60 ? 'HIGH' : 'MED',
      icon: phone ? Phone : Send,
      title: `${l.name || l.lead_id} kontaktieren`,
      subtitle: phone ? `Telefon: ${phone}` : 'Demo-Link per E-Mail senden',
      meta: `Score ${score} · A7 Live`,
      lead_id: l.lead_id,
      demoUrl: l.build.demo_url,
      action: 'contact',
    })
  })

  // 2. High-score leads without demo → rebuild website
  leads.filter(l => (+l.score || 0) >= 60 && !validDemo(l.build?.demo_url) && getLeadStage(l) >= 4).forEach(l => {
    actions.push({
      priority: 'HIGH',
      icon: RefreshCw,
      title: `Demo für ${l.name || l.lead_id} bauen`,
      subtitle: 'Hot Lead ohne fertige Website',
      meta: `Score ${+l.score || 0} · Stage A${getLeadStage(l)}`,
      lead_id: l.lead_id,
      action: 'build',
    })
  })

  // 3. Leads with poor confidence → manual review
  leads.filter(l => {
    const c = getConfidence(l)
    return c > 0 && c < 0.5 && getLeadStage(l) >= 2
  }).forEach(l => {
    actions.push({
      priority: 'MED',
      icon: AlertCircle,
      title: `${l.name || l.lead_id} prüfen`,
      subtitle: 'Niedrige Confidence — Datenqualität prüfen',
      meta: `Confidence ${Math.round(getConfidence(l) * 100)}%`,
      lead_id: l.lead_id,
      action: 'review',
    })
  })

  // 4. Leads with email but no demo → email outreach
  leads.filter(l => l.content?.email && !validDemo(l.build?.demo_url) && (+l.score || 0) >= 40).forEach(l => {
    actions.push({
      priority: 'LOW',
      icon: Mail,
      title: `Follow-up E-Mail an ${l.name || l.lead_id}`,
      subtitle: l.content.email,
      meta: 'Cold Email mit Audit-Ergebnis',
      lead_id: l.lead_id,
      action: 'email',
    })
  })

  // Sort: HIGH first, MED, LOW
  const order = { HIGH: 0, MED: 1, LOW: 2 }
  actions.sort((a, b) => order[a.priority] - order[b.priority])

  // Cap at 10
  const shown = actions.slice(0, 10)

  return (
    <div>
      {shown.length === 0 ? (
        <div className="font-mono text-[10px] py-4 text-center" style={{ color: 'var(--text-dim)', opacity: 0.5 }}>
          Keine offenen Verkaufsaktionen — alle Leads sind versorgt oder es liegen noch keine Daten vor.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {shown.map((a, i) => {
            const Icon = a.icon
            const [bgColor, borderColor, textColor] = {
              HIGH: ['rgba(240,58,58,0.06)', 'rgba(240,58,58,0.2)', '#f03a3a'],
              MED:  ['rgba(245,166,35,0.06)', 'rgba(245,166,35,0.2)', '#f5a623'],
              LOW:  ['rgba(255,255,255,0.02)', 'var(--border-dim)',   'var(--text-dim)'],
            }[a.priority]
            return (
              <motion.div key={`${a.lead_id}-${i}`}
                initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03, duration: 0.16, ease: EASE }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px',
                  background: bgColor, border: `1px solid ${borderColor}`, borderRadius: 6,
                }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `${textColor}15`, border: `1px solid ${textColor}30`,
                }}>
                  <Icon size={11} style={{ color: textColor }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="font-ui text-xs font-medium" style={{ color: 'var(--text-hi)' }}>{a.title}</div>
                  <div className="font-mono text-[9px] mt-0.5" style={{ color: 'var(--text-dim)' }}>{a.subtitle}</div>
                  <div className="font-mono text-[8px] mt-0.5" style={{ color: 'var(--text-dim)', opacity: 0.6 }}>{a.meta}</div>
                </div>
                <span className="font-mono text-[8px] px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{ color: textColor, background: `${textColor}12`, border: `1px solid ${textColor}30` }}>
                  {a.priority}
                </span>
                {a.demoUrl && (
                  <a href={a.demoUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1 font-mono text-[9px] px-1.5 py-0.5 rounded flex-shrink-0"
                    style={{ color: '#e8197f', background: 'rgba(232,25,127,0.08)', border: '1px solid rgba(232,25,127,0.18)' }}>
                    <ExternalLink size={8} />
                  </a>
                )}
              </motion.div>
            )
          })}
          {actions.length > 10 && (
            <div className="font-mono text-[9px] mt-2 text-center" style={{ color: 'var(--text-dim)', opacity: 0.5 }}>
              + {actions.length - 10} weitere Aktionen
            </div>
          )}
        </div>
      )}
    </div>
  )
}

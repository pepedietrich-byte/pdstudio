import { motion } from 'framer-motion'
import { Terminal } from 'lucide-react'

export default function LogsView({ leads = [] }) {
  const allWarnings = leads.flatMap(l => {
    const w = (l.warnings || []).map(msg => ({ lead: l.name || l.lead_id, level: 'warn', msg, tab: 'LEADS' }))
    const c = (l.content?.warnings || []).map(msg => ({ lead: l.name || l.lead_id, level: 'warn', msg, tab: 'CONTENT' }))
    const i = (l.images?.warnings  || []).map(msg => ({ lead: l.name || l.lead_id, level: 'warn', msg, tab: 'IMAGES' }))
    return [...w, ...c, ...i]
  })

  return (
    <div className="hud-border p-4">
      <div className="flex items-center gap-2 mb-4 border-b border-white/[0.06] pb-3">
        <Terminal size={12} className="text-cyan/60" />
        <span className="font-mono text-[10px] tracking-widest text-cyan/60">SYSTEM LOG</span>
        <span className="ml-auto font-mono text-[10px] text-white/30">{allWarnings.length} EVENTS</span>
      </div>
      <div className="max-h-64 overflow-y-auto space-y-0.5 font-mono text-xs">
        {allWarnings.length === 0 ? (
          <div className="text-center py-8 text-white/20 font-mono text-xs tracking-wider">
            NO LOG ENTRIES // SYSTEM NOMINAL
          </div>
        ) : (
          allWarnings.map((e, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.02 }}
              className="flex items-start gap-2 py-1 px-2 rounded hover:bg-white/[0.03]"
            >
              <span className="text-white/20 flex-shrink-0 text-[10px]">[{e.tab}]</span>
              <span className="text-white/40 flex-shrink-0 truncate max-w-[100px]">{e.lead}</span>
              <span className="text-neon-amber flex-1">{e.msg}</span>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}

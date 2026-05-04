export default function Card({ children, className = '', padding = true }) {
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-xl ${padding ? 'p-5' : ''} ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h3 className="text-slate-100 font-semibold text-base">{title}</h3>
        {subtitle && <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function StatCard({ label, value, sub, accent = false }) {
  return (
    <div className={`rounded-xl p-4 border ${accent ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-800/60 border-slate-700/50'}`}>
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent ? 'text-amber-400' : 'text-slate-100'}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

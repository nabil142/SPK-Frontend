import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const STEPS = [
  { num: 1, label: 'Kriteria',       key: 'criteria'        },
  { num: 2, label: 'Skala Kriteria', key: 'criteria-weight' },
  { num: 3, label: 'Alternatif',     key: 'alternatives'    },
  { num: 4, label: 'Nilai',          key: 'values'          },
  { num: 5, label: 'Skala Alt/AHP',  key: 'alt-comparison'  },
  { num: 6, label: 'Hasil',          key: 'results'         },
]

function getCaseId(pathname) {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length >= 2 && !isNaN(parts[1])) return parts[1]
  return null
}

export default function MainLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const caseId     = getCaseId(location.pathname)
  const activeStep = location.pathname.split('/').filter(Boolean)[0] ?? ''
  const isDashboard = activeStep === 'dashboard' || location.pathname === '/'

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }} className="bg-slate-950">

      {/* ── Sidebar ── */}
      <aside className="flex flex-col bg-slate-900 border-r border-slate-800 shrink-0" style={{ width: '240px' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
            <span className="text-slate-900 font-black text-sm">S</span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-100 leading-tight">SPK Properti</p>
            <p className="text-[10px] text-slate-500">Decision Support System</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          <button
            onClick={() => navigate('/dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all text-left ${
              isDashboard
                ? 'bg-amber-500/15 text-amber-400 border-l-2 border-amber-500 pl-3.5'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
          >
            🏠 Dashboard
          </button>

          {caseId && (
            <>
              <div className="mx-4 my-3 border-t border-slate-800" />
              <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1">
                Project #{caseId}
              </p>
              {STEPS.map((step) => {
                const isActive = activeStep === step.key
                return (
                  <button
                    key={step.key}
                    onClick={() => navigate(`/${step.key}/${caseId}`)}
                    className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm font-medium transition-all text-left ${
                      isActive
                        ? 'bg-blue-600/15 text-blue-400 border-l-2 border-blue-500 pl-3.5'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border ${
                      isActive
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-500'
                    }`}>
                      {step.num}
                    </span>
                    <span>{step.label}</span>
                  </button>
                )
              })}
            </>
          )}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-amber-400 shrink-0">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{user?.username || 'User'}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role || 'admin'}</p>
            </div>
            <button
              onClick={() => { logout(); navigate('/login') }}
              className="text-slate-500 hover:text-red-400 transition-colors text-base"
              title="Logout"
            >
              →
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content — OUTLET hanya di sini ── */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

    </div>
  )
}
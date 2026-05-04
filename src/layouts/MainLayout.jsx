import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useParams, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

// Sidebar hanya Dashboard — navigasi antar step dilakukan lewat StepNav di masing-masing halaman
const NAV_ITEMS = [
  { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
]

// Step links — hanya muncul saat user sedang di dalam sebuah project (ada caseId di URL)
const STEP_ITEMS = [
  { step: 1, path: 'criteria',        icon: '📋', label: 'Kriteria' },
  { step: 2, path: 'criteria-weight', icon: '⚖️', label: 'Skala Kriteria' },
  { step: 3, path: 'alternatives',    icon: '📍', label: 'Alternatif' },
  { step: 4, path: 'values',          icon: '📝', label: 'Nilai Alternatif' },
  { step: 5, path: 'alt-comparison',  icon: '📊', label: 'Skala Alt/AHP' },
  { step: 6, path: 'results',         icon: '🏆', label: 'Hasil' },
]

// Ekstrak caseId dari pathname (misal: /criteria/3 → "3")
function getCaseIdFromPath(pathname) {
  const match = pathname.match(/\/(criteria|criteria-weight|alternatives|values|alt-comparison|results)\/(\d+)/)
  return match ? match[2] : null
}

export default function MainLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const caseId = getCaseIdFromPath(location.pathname)
  const isInProject = !!caseId

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-64'} flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 shrink-0`}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
            <span className="text-slate-900 font-bold text-sm">S</span>
          </div>
          {!collapsed && (
            <div>
              <p className="text-white font-semibold text-sm leading-tight">SPK Properti</p>
              <p className="text-slate-500 text-xs">Decision Support</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">

          {/* Dashboard link */}
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-400 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`
              }
            >
              <span className="text-base w-5 text-center shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}

          {/* Step links — tampil saat sedang di dalam project */}
          {isInProject && (
            <>
              {!collapsed && (
                <div className="px-3 pt-5 pb-2">
                  <p className="text-slate-600 text-[10px] font-semibold uppercase tracking-widest">
                    Project #{caseId}
                  </p>
                </div>
              )}
              {collapsed && <div className="border-t border-slate-800 my-2" />}

              {STEP_ITEMS.map((item) => {
                const fullPath = `/${item.path}/${caseId}`
                const isActive = location.pathname === fullPath
                const isDone = STEP_ITEMS.findIndex(s => location.pathname === `/${s.path}/${caseId}`) > STEP_ITEMS.findIndex(s => s.path === item.path)

                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(fullPath)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                      isActive
                        ? 'bg-blue-600/15 text-blue-400 font-medium'
                        : isDone
                        ? 'text-emerald-500/70 hover:text-emerald-400 hover:bg-slate-800'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="shrink-0 flex items-center justify-center w-5">
                      {isDone
                        ? <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                        : <span className={`text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border ${
                            isActive ? 'border-blue-500 bg-blue-600/20 text-blue-400' : 'border-slate-700 text-slate-600'
                          }`}>{item.step}</span>
                      }
                    </span>
                    {!collapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </button>
                )
              })}
            </>
          )}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-slate-800 shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <span className="text-amber-400 text-xs font-bold">{user?.username?.[0]?.toUpperCase()}</span>
              </div>
              <div className="overflow-hidden">
                <p className="text-sm text-slate-200 font-medium truncate">{user?.username}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <span className="w-5 text-center shrink-0">⏻</span>
            {!collapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex items-center px-6 gap-4 shrink-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-500 hover:text-slate-200 transition-colors text-lg"
          >
            ☰
          </button>

          {/* Breadcrumb topbar */}
          {isInProject && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <button onClick={() => navigate('/dashboard')} className="hover:text-slate-300 transition-colors">
                Dashboard
              </button>
              <span className="text-slate-700">›</span>
              <span className="text-slate-400">Project #{caseId}</span>
            </div>
          )}

          <div className="flex-1" />

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
            <span>Backend terhubung</span>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
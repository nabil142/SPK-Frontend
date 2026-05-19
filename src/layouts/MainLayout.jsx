import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

// Modern SVG Icons
const Icons = {
  Home: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
  Brain: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v1H8a3 3 0 0 0-3 3 3 3 0 0 0 1 2.24"></path>
      <path d="M12 2a3 3 0 0 1 3 3v1h1a3 3 0 0 1 3 3 3 3 0 0 1-1 2.24"></path>
      <path d="M8 14v1a4 4 0 0 0 8 0v-1"></path>
      <path d="M12 18v4"></path>
    </svg>
  ),
  Logout: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
  Menu: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="18" x2="20" y2="18"></line></svg>,
  Close: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
}

const STEPS = [
  { num: 1, label: 'Kriteria', key: 'criteria' },
  { num: 2, label: 'Skala Kriteria', key: 'criteria-weight' },
  { num: 3, label: 'Alternatif', key: 'alternatives' },
  { num: 4, label: 'Nilai', key: 'values' },
  { num: 5, label: 'Skala Alt/AHP', key: 'alt-comparison' },
  { num: 6, label: 'Hasil', key: 'results' },
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

  // State untuk sidebar mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const caseId = getCaseId(location.pathname)
  const activeStep = location.pathname.split('/').filter(Boolean)[0] ?? ''
  const isDashboard = activeStep === 'dashboard' || location.pathname === '/'
  const isMachineLearning = activeStep === 'machine-learning'


  // Fungsi navigasi agar sidebar mobile menutup saat link diklik
  const handleNavigate = (path) => {
    navigate(path)
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0B0F19] text-slate-200 selection:bg-amber-500/30 selection:text-white">

      {/* ── Mobile Sidebar Overlay ── */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ── Sidebar (Modified for Right-Side Mobile Entry) ── */}
      <aside
        className={`fixed md:relative top-0 right-0 z-50 h-full w-[260px] bg-slate-950/80 md:bg-slate-950/50 backdrop-blur-xl border-l md:border-l-0 md:border-r border-slate-800/60 flex flex-col shrink-0 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
          }`}
      >
        {/* Mobile Close Button */}
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="md:hidden absolute top-4 left-4 text-slate-400 hover:text-white bg-slate-800/50 p-1.5 rounded-lg"
        >
          <Icons.Close />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-4 px-6 py-6 border-b border-slate-800/60 mt-10 md:mt-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0 border border-amber-300/20">
            <span className="text-slate-950 font-black text-lg">S</span>
          </div>
          <div>
            <p className="text-base font-bold text-white leading-tight tracking-tight">SPK Properti</p>
            <p className="text-[11px] font-medium text-slate-500">Decision Support System</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-6 overflow-y-auto custom-scrollbar">
          <div className="px-3 mb-2 space-y-1">
            <button
              onClick={() => handleNavigate('/dashboard')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 text-left group ${isDashboard
                  ? 'bg-gradient-to-r from-amber-500/10 to-transparent text-amber-400 shadow-[inset_2px_0_0_0_rgba(245,158,11,1)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
            >
              <span className={`${isDashboard ? 'text-amber-500' : 'text-slate-500 group-hover:text-slate-300'} transition-colors`}>
                <Icons.Home />
              </span>
              Dashboard
            </button>
            <button
              onClick={() => handleNavigate('/ml')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 text-left group ${isMachineLearning
                  ? 'bg-gradient-to-r from-purple-500/10 to-transparent text-purple-400 shadow-[inset_2px_0_0_0_rgba(168,85,247,1)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
            >
              <span className={`${isMachineLearning ? 'text-purple-500' : 'text-slate-500 group-hover:text-slate-300'} transition-colors`}>
                <Icons.Brain />
              </span>
              Machine Learning
            </button>
          </div>

          {caseId && (
            <div className="mt-4 px-3">
              <div className="flex items-center gap-3 px-4 mb-3">
                <div className="h-px bg-slate-800/60 flex-1"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Project #{caseId}
                </p>
                <div className="h-px bg-slate-800/60 flex-1"></div>
              </div>

              <div className="space-y-1">
                {STEPS.map((step) => {
                  const isActive = activeStep === step.key
                  return (
                    <button
                      key={step.key}
                      onClick={() => handleNavigate(`/${step.key}/${caseId}`)}
                      className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 text-left ${isActive
                          ? 'bg-gradient-to-r from-blue-600/10 to-transparent text-blue-400 shadow-[inset_2px_0_0_0_rgba(59,130,246,1)]'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                        }`}
                    >
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 transition-all ${isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 border border-blue-500'
                          : 'bg-slate-900 border border-slate-800/80 text-slate-500 group-hover:border-slate-700 group-hover:text-slate-300'
                        }`}>
                        {step.num}
                      </span>
                      <span className="tracking-wide">{step.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-950/30">
          <div className="flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-800/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center text-sm font-black text-amber-400 shrink-0 shadow-inner">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-200 truncate">{user?.username || 'Administrator'}</p>
              <p className="text-[11px] text-slate-500 font-medium capitalize tracking-wide">{user?.role || 'admin'}</p>
            </div>
            <button
              onClick={() => { logout(); navigate('/login') }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
              title="Logout"
            >
              <Icons.Logout />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

        {/* Mobile Header (Hanya muncul di HP) */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md z-30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0">
              <span className="text-slate-950 font-black text-xs">S</span>
            </div>
            <span className="font-bold text-slate-200">SPK Properti</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-slate-400 hover:text-white bg-slate-900 border border-slate-800 p-2 rounded-xl transition-colors"
          >
            <Icons.Menu />
          </button>
        </div>

        {/* Area scrollable untuk halaman-halaman dalam Outlet */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </div>
      </main>

    </div>
  )
}
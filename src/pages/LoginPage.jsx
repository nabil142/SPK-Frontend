import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

// Import FontAwesome untuk ikon profesional
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faLock, faEye, faEyeSlash, faExclamationCircle, faCircleNotch } from '@fortawesome/free-solid-svg-icons'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.username || !form.password) {
      setError('Username dan password wajib diisi')
      return
    }
    setLoading(true)
    const result = await login(form.username, form.password)
    setLoading(false)
    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.message || 'Login gagal, periksa kembali kredensial Anda')
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-200 flex selection:bg-amber-500/30 selection:text-white">
      {/* Left Panel - Billboard */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-950 border-r border-slate-800/60 flex-col justify-between p-16">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 30%, rgba(245, 158, 11, 0.08) 0%, transparent 50%),
                                radial-gradient(circle at 80% 80%, rgba(14, 165, 233, 0.05) 0%, transparent 50%)`,
            }}
          />
          <svg className="absolute inset-0 w-full h-full opacity-[0.15]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-pattern" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#475569" strokeWidth="0.5" />
                <circle cx="0" cy="0" r="1" fill="#64748b" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
          </svg>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-300/20">
            <span className="text-slate-950 font-black text-xl tracking-tighter">S</span>
          </div>
          <div>
            <p className="text-white font-bold text-xl tracking-tight leading-tight">SPK Properti</p>
            <p className="text-slate-400 text-sm font-medium">Decision Support System</p>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-8 mt-12">
          <div className="inline-flex items-center gap-2.5 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-full px-4 py-2 shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Multi-Method Analysis</span>
          </div>
          
          <h1 className="text-5xl xl:text-6xl font-black text-white leading-[1.1] tracking-tight">
            Temukan Lokasi<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
              Properti Terbaik
            </span>
          </h1>
          
          <p className="text-slate-400 text-lg leading-relaxed max-w-md font-light">
            Platform analitik keputusan tingkat lanjut berbasis algoritma matematis untuk memilih lokasi properti secara objektif dan terukur.
          </p>

          <div className="flex flex-wrap gap-2.5 pt-2 max-w-lg">
            {['AHP', 'SAW', 'TOPSIS', 'WP', 'SMART', 'ML Predict'].map((m) => (
              <span
                key={m}
                className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 hover:border-amber-500/30 hover:bg-slate-800/80 text-slate-300 text-xs font-semibold px-4 py-1.5 rounded-full transition-all duration-300 cursor-default"
              >
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Stats panel */}
        <div className="relative z-10 mt-12 bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 flex gap-10 max-w-xl shadow-2xl overflow-hidden">
          {/* subtle shine effect on stats panel */}
          <div className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
          {[
            { val: '5+', label: 'Metode Analisis' },
            { val: '100%', label: 'Berbasis Data' },
            { val: 'AI', label: 'Prediksi Cerdas' },
          ].map((s) => (
            <div key={s.label} className="flex-1 relative z-10">
              <p className="text-white font-black text-3xl mb-1">{s.val}</p>
              <p className="text-slate-400 text-sm font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="w-full max-w-[420px] relative z-10">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-3 mb-12 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <span className="text-slate-950 font-black text-lg">S</span>
            </div>
            <p className="text-white font-bold text-xl tracking-tight">SPK Properti</p>
          </div>

          <div className="bg-slate-900/30 sm:bg-slate-900/50 sm:backdrop-blur-xl sm:border border-slate-800/80 sm:p-8 rounded-3xl sm:shadow-2xl">
            <div className="mb-10 text-center sm:text-left">
              <h2 className="text-3xl font-bold text-white tracking-tight">Selamat Datang</h2>
              <p className="text-slate-400 mt-2 text-sm">Masuk ke sistem untuk mengakses dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                  Username
                </label>
                <div className="relative group">
                  {/* Profesionnal SVG Icon - faUser */}
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500 transition-colors duration-300 w-5 text-center flex items-center justify-center">
                    <FontAwesomeIcon icon={faUser} className="text-base" />
                  </div>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="Masukkan username"
                    autoComplete="username"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-slate-200 placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Password
                  </label>
                </div>
                <div className="relative group">
                  {/* Profesionnal SVG Icon - faLock */}
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500 transition-colors duration-300 w-5 text-center flex items-center justify-center">
                    <FontAwesomeIcon icon={faLock} className="text-base" />
                  </div>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Masukkan password"
                    autoComplete="current-password"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-12 py-3.5 text-slate-200 placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all duration-300"
                  />
                  {/* Toggle Password Button with professional faEye/faEyeSlash icons */}
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-white hover:bg-slate-800/50 transition-colors"
                    title={showPass ? 'Sembunyikan Password' : 'Lihat Password'}
                  >
                    <FontAwesomeIcon icon={showPass ? faEyeSlash : faEye} className="text-sm" />
                  </button>
                </div>
              </div>

              {/* Error Alert - dengan ikon faExclamationCircle */}
              {error && (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3.5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <FontAwesomeIcon icon={faExclamationCircle} className="text-red-400 text-lg shrink-0" />
                  <p className="text-red-400 text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Submit Button - dengan ikon loading spinner */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-slate-900 font-bold py-3.5 rounded-2xl text-sm shadow-xl shadow-amber-500/20 transition-all duration-200 flex items-center justify-center gap-3 mt-2"
              >
                {loading ? (
                  <>
                    <FontAwesomeIcon icon={faCircleNotch} className="animate-spin text-lg" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  'Masuk Sekarang →'
                )}
              </button>
            </form>

          </div>

          <p className="text-center text-xs text-slate-600 font-medium mt-8 sm:mt-12">
            © {new Date().getFullYear()} SPK Properti — Sistem Pendukung Keputusan
          </p>
        </div>
      </div>
    </div>
  )
}
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

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
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900 flex-col justify-between p-12">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, #f59e0b22 0%, transparent 50%),
                                radial-gradient(circle at 75% 75%, #0ea5e922 0%, transparent 50%)`,
            }}
          />
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
            <span className="text-slate-900 font-black text-lg">S</span>
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none">SPK Properti</p>
            <p className="text-slate-500 text-xs">Decision Support System</p>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="text-amber-400 text-xs font-medium">Multi-Method Analysis</span>
          </div>
          <h1 className="text-5xl font-black text-white leading-tight">
            Temukan Lokasi<br />
            <span className="text-amber-400">Properti Terbaik</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm">
            Platform analitik keputusan berbasis AHP, SAW, TOPSIS, WP, dan SMART untuk memilih lokasi properti secara objektif dan terukur.
          </p>

          {/* Method badges */}
          <div className="flex flex-wrap gap-2 pt-2">
            {['AHP', 'SAW', 'TOPSIS', 'WP', 'SMART', 'ML Predict'].map((m) => (
              <span
                key={m}
                className="bg-slate-800 border border-slate-700 text-slate-400 text-xs font-medium px-3 py-1 rounded-full"
              >
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="relative z-10 flex gap-8">
          {[
            { val: '5+', label: 'Metode Analisis' },
            { val: '100%', label: 'Berbasis Data' },
            { val: 'ML', label: 'Prediksi Cerdas' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-white font-bold text-xl">{s.val}</p>
              <p className="text-slate-500 text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center">
              <span className="text-slate-900 font-black">S</span>
            </div>
            <p className="text-white font-bold">SPK Properti</p>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white">Masuk ke Akun</h2>
            <p className="text-slate-500 mt-2 text-sm">Masukkan kredensial Anda untuk mengakses dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">👤</span>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="Masukkan username"
                  autoComplete="username"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-slate-200 placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔒</span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-12 py-3 text-slate-200 placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs transition-colors"
                >
                  {showPass ? 'Sembunyikan' : 'Tampilkan'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <span className="text-red-400 text-sm">⚠</span>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 font-bold py-3 rounded-xl text-sm transition-all duration-150 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Memverifikasi...</span>
                </>
              ) : (
                'Masuk Sekarang →'
              )}
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-6 p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <p className="text-xs text-slate-500 font-medium mb-2">Demo Credentials</p>
            <div className="flex gap-4 text-xs text-slate-600">
              <span>Username: <span className="text-slate-400 font-mono">admin</span></span>
              <span>Password: <span className="text-slate-400 font-mono">admin123</span></span>
            </div>
          </div>

          <p className="text-center text-xs text-slate-700 mt-8">
            © 2024 SPK Properti — Sistem Pendukung Keputusan
          </p>
        </div>
      </div>
    </div>
  )
}

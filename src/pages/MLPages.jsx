import { useEffect, useState } from 'react'

// ─────────────────────────────────────
// ICON COMPONENTS
// ─────────────────────────────────────
const Icons = {
  Brain: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3Z"/>
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3Z"/>
    </svg>
  ),
  Sparkles: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    </svg>
  ),
  ChartBar: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  Target: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  Hash: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>
    </svg>
  ),
  Activity: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  AlertCircle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  User: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Loader: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
      <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
    </svg>
  ),
}

// ─────────────────────────────────────
// STAT CARD (same style as Dashboard)
// ─────────────────────────────────────
function StatCard({ label, value, accent, icon: Icon, color = 'blue' }) {
  const colorMap = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  }
  return (
    <div className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-5 flex flex-col gap-3">
      {Icon && (
        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${colorMap[color]}`}>
          <Icon />
        </div>
      )}
      <div>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-2xl font-black ${accent ? 'text-white' : 'text-slate-200'}`}>{value ?? '—'}</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────
// RESULT STAT CARD
// ─────────────────────────────────────
function ResultMetric({ label, value, icon: Icon, color = 'cyan' }) {
  const colorMap = {
    cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', glow: 'shadow-[0_0_10px_rgba(6,182,212,0.15)]' },
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', glow: 'shadow-[0_0_10px_rgba(16,185,129,0.15)]' },
    amber: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', glow: 'shadow-[0_0_10px_rgba(245,158,11,0.15)]' },
    blue: { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', glow: 'shadow-[0_0_10px_rgba(59,130,246,0.15)]' },
  }
  const c = colorMap[color]
  return (
    <div className={`${c.bg} ${c.border} ${c.glow} border rounded-2xl p-5 flex items-center gap-4`}>
      <div className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center ${c.text}`}>
        <Icon />
      </div>
      <div>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{label}</p>
        <p className={`text-xl font-black ${c.text}`}>{value ?? '—'}</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────
export default function MLPage() {

  const token = localStorage.getItem('spk_token')

  const [criteria, setCriteria] = useState([])
  const [selectedCriteria, setSelectedCriteria] = useState([])
  const [features, setFeatures] = useState({})
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [alternativeName, setAlternativeName] = useState('')

  useEffect(() => { loadCriteria() }, [])

  const loadCriteria = async () => {
    try {
      const res = await fetch('https://spk-property-backend-production.up.railway.app/api/v1/ml/criteria-options', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal load criteria')

      // Normalisasi & deduplikasi berdasarkan name lowercase
      const raw = data.data || []
      const seen = new Set()
      const deduped = raw
        .map(c => ({ ...c, name: c.name.toLowerCase().trim() }))
        .filter(c => {
          if (seen.has(c.name)) return false
          seen.add(c.name)
          return true
        })

      setCriteria(deduped)
    } catch (err) {
      console.error(err)
      setError(err.message)
    }
  }

  const toggleCriteria = (name) => {
    setSelectedCriteria(prev =>
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    )
  }

  const handleInput = (name, value) => {
    setFeatures(prev => ({ ...prev, [name]: value }))
  }

  const formatLabel = (name) =>
    name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

  const handlePredict = async () => {
    try {
      setLoading(true)
      setPrediction(null)
      setError('')

      if (!alternativeName.trim()) throw new Error('Nama alternatif wajib diisi')
      if (!Array.isArray(selectedCriteria) || selectedCriteria.length < 1)
        throw new Error('Pilih minimal 1 kriteria')

      const datasetRes = await fetch('https://spk-property-backend-production.up.railway.app/api/v1/ml/dataset?method=SAW', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const datasetData = await datasetRes.json()
      if (!datasetRes.ok) throw new Error(datasetData.error || 'Gagal mengambil dataset')

      const payload = {}
      selectedCriteria.forEach(name => { payload[name] = Number(features[name]) || 0 })

      const filteredFeatureInfo = datasetData.data.feature_info.filter(
        f => selectedCriteria.includes(f.name)
      )
      const selectedIndexes = datasetData.data.feature_info
        .map((f, index) => ({ name: f.name, index }))
        .filter(f => selectedCriteria.includes(f.name))
        .map(f => f.index)
      const filteredSamples = datasetData.data.samples.map(s => ({
        ...s,
        features: selectedIndexes.map(i => s.features[i])
      }))

      const res = await fetch('https://spk-ml-production.up.railway.app/ml/predict-dynamic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataset: { feature_info: filteredFeatureInfo, samples: filteredSamples },
          features: payload
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal prediksi')

      setPrediction(data)

      await fetch('https://spk-property-backend-production.up.railway.app/api/v1/ml/save-prediction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          alternative_name: alternativeName,
          criteria_used: selectedCriteria,
          predicted_score: data.predicted_score,
          predicted_rank: data.estimated_rank
        })
      })
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ─────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-200 p-6 md:p-10 relative">

      {/* Ambient glow — same as Dashboard */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto space-y-8">

        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                <Icons.Brain />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Machine Learning
              </h1>
            </div>
            <p className="text-slate-400 text-sm md:text-base">
              Prediksi skor &amp; estimasi ranking menggunakan dataset SPK yang ada.
            </p>
          </div>

          {/* Live badge */}
          <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)] animate-pulse" />
            <span className="text-slate-300 text-xs font-bold uppercase tracking-widest">SAW Dataset</span>
          </div>
        </div>

        {/* ── STATS ROW ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Kriteria" value={criteria.length} accent icon={Icons.Hash} color="blue" />
          <StatCard label="Dipilih" value={selectedCriteria.length} icon={Icons.Target} color="cyan" />
          <StatCard label="Benefit" value={criteria.filter(c => c.type === 'benefit').length} icon={Icons.Activity} color="emerald" />
          <StatCard label="Cost" value={criteria.filter(c => c.type === 'cost').length} icon={Icons.ChartBar} color="amber" />
        </div>

        {/* ── NAMA ALTERNATIF ── */}
        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-sm bg-cyan-500" /> Identitas Alternatif
          </p>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
              <Icons.User />
            </div>
            <input
              type="text"
              value={alternativeName}
              onChange={(e) => setAlternativeName(e.target.value)}
              placeholder="Contoh: Perumahan Griya Indah"
              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-950/50 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/10 transition-all text-sm font-medium"
            />
          </div>
        </div>

        {/* ── PILIH KRITERIA ── */}
        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-sm bg-blue-500" /> Pilih Kriteria
            </p>
            {selectedCriteria.length > 0 && (
              <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg border bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                {selectedCriteria.length} dipilih
              </span>
            )}
          </div>

          {criteria.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <svg className="animate-spin w-8 h-8 text-blue-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <p className="text-sm font-medium">Memuat kriteria...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {criteria.map(c => {
                const isSelected = selectedCriteria.includes(c.name)
                return (
                  <label
                    key={c.name}
                    className={`flex items-center justify-between p-4 rounded-xl cursor-pointer border transition-all duration-200 ${
                      isSelected
                        ? 'bg-blue-500/10 border-blue-500/40 shadow-[0_0_12px_rgba(59,130,246,0.1)]'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Custom checkbox */}
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-slate-700 bg-slate-900'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCriteria(c.name)}
                        className="hidden"
                      />
                      <span className={`text-sm font-semibold transition-colors ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {c.label}
                      </span>
                    </div>

                    <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                      c.type === 'benefit'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {c.type}
                    </span>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        {/* ── INPUT NILAI ── */}
        {selectedCriteria.length > 0 && (
          <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-6 shadow-xl">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-sm bg-emerald-500" /> Input Nilai Kriteria
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedCriteria.map(name => (
                <div key={name}>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                    {formatLabel(name)}
                  </label>
                  <input
                    type="number"
                    value={features[name] || ''}
                    onChange={(e) => handleInput(name, e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/50 border border-slate-800 text-white placeholder-slate-700 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10 transition-all text-sm font-mono font-semibold"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TOMBOL PREDIKSI ── */}
        <button
          onClick={handlePredict}
          disabled={loading}
          className={`flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-lg ${
            loading
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white shadow-cyan-500/25 hover:-translate-y-0.5 active:translate-y-0'
          }`}
        >
          {loading ? (
            <><Icons.Loader /> Memproses...</>
          ) : (
            <><Icons.Sparkles /> Jalankan Prediksi</>
          )}
        </button>

        {/* ── HASIL PREDIKSI ── */}
        {prediction && (
          <div className="bg-slate-900/40 backdrop-blur-sm border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.08)] rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <Icons.CheckCircle />
              </div>
              <div>
                <p className="text-white font-bold text-lg">Hasil Prediksi</p>
                <p className="text-slate-500 text-xs">
                  {alternativeName && (
                    <span className="text-amber-400 font-semibold">{alternativeName} · </span>
                  )}
                  {selectedCriteria.length} kriteria digunakan
                </p>
              </div>
              <span className="ml-auto text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                Selesai
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ResultMetric label="Predicted Score" value={prediction.predicted_score} icon={Icons.Target} color="cyan" />
              <ResultMetric label="Estimated Rank" value={`#${prediction.estimated_rank}`} icon={Icons.ChartBar} color="emerald" />
              <ResultMetric label="R² Score" value={prediction.r2_score} icon={Icons.Activity} color="blue" />
              <ResultMetric label="MAE" value={prediction.mae} icon={Icons.Sparkles} color="amber" />
            </div>

            {/* Criteria chips */}
            <div className="pt-4 border-t border-slate-800/60">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-3">Kriteria yang digunakan</p>
              <div className="flex flex-wrap gap-2">
                {selectedCriteria.map(name => (
                  <span key={name} className="text-xs font-semibold px-3 py-1 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-300">
                    {formatLabel(name)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
        {error && (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.08)]">
            <div className="mt-0.5 shrink-0"><Icons.AlertCircle /></div>
            <div>
              <p className="font-bold text-sm mb-0.5">Terjadi Kesalahan</p>
              <p className="text-red-400/80 text-sm">{error}</p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
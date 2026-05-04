import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { calculate, getResults, predictML } from '../services/api'
import Button from '../components/Button'
import Card from '../components/Card'

// Dummy results data
const DUMMY_RESULTS = {
  case_name: 'Pemilihan Lokasi Kantor Surabaya',
  alternatives: ['Lokasi A', 'Lokasi B', 'Lokasi C', 'Lokasi D', 'Lokasi E'],
  methods: {
    AHP:    { scores: [0.2845, 0.2312, 0.1987, 0.1654, 0.1202], rankings: [1, 2, 3, 4, 5] },
    SAW:    { scores: [0.8120, 0.7650, 0.6890, 0.5430, 0.4210], rankings: [1, 2, 3, 4, 5] },
    TOPSIS: { scores: [0.7234, 0.6891, 0.5120, 0.4320, 0.3150], rankings: [1, 2, 3, 4, 5] },
    WP:     { scores: [0.2540, 0.2210, 0.1890, 0.1820, 0.1540], rankings: [1, 2, 3, 5, 4] },
    SMART:  { scores: [82.50, 74.30, 65.20, 58.40, 47.10], rankings: [1, 2, 3, 4, 5] },
  },
  ml_prediction: {
    rankings: [1, 2, 3, 4, 5],
    confidence: [0.94, 0.88, 0.72, 0.61, 0.45],
    model: 'Random Forest',
    accuracy: 0.921,
  },
}

const METHOD_COLORS = {
  AHP:    { bg: 'bg-purple-500/10', border: 'border-purple-500/25', text: 'text-purple-400', accent: '#a855f7' },
  SAW:    { bg: 'bg-blue-500/10',   border: 'border-blue-500/25',   text: 'text-blue-400',   accent: '#3b82f6' },
  TOPSIS: { bg: 'bg-emerald-500/10',border: 'border-emerald-500/25',text: 'text-emerald-400',accent: '#10b981' },
  WP:     { bg: 'bg-amber-500/10',  border: 'border-amber-500/25',  text: 'text-amber-400',  accent: '#f59e0b' },
  SMART:  { bg: 'bg-rose-500/10',   border: 'border-rose-500/25',   text: 'text-rose-400',   accent: '#f43f5e' },
}

const MEDAL = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣']

export default function ResultsPage() {
  const { caseId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(DUMMY_RESULTS)
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [predicting, setPredicting] = useState(false)
  const [activeMethod, setActiveMethod] = useState('AHP')
  const [chartRendered, setChartRendered] = useState(false)
  const barChartRef = useRef(null)
  const radarChartRef = useRef(null)
  const barChartInstance = useRef(null)
  const radarChartInstance = useRef(null)

  useEffect(() => {
    fetchResults()
  }, [caseId])

  useEffect(() => {
    if (data && window.Chart) {
      renderCharts()
    } else if (data) {
      const script = document.getElementById('chartjs-script')
      if (!script) {
        const s = document.createElement('script')
        s.id = 'chartjs-script'
        s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
        s.onload = () => { setChartRendered(true) }
        document.head.appendChild(s)
      }
    }
  }, [data])

  useEffect(() => {
    if (chartRendered && data) renderCharts()
  }, [chartRendered, activeMethod, data])

  const fetchResults = async () => {
    setLoading(true)
    try {
      const res = await getResults(caseId)
      setData(res.data)
    } catch {}
    finally { setLoading(false) }
  }

  const handleCalculate = async () => {
    setCalculating(true)
    try {
      const res = await calculate(caseId)
      setData(res.data)
    } catch {
      // shuffle dummy data slightly for demo
      setData({ ...DUMMY_RESULTS })
    } finally { setCalculating(false) }
  }

  const handlePredict = async () => {
    setPredicting(true)
    try {
      const res = await predictML(caseId)
      setData((prev) => ({ ...prev, ml_prediction: res.data }))
    } catch {}
    finally { setPredicting(false) }
  }

  const renderCharts = () => {
    if (!window.Chart || !data) return

    // Bar Chart
    if (barChartRef.current) {
      if (barChartInstance.current) barChartInstance.current.destroy()
      const method = data.methods[activeMethod]
      const ctx = barChartRef.current.getContext('2d')
      barChartInstance.current = new window.Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.alternatives,
          datasets: [{
            label: `Skor ${activeMethod}`,
            data: method.scores,
            backgroundColor: data.alternatives.map((_, i) =>
              i === 0 ? METHOD_COLORS[activeMethod].accent + 'dd' : METHOD_COLORS[activeMethod].accent + '55'
            ),
            borderColor: METHOD_COLORS[activeMethod].accent,
            borderWidth: 1,
            borderRadius: 6,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1e293b',
              borderColor: '#334155',
              borderWidth: 1,
              titleColor: '#e2e8f0',
              bodyColor: '#94a3b8',
              callbacks: {
                label: (ctx) => ` Skor: ${ctx.parsed.y.toFixed(4)}`,
              },
            },
          },
          scales: {
            x: { grid: { color: '#1e293b' }, ticks: { color: '#64748b', font: { size: 11 } } },
            y: { grid: { color: '#1e293b' }, ticks: { color: '#64748b', font: { size: 11 } } },
          },
        },
      })
    }

    // Radar Chart — all methods, alt at rank 1
    if (radarChartRef.current) {
      if (radarChartInstance.current) radarChartInstance.current.destroy()
      const ctx = radarChartRef.current.getContext('2d')
      const methods = Object.keys(data.methods)

      // For each method, find top-ranked alt's normalized score
      const normalize = (arr) => {
        const max = Math.max(...arr), min = Math.min(...arr)
        return arr.map((v) => max === min ? 1 : (v - min) / (max - min))
      }

      const datasets = data.alternatives.slice(0, 3).map((altName, altIdx) => {
        const color = ['#f59e0b', '#3b82f6', '#10b981'][altIdx]
        return {
          label: altName,
          data: methods.map((m) => normalize(data.methods[m].scores)[altIdx]),
          borderColor: color,
          backgroundColor: color + '22',
          borderWidth: 2,
          pointBackgroundColor: color,
        }
      })

      radarChartInstance.current = new window.Chart(ctx, {
        type: 'radar',
        data: { labels: methods, datasets },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 12 },
            },
          },
          scales: {
            r: {
              grid: { color: '#1e293b' },
              pointLabels: { color: '#94a3b8', font: { size: 12 } },
              ticks: { color: '#475569', backdropColor: 'transparent', font: { size: 10 } },
              min: 0, max: 1,
            },
          },
        },
      })
    }
  }

  // Compute consensus ranking
  const computeConsensus = () => {
    if (!data) return []
    const n = data.alternatives.length
    const totalRankScore = data.alternatives.map((_, i) => {
      let sum = 0
      Object.values(data.methods).forEach((m) => { sum += m.rankings[i] })
      if (data.ml_prediction) sum += data.ml_prediction.rankings[i]
      return sum
    })
    const sorted = data.alternatives
      .map((name, i) => ({ name, score: totalRankScore[i], originalIdx: i }))
      .sort((a, b) => a.score - b.score)
    return sorted.map((item, rank) => ({ ...item, rank: rank + 1 }))
  }

  const consensus = computeConsensus()
  const winner = consensus[0]

  const steps = [
    { label: 'Kriteria', path: `/criteria/${caseId}` },
    { label: 'Alternatif', path: `/alternatives/${caseId}` },
    { label: 'Nilai', path: `/values/${caseId}` },
    { label: 'AHP', path: `/ahp/${caseId}` },
    { label: 'Hasil', path: `/results/${caseId}` },
  ]

  return (
    <div className="p-8 space-y-8">
      {/* Steps nav */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {steps.map((step, i, arr) => (
          <span key={step.path} className="flex items-center gap-2">
            <button
              onClick={() => navigate(step.path)}
              className={`font-medium transition-colors ${
                step.path === `/results/${caseId}` ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {step.label}
            </button>
            {i < arr.length - 1 && <span className="text-slate-700">›</span>}
          </span>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Hasil Analisis SPK</h1>
          <p className="text-slate-500 text-sm mt-1">
            {data?.case_name ?? `Project #${caseId}`} — Perbandingan 5 metode + Machine Learning
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={handleCalculate}
            loading={calculating}
          >
            ⟳ Hitung Ulang
          </Button>
          <Button
            variant="secondary"
            onClick={handlePredict}
            loading={predicting}
          >
            🤖 Prediksi ML
          </Button>
          <Button onClick={() => navigate('/dashboard')}>← Dashboard</Button>
        </div>
      </div>

      {/* Winner Banner */}
      {winner && (
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/30 rounded-2xl p-6">
          <div className="absolute right-0 top-0 bottom-0 w-48 opacity-5"
            style={{ backgroundImage: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }} />
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-3xl">
              🏆
            </div>
            <div>
              <p className="text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
                Rekomendasi Terbaik — Konsensus Semua Metode
              </p>
              <h2 className="text-white text-xl font-bold">{winner.name}</h2>
              <p className="text-amber-300/70 text-sm mt-0.5">
                Unggul dalam {Object.keys(data.methods).length} dari {Object.keys(data.methods).length} metode analisis
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Method tabs + table */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {Object.keys(METHOD_COLORS).map((m) => (
            <button
              key={m}
              onClick={() => { setActiveMethod(m); setTimeout(renderCharts, 50) }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                activeMethod === m
                  ? `${METHOD_COLORS[m].bg} ${METHOD_COLORS[m].border} ${METHOD_COLORS[m].text}`
                  : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:text-slate-300'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Results Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <p className="text-slate-300 font-semibold text-sm">
              Ranking — Metode <span className={METHOD_COLORS[activeMethod].text}>{activeMethod}</span>
            </p>
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${METHOD_COLORS[activeMethod].bg} ${METHOD_COLORS[activeMethod].border} ${METHOD_COLORS[activeMethod].text}`}>
              {activeMethod}
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-20">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Alternatif</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Skor</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-48">Visualisasi</th>
              </tr>
            </thead>
            <tbody>
              {data && data.methods[activeMethod] && (
                data.alternatives
                  .map((name, i) => ({
                    name,
                    score: data.methods[activeMethod].scores[i],
                    rank: data.methods[activeMethod].rankings[i],
                    idx: i,
                  }))
                  .sort((a, b) => a.rank - b.rank)
                  .map((row) => {
                    const maxScore = Math.max(...data.methods[activeMethod].scores)
                    const pct = (row.score / maxScore) * 100
                    return (
                      <tr key={row.name} className={`border-b border-slate-800/60 ${row.rank === 1 ? 'bg-amber-500/5' : 'hover:bg-slate-800/30'}`}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{MEDAL[row.rank - 1]}</span>
                            <span className="text-slate-400 font-mono text-xs">#{row.rank}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`font-medium ${row.rank === 1 ? 'text-amber-300' : 'text-slate-300'}`}>
                            {row.name}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="font-mono text-slate-300 text-sm">{row.score.toFixed(4)}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2 justify-end">
                            <div className="flex-1 max-w-[120px] bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: METHOD_COLORS[activeMethod].accent,
                                }}
                              />
                            </div>
                            <span className="text-xs text-slate-500 font-mono w-10 text-right">{pct.toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-slate-300 font-semibold text-sm mb-4">
            Perbandingan Skor — <span className={METHOD_COLORS[activeMethod].text}>{activeMethod}</span>
          </p>
          <div style={{ height: '260px' }}>
            <canvas ref={barChartRef} />
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-slate-300 font-semibold text-sm mb-4">Radar Chart — Top 3 Alternatif</p>
          <div style={{ height: '260px' }}>
            <canvas ref={radarChartRef} />
          </div>
        </div>
      </div>

      {/* All Methods Comparison Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <p className="text-slate-300 font-semibold text-sm">Perbandingan Ranking Semua Metode</p>
          <p className="text-slate-500 text-xs mt-0.5">Angka menunjukkan peringkat (1 = terbaik)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Alternatif</th>
                {data && Object.keys(data.methods).map((m) => (
                  <th key={m} className={`px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider ${METHOD_COLORS[m].text}`}>
                    {m}
                  </th>
                ))}
                {data?.ml_prediction && (
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-cyan-400">
                    ML 🤖
                  </th>
                )}
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-amber-400">
                  Konsensus
                </th>
              </tr>
            </thead>
            <tbody>
              {data && consensus.map((item) => (
                <tr key={item.name} className={`border-b border-slate-800/60 ${item.rank === 1 ? 'bg-amber-500/5' : 'hover:bg-slate-800/30'}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span>{MEDAL[item.rank - 1]}</span>
                      <span className={`font-medium ${item.rank === 1 ? 'text-amber-300' : 'text-slate-300'}`}>
                        {item.name}
                      </span>
                    </div>
                  </td>
                  {Object.keys(data.methods).map((m) => {
                    const rank = data.methods[m].rankings[item.originalIdx]
                    return (
                      <td key={m} className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${
                          rank === 1
                            ? `${METHOD_COLORS[m].bg} ${METHOD_COLORS[m].text} border ${METHOD_COLORS[m].border}`
                            : 'text-slate-400'
                        }`}>
                          {rank}
                        </span>
                      </td>
                    )
                  })}
                  {data.ml_prediction && (
                    <td className="px-4 py-3.5 text-center">
                      <div>
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${
                          data.ml_prediction.rankings[item.originalIdx] === 1
                            ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25'
                            : 'text-slate-400'
                        }`}>
                          {data.ml_prediction.rankings[item.originalIdx]}
                        </span>
                        <p className="text-slate-600 text-xs mt-0.5">
                          {(data.ml_prediction.confidence[item.originalIdx] * 100).toFixed(0)}%
                        </p>
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3.5 text-center">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-sm font-black border ${
                      item.rank === 1
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {item.rank}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ML Section */}
      {data?.ml_prediction && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
              <span className="text-cyan-400">🤖</span>
            </div>
            <div>
              <p className="text-slate-200 font-semibold text-sm">Prediksi Machine Learning</p>
              <p className="text-slate-500 text-xs">
                Model: {data.ml_prediction.model} — Akurasi: {(data.ml_prediction.accuracy * 100).toFixed(1)}%
              </p>
            </div>
            <div className="ml-auto">
              <span className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold px-3 py-1 rounded-full">
                {(data.ml_prediction.accuracy * 100).toFixed(1)}% Akurasi
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {data.alternatives.map((name, i) => {
              const rank = data.ml_prediction.rankings[i]
              const conf = data.ml_prediction.confidence[i]
              return (
                <div
                  key={name}
                  className={`p-3 rounded-xl border text-center ${
                    rank === 1
                      ? 'bg-cyan-500/10 border-cyan-500/25'
                      : 'bg-slate-800/50 border-slate-700/50'
                  }`}
                >
                  <span className="text-xl block mb-1">{MEDAL[rank - 1]}</span>
                  <p className="text-slate-300 text-xs font-medium leading-tight">{name}</p>
                  <p className="text-slate-500 text-xs mt-1.5">Confidence</p>
                  <p className={`text-sm font-bold ${rank === 1 ? 'text-cyan-400' : 'text-slate-400'}`}>
                    {(conf * 100).toFixed(0)}%
                  </p>
                  {/* Confidence bar */}
                  <div className="mt-2 bg-slate-700 rounded-full h-1 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-cyan-500"
                      style={{ width: `${conf * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

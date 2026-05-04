import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCriteria, getAlternatives, saveAltComparisons, validateAltConsistency } from '../services/api'
import Button from '../components/Button'
import StepNav from '../components/StepNav'

const SCALE_VALUES = [1/9, 1/7, 1/5, 1/3, 1, 3, 5, 7, 9]
const SCALE_STEPS  = [9,   7,   5,   3,   1, 3, 5, 7, 9]
const SCALE_LABELS = ['9','7','5','3','1','3','5','7','9']

const DUMMY_CRITERIA = [
  { criteria_id: 1, criteria_name: 'Harga Tanah',    criteria_type: 'cost'    },
  { criteria_id: 2, criteria_name: 'Aksesibilitas',  criteria_type: 'benefit' },
  { criteria_id: 3, criteria_name: 'Fasilitas Umum', criteria_type: 'benefit' },
]
const DUMMY_ALTS = [
  { alternative_id: 1, alternative_name: 'Lowokwaru' },
  { alternative_id: 2, alternative_name: 'Blimbing'  },
  { alternative_id: 3, alternative_name: 'Dau'       },
]

function getPairs(list) {
  const pairs = []
  for (let i = 0; i < list.length; i++)
    for (let j = i + 1; j < list.length; j++)
      pairs.push([list[i], list[j]])
  return pairs
}

function calcWeights(items, sliders, criteriaId) {
  const n = items.length
  if (n < 2) return items.map(() => 1 / n)
  const mat = Array.from({ length: n }, () => Array(n).fill(1))
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const key = `${criteriaId}_${items[i].alternative_id}_${items[j].alternative_id}`
      const val = sliders[key] ?? 1
      mat[i][j] = val
      mat[j][i] = 1 / val
    }
  }
  const gm = mat.map(row => Math.pow(row.reduce((a, b) => a * b, 1), 1 / n))
  const sum = gm.reduce((a, b) => a + b, 0)
  return gm.map(v => v / sum)
}

function calcCR(items, sliders, criteriaId, weights) {
  const n = items.length
  if (n < 2) return { cr: 0, isValid: true }
  const mat = Array.from({ length: n }, () => Array(n).fill(1))
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const key = `${criteriaId}_${items[i].alternative_id}_${items[j].alternative_id}`
      const val = sliders[key] ?? 1
      mat[i][j] = val
      mat[j][i] = 1 / val
    }
  }
  let lambdaSum = 0
  for (let i = 0; i < n; i++) {
    let row = 0
    for (let j = 0; j < n; j++) row += mat[i][j] * weights[j]
    lambdaSum += row / weights[i]
  }
  const lambda = lambdaSum / n
  const CI = (lambda - n) / (n - 1)
  const RI = [0, 0, 0, 0.58, 0.90, 1.12, 1.24, 1.32, 1.41, 1.45]
  const cr = (RI[n] ?? 1.45) === 0 ? 0 : CI / (RI[n] ?? 1.45)
  return { cr: cr.toFixed(4), isValid: cr <= 0.1 }
}

// Slider row component
function AltSliderRow({ left, right, criteriaId, value, onChange }) {
  const idx = SCALE_VALUES.findIndex(v => Math.abs(v - value) < 0.0001)
  const pos = idx === -1 ? 4 : idx

  let dominant, times
  if (pos === 4) { dominant = null; times = 1 }
  else if (pos < 4) { dominant = left.alternative_name; times = SCALE_STEPS[pos] }
  else { dominant = right.alternative_name; times = SCALE_STEPS[pos] }

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl px-5 py-4">
      <div className="flex items-center gap-4">
        <span className={`w-24 text-right text-sm font-semibold shrink-0 ${pos < 4 ? 'text-blue-400' : 'text-slate-500'}`}>
          {left.alternative_name}
        </span>

        <div className="flex-1 relative">
          <div className="flex justify-between mb-1">
            {SCALE_LABELS.map((l, i) => (
              <span key={i} className={`text-[10px] font-mono w-5 text-center ${
                i === 4 ? 'text-slate-500' : i < 4 ? 'text-blue-500/70' : 'text-slate-500/60'
              }`}>{l}</span>
            ))}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 flex items-center w-full pointer-events-none">
              <div className="w-full h-1.5 rounded-full overflow-hidden flex">
                <div className="flex-1 bg-blue-600/40" style={{ flexGrow: pos }} />
                <div className="w-3 shrink-0 bg-blue-600 rounded-full" />
                <div className="flex-1 bg-slate-600/40" style={{ flexGrow: 8 - pos }} />
              </div>
            </div>
            <input
              type="range" min={0} max={8} step={1} value={pos}
              onChange={e => onChange(SCALE_VALUES[parseInt(e.target.value)])}
              className="relative w-full h-4 bg-transparent appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5
                [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:border-2
                [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md
                [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform
                [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5
                [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500
                [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-grab
              "
            />
          </div>
          <div className="flex justify-between mt-1">
            {SCALE_LABELS.map((_, i) => (
              <div key={i} className={`w-px h-1.5 mx-auto ${i === pos ? 'bg-blue-400' : 'bg-slate-700'}`} />
            ))}
          </div>
        </div>

        <span className={`w-24 text-left text-sm font-semibold shrink-0 ${pos > 4 ? 'text-slate-300' : 'text-slate-500'}`}>
          {right.alternative_name}
        </span>
      </div>

      <p className="text-center text-xs mt-2.5 font-medium">
        {pos === 4 ? (
          <span className="text-slate-500">
            <span className="text-slate-400 font-semibold">{left.alternative_name}</span> dan{' '}
            <span className="text-slate-400 font-semibold">{right.alternative_name}</span> sama penting
          </span>
        ) : (
          <span className="text-blue-400">
            <span className="font-bold text-blue-300">{dominant}</span>{' '}
            {times}x lebih penting dari{' '}
            <span className="font-semibold text-slate-400">
              {pos < 4 ? right.alternative_name : left.alternative_name}
            </span>
          </span>
        )}
      </p>
    </div>
  )
}

export default function AltComparisonPage() {
  const { caseId } = useParams()
  const navigate  = useNavigate()
  const [criteria,  setCriteria]  = useState(DUMMY_CRITERIA)
  const [alts,      setAlts]      = useState(DUMMY_ALTS)
  const [sliders,   setSliders]   = useState({})
  const [activeCrit, setActiveCrit] = useState(0)  // index dari criteria
  const [crResults, setCRResults] = useState({})   // keyed by criteria_id
  const [saving,    setSaving]    = useState(false)

  useEffect(() => {
    getCriteria(caseId).then(r => setCriteria(r.data)).catch(() => {})
    getAlternatives(caseId).then(r => setAlts(r.data)).catch(() => {})
  }, [caseId])

  const pairs = useMemo(() => getPairs(alts), [alts])
  const activeCriteria = criteria[activeCrit] ?? criteria[0]

  const handleChange = (criteriaId, altId1, altId2, val) => {
    const key = `${criteriaId}_${altId1}_${altId2}`
    setSliders(prev => ({ ...prev, [key]: val }))
    setCRResults(prev => { const n = {...prev}; delete n[criteriaId]; return n })
  }

  const weightsForCriteria = (cId) => calcWeights(alts, sliders, cId)

  const handleValidateAll = async () => {
    const results = {}
    criteria.forEach(c => {
      const w = weightsForCriteria(c.criteria_id)
      results[c.criteria_id] = calcCR(alts, sliders, c.criteria_id, w)
    })
    setCRResults(results)
  }

  const handleSave = async () => {
    setSaving(true)
    const allComparisons = []
    criteria.forEach(c => {
      pairs.forEach(([a, b]) => {
        const key = `${c.criteria_id}_${a.alternative_id}_${b.alternative_id}`
        allComparisons.push({
          case_id: Number(caseId),
          criteria_id: c.criteria_id,
          alt_1: a.alternative_id,
          alt_2: b.alternative_id,
          comparison_value: sliders[key] ?? 1,
        })
      })
    })
    try { await saveAltComparisons({ case_id: Number(caseId), comparisons: allComparisons }) } catch {}
    setSaving(false)
    navigate(`/results/${caseId}`)
  }

  // Hitung progress: berapa kriteria sudah diisi semua pasangan
  const filledCount = criteria.filter(c =>
    pairs.every(([a, b]) => sliders[`${c.criteria_id}_${a.alternative_id}_${b.alternative_id}`] !== undefined)
  ).length

  const crAll = criteria.map(c => crResults[c.criteria_id])
  const allValid = crAll.every(r => r && r.isValid)
  const anyInvalid = crAll.some(r => r && !r.isValid)

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <StepNav caseId={caseId} currentStep={5} />

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">📊</span>
          <h1 className="text-2xl font-bold text-white">Langkah 5: Perbandingan Alternatif (AHP)</h1>
        </div>
        <p className="text-slate-500 text-sm ml-11">
          Bandingkan setiap pasang lokasi untuk tiap kriteria. Langkah ini hanya dibutuhkan oleh AHP.
        </p>
      </div>

      {/* AHP only badge */}
      <div className="flex items-start gap-3 bg-purple-500/10 border border-purple-500/20 rounded-xl px-4 py-3">
        <span className="text-purple-400 shrink-0">🎯</span>
        <p className="text-purple-300 text-sm">
          Langkah ini <span className="font-bold">khusus untuk AHP</span>. Metode lain (SAW, WP, TOPSIS, SMART) sudah dapat dihitung dari langkah sebelumnya.
        </p>
      </div>

      {/* CR summary */}
      {Object.keys(crResults).length > 0 && (
        <div className={`rounded-xl p-4 border flex items-center gap-4 ${
          allValid ? 'bg-emerald-500/10 border-emerald-500/20' :
          anyInvalid ? 'bg-red-500/10 border-red-500/20' :
          'bg-amber-500/10 border-amber-500/20'
        }`}>
          <span className="text-2xl">{allValid ? '✓' : anyInvalid ? '✕' : '⚠'}</span>
          <div className="flex-1">
            <p className={`font-semibold text-sm ${allValid ? 'text-emerald-300' : 'text-red-300'}`}>
              {allValid ? 'Semua matriks konsisten' : 'Ada matriks yang tidak konsisten'}
            </p>
            <div className="flex flex-wrap gap-3 mt-1.5">
              {criteria.map(c => {
                const r = crResults[c.criteria_id]
                if (!r) return null
                return (
                  <span key={c.criteria_id} className={`text-xs font-mono px-2 py-0.5 rounded ${
                    r.isValid ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                  }`}>
                    {c.criteria_name}: CR={r.cr} {r.isValid ? '✓' : '✕'}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Criteria tabs */}
      <div className="flex flex-wrap gap-2">
        {criteria.map((c, i) => {
          const cr = crResults[c.criteria_id]
          const filled = pairs.every(([a, b]) =>
            sliders[`${c.criteria_id}_${a.alternative_id}_${b.alternative_id}`] !== undefined
          )
          return (
            <button
              key={c.criteria_id}
              onClick={() => setActiveCrit(i)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all flex items-center gap-2 ${
                activeCrit === i
                  ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                  : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cr ? (cr.isValid ? '✓' : '✕') : filled ? '●' : '○'}
              {c.criteria_name}
            </button>
          )
        })}
      </div>

      {/* Active criteria panel */}
      {activeCriteria && (
        <div className="bg-slate-900/60 border border-blue-500/20 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-blue-400 text-xs font-bold">📌</span>
            <p className="text-blue-300 text-sm font-semibold">
              Kriteria: {activeCriteria.criteria_name}
            </p>
          </div>

          {pairs.map(([a, b]) => (
            <AltSliderRow
              key={`${activeCriteria.criteria_id}_${a.alternative_id}_${b.alternative_id}`}
              left={a}
              right={b}
              criteriaId={activeCriteria.criteria_id}
              value={sliders[`${activeCriteria.criteria_id}_${a.alternative_id}_${b.alternative_id}`] ?? 1}
              onChange={val => handleChange(activeCriteria.criteria_id, a.alternative_id, b.alternative_id, val)}
            />
          ))}

          {/* Bobot alternatif untuk kriteria ini */}
          {alts.length > 0 && (
            <div className="pt-2 border-t border-slate-800 mt-4">
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">
                Bobot alternatif untuk {activeCriteria.criteria_name}
              </p>
              <div className="space-y-2">
                {alts.map((alt, i) => {
                  const w = weightsForCriteria(activeCriteria.criteria_id)
                  return (
                    <div key={alt.alternative_id} className="flex items-center gap-3">
                      <span className="text-slate-400 text-sm w-28 shrink-0">{alt.alternative_name}</span>
                      <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-blue-500/80 rounded-full transition-all duration-500"
                          style={{ width: `${((w[i] ?? 0) * 100).toFixed(1)}%` }}
                        />
                      </div>
                      <span className="text-slate-400 font-mono text-xs w-12 text-right">
                        {((w[i] ?? 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Progress: x/n kriteria */}
          <div className="pt-3 border-t border-slate-800">
            <div className="w-full bg-slate-800 rounded-full h-1.5">
              <div
                className="h-1.5 bg-blue-500 rounded-full transition-all"
                style={{ width: `${(filledCount / Math.max(criteria.length, 1)) * 100}%` }}
              />
            </div>
            <p className="text-slate-600 text-xs text-center mt-1.5">
              {filledCount}/{criteria.length} kriteria
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="secondary" onClick={() => navigate(`/values/${caseId}`)}>
          ← Kembali
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleValidateAll}>
            Validasi Semua CR
          </Button>
          <Button onClick={handleSave} loading={saving} className="gap-2">
            <span>📊</span> Hitung Semua Metode →
          </Button>
        </div>
      </div>
    </div>
  )
}
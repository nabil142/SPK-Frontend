import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCriteria, saveCriteriaComparisons, validateCriteriaConsistency } from '../services/api'
import Button from '../components/Button'
import StepNav from '../components/StepNav'

// Skala Saaty 1/9 .. 9
const SCALE_STEPS = [9, 7, 5, 3, 1, 3, 5, 7, 9]
// Index 0..4 = kiri lebih penting (1/9..1), index 4 = sama, index 5..8 = kanan lebih penting
const SCALE_VALUES = [1/9, 1/7, 1/5, 1/3, 1, 3, 5, 7, 9]
const SCALE_LABELS = ['9','7','5','3','1','3','5','7','9']

const DUMMY_CRITERIA = [
  { criteria_id: 1, criteria_name: 'Harga Tanah',     criteria_type: 'cost'    },
  { criteria_id: 2, criteria_name: 'Aksesibilitas',   criteria_type: 'benefit' },
  { criteria_id: 3, criteria_name: 'Fasilitas Umum',  criteria_type: 'benefit' },
]

// Buat semua pasangan (i, j) dengan i < j
function getPairs(criteria) {
  const pairs = []
  for (let i = 0; i < criteria.length; i++)
    for (let j = i + 1; j < criteria.length; j++)
      pairs.push([criteria[i], criteria[j]])
  return pairs
}

// Hitung bobot dari matriks perbandingan berpasangan (geometric mean method)
function calcWeights(criteria, sliders) {
  const n = criteria.length
  if (n === 0) return []

  // Bangun matriks
  const mat = Array.from({ length: n }, () => Array(n).fill(1))
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const key = `${criteria[i].criteria_id}_${criteria[j].criteria_id}`
      const val = sliders[key] ?? SCALE_VALUES[4] // default = 1 (sama penting)
      mat[i][j] = val
      mat[j][i] = 1 / val
    }
  }

  // Geometric mean per baris
  const gm = mat.map(row => {
    const prod = row.reduce((acc, v) => acc * v, 1)
    return Math.pow(prod, 1 / n)
  })
  const gmSum = gm.reduce((a, b) => a + b, 0)
  return gm.map(v => v / gmSum)
}

// Hitung Consistency Ratio
function calcCR(criteria, sliders, weights) {
  const n = criteria.length
  if (n < 2) return { cr: 0, isValid: true, lambda: n }

  const mat = Array.from({ length: n }, () => Array(n).fill(1))
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const key = `${criteria[i].criteria_id}_${criteria[j].criteria_id}`
      const val = sliders[key] ?? 1
      mat[i][j] = val
      mat[j][i] = 1 / val
    }
  }

  // λ_max = rata-rata (Aw / w)
  let lambdaSum = 0
  for (let i = 0; i < n; i++) {
    let rowSum = 0
    for (let j = 0; j < n; j++) rowSum += mat[i][j] * weights[j]
    lambdaSum += rowSum / weights[i]
  }
  const lambda = lambdaSum / n
  const CI = (lambda - n) / (n - 1)

  // Random Index (Saaty)
  const RI = [0, 0, 0, 0.58, 0.90, 1.12, 1.24, 1.32, 1.41, 1.45]
  const ri = RI[n] ?? 1.45
  const cr = ri === 0 ? 0 : CI / ri

  return { cr: cr.toFixed(4), isValid: cr <= 0.1, lambda: lambda.toFixed(4) }
}

// Komponen satu baris slider
function ComparisonRow({ left, right, value, onChange }) {
  // value = SCALE_VALUES index 0..8 (slider position)
  const idx = SCALE_VALUES.findIndex(v => Math.abs(v - value) < 0.0001)
  const pos = idx === -1 ? 4 : idx

  // Tentukan siapa yang lebih penting dan berapa kali
  let dominant, times
  if (pos === 4) {
    dominant = null
    times = 1
  } else if (pos < 4) {
    dominant = left.criteria_name
    times = SCALE_STEPS[pos]
  } else {
    dominant = right.criteria_name
    times = SCALE_STEPS[pos]
  }

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl px-6 py-5">
      <div className="flex items-center gap-4">
        {/* Label kiri */}
        <span className={`w-32 text-right text-sm font-semibold shrink-0 transition-colors ${pos < 4 ? 'text-blue-400' : 'text-slate-500'}`}>
          {left.criteria_name}
        </span>

        {/* Slider area */}
        <div className="flex-1 relative">
          {/* Tick labels di atas */}
          <div className="flex justify-between mb-1.5">
            {SCALE_LABELS.map((l, i) => (
              <span key={i} className={`text-[10px] font-mono w-5 text-center leading-none
                ${i === 4 ? 'text-slate-500' : i < 4 ? 'text-blue-500/70' : 'text-slate-500/70'}
              `}>{l}</span>
            ))}
          </div>

          {/* Custom styled range input */}
          <div className="relative">
            {/* Track background: kiri = biru, kanan = abu */}
            <div className="absolute inset-y-0 flex items-center w-full pointer-events-none">
              <div className="w-full h-1.5 rounded-full overflow-hidden flex">
                <div className="flex-1 bg-blue-600/40" style={{ flexGrow: pos }} />
                <div className="flex-shrink-0 w-3 bg-blue-600 rounded-full" />
                <div className="flex-1 bg-slate-600/40" style={{ flexGrow: 8 - pos }} />
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={8}
              step={1}
              value={pos}
              onChange={e => onChange(SCALE_VALUES[parseInt(e.target.value)])}
              className="relative w-full h-4 bg-transparent appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-5
                [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-blue-500
                [&::-webkit-slider-thumb]:border-2
                [&::-webkit-slider-thumb]:border-white
                [&::-webkit-slider-thumb]:shadow-md
                [&::-webkit-slider-thumb]:cursor-grab
                [&::-webkit-slider-thumb]:transition-transform
                [&::-webkit-slider-thumb]:hover:scale-110
                [&::-moz-range-thumb]:w-5
                [&::-moz-range-thumb]:h-5
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-blue-500
                [&::-moz-range-thumb]:border-2
                [&::-moz-range-thumb]:border-white
                [&::-moz-range-thumb]:border-none
                [&::-moz-range-thumb]:cursor-grab
              "
            />
          </div>

          {/* Tick marks di bawah */}
          <div className="flex justify-between mt-1">
            {SCALE_LABELS.map((_, i) => (
              <div key={i} className={`w-px h-1.5 mx-auto ${i === pos ? 'bg-blue-400' : 'bg-slate-700'}`} />
            ))}
          </div>
        </div>

        {/* Label kanan */}
        <span className={`w-32 text-left text-sm font-semibold shrink-0 transition-colors ${pos > 4 ? 'text-slate-300' : 'text-slate-500'}`}>
          {right.criteria_name}
        </span>
      </div>

      {/* Keterangan di bawah */}
      <p className="text-center text-xs mt-3 font-medium">
        {pos === 4 ? (
          <span className="text-slate-500">
            <span className="text-slate-400 font-semibold">{left.criteria_name}</span> dan <span className="text-slate-400 font-semibold">{right.criteria_name}</span> sama penting
          </span>
        ) : (
          <span className="text-blue-400">
            <span className="font-bold text-blue-300">{dominant}</span>
            {' '}{times}x lebih penting dari{' '}
            <span className="font-semibold text-slate-400">{pos < 4 ? right.criteria_name : left.criteria_name}</span>
          </span>
        )}
      </p>
    </div>
  )
}

export default function CriteriaWeightPage() {
  const { caseId } = useParams()
  const navigate = useNavigate()
  const [criteria, setCriteria] = useState(DUMMY_CRITERIA)
  const [sliders, setSliders] = useState({}) // key: "id1_id2" => value (SCALE_VALUES number)
  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState(false)
  const [crResult, setCRResult] = useState(null)

  useEffect(() => {
    getCriteria(caseId).then(r => setCriteria(r.data)).catch(() => {})
  }, [caseId])

  const pairs = useMemo(() => getPairs(criteria), [criteria])

  const getSliderVal = (id1, id2) => sliders[`${id1}_${id2}`] ?? SCALE_VALUES[4]

  const handleSliderChange = (id1, id2, val) => {
    setSliders(prev => ({ ...prev, [`${id1}_${id2}`]: val }))
    setCRResult(null)
  }

  const weights = useMemo(() => calcWeights(criteria, sliders), [criteria, sliders])

  const handleValidate = async () => {
    setValidating(true)
    const w = calcWeights(criteria, sliders)
    const result = calcCR(criteria, sliders, w)
    try {
      const res = await validateCriteriaConsistency(caseId)
      setCRResult({ cr: res.data.cr, isValid: res.data.is_consistent })
    } catch {
      setCRResult(result)
    } finally {
      setValidating(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    const comparisons = pairs.map(([a, b]) => ({
      case_id: Number(caseId),
      criteria_1: a.criteria_id,
      criteria_2: b.criteria_id,
      comparison_value: getSliderVal(a.criteria_id, b.criteria_id),
    }))
    try {
      await saveCriteriaComparisons({ case_id: Number(caseId), comparisons, weights })
    } catch {}
    setSaving(false)
    navigate(`/alternatives/${caseId}`)
  }

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <StepNav caseId={caseId} currentStep={2} />

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">⚖️</span>
          <h1 className="text-2xl font-bold text-white">Langkah 2: Perbandingan Skala Kriteria</h1>
        </div>
        <p className="text-slate-500 text-sm ml-11">
          Skala ini digunakan AHP untuk menentukan bobot kriteria — bobot yang sama akan dipakai SAW, WP, SMART, TOPSIS.
        </p>
      </div>

      {/* Info banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
        <span className="text-blue-400 text-base shrink-0 mt-0.5">💡</span>
        <p className="text-blue-300 text-sm">
          Bobot dari AHP akan otomatis digunakan oleh semua metode lainnya (SAW, WP, SMART, TOPSIS).
        </p>
      </div>

      {/* CR Result */}
      {crResult && (
        <div className={`rounded-xl p-4 border flex items-center gap-4 ${
          crResult.isValid
            ? 'bg-emerald-500/10 border-emerald-500/20'
            : 'bg-red-500/10 border-red-500/20'
        }`}>
          <span className={`text-2xl ${crResult.isValid ? 'text-emerald-400' : 'text-red-400'}`}>
            {crResult.isValid ? '✓' : '✕'}
          </span>
          <div>
            <p className={`font-semibold text-sm ${crResult.isValid ? 'text-emerald-300' : 'text-red-300'}`}>
              {crResult.isValid ? 'Matriks Konsisten — dapat dilanjutkan' : 'Matriks Tidak Konsisten — perbaiki perbandingan'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              CR = <span className="font-mono font-bold">{crResult.cr}</span>
              {crResult.isValid ? ' (CR ≤ 0.1 ✓)' : ' (CR > 0.1 — perlu diperbaiki)'}
            </p>
          </div>
        </div>
      )}

      {/* Slider pairs */}
      {criteria.length < 2 ? (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 text-center">
          <p className="text-amber-300 text-sm">
            Tambahkan minimal 2 kriteria terlebih dahulu di langkah sebelumnya.
          </p>
          <Button variant="outline" className="mt-3" onClick={() => navigate(`/criteria/${caseId}`)}>
            ← Kembali ke Kriteria
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {pairs.map(([a, b]) => (
            <ComparisonRow
              key={`${a.criteria_id}_${b.criteria_id}`}
              left={a}
              right={b}
              value={getSliderVal(a.criteria_id, b.criteria_id)}
              onChange={val => handleSliderChange(a.criteria_id, b.criteria_id, val)}
            />
          ))}
        </div>
      )}

      {/* Bobot preview */}
      {weights.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Preview Bobot Kriteria (hasil perhitungan)
          </p>
          <div className="space-y-2.5">
            {criteria.map((c, i) => (
              <div key={c.criteria_id} className="flex items-center gap-3">
                <span className="text-slate-400 text-sm w-36 shrink-0">{c.criteria_name}</span>
                <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${(weights[i] * 100).toFixed(1)}%` }}
                  />
                </div>
                <span className="text-blue-400 font-mono text-sm w-16 text-right">
                  {(weights[i] * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="secondary" onClick={() => navigate(`/criteria/${caseId}`)}>
          ← Kembali
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleValidate} loading={validating}>
            Validasi Konsistensi
          </Button>
          <Button onClick={handleSave} loading={saving}>
            Lanjut →
          </Button>
        </div>
      </div>
    </div>
  )
}
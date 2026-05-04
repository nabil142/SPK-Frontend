import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getCriteria,
  getAlternatives,
  saveAltComparisons,
  calculateAHPRanking
} from '../services/api'
import Button from '../components/Button'
import StepNav from '../components/StepNav'

const SCALE_STEPS  = [9, 7, 5, 3, 1, 3, 5, 7, 9]
const SCALE_VALUES = [1/9, 1/7, 1/5, 1/3, 1, 3, 5, 7, 9]
const SCALE_LABELS = ['9', '7', '5', '3', '1', '3', '5', '7', '9']

// ── Helpers ────────────────────────────────────────────────────────
function getPairs(list) {
  const pairs = []
  for (let i = 0; i < list.length; i++)
    for (let j = i + 1; j < list.length; j++)
      pairs.push([list[i], list[j]])
  return pairs
}

function getId(item) { return item.alternative_id ?? item.criteria_id ?? item.id }

function calcWeights(alts, sliders, criteriaId) {
  const n = alts.length
  if (n === 0) return []
  const mat = Array.from({ length: n }, () => Array(n).fill(1))
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const v = sliders[`${criteriaId}_${getId(alts[i])}_${getId(alts[j])}`] ?? 1
      mat[i][j] = v
      mat[j][i] = 1 / v
    }
  const gm  = mat.map(row => Math.pow(row.reduce((a, b) => a * b, 1), 1 / n))
  const sum = gm.reduce((a, b) => a + b, 0)
  return gm.map(v => v / sum)
}

function calculateCR(alts, sliders, weights, criteriaId) {
  const n = alts.length
  if (n < 3) return { cr: 0, isValid: true }
  const mat = Array.from({ length: n }, () => Array(n).fill(1))
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const v = sliders[`${criteriaId}_${getId(alts[i])}_${getId(alts[j])}`] ?? 1
      mat[i][j] = v
      mat[j][i] = 1 / v
    }
  let lambdaMax = 0
  for (let i = 0; i < n; i++) {
    let rowSum = 0
    for (let j = 0; j < n; j++) rowSum += mat[i][j] * weights[j]
    lambdaMax += rowSum / weights[i]
  }
  lambdaMax /= n
  const CI = (lambdaMax - n) / (n - 1)
  const RI_TABLE = [0, 0, 0.58, 0.90, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49]
  const RI = RI_TABLE[n - 1] ?? 1.49
  const CR = CI / RI
  return { cr: isNaN(CR) ? 0 : Number(CR.toFixed(3)), isValid: CR <= 0.1 }
}

// ── Comparison Row ─────────────────────────────────────────────────
function ComparisonRow({ left, right, value, onChange, onSave }) {
  const idx = SCALE_VALUES.findIndex(v => Math.abs(v - value) < 0.0001)
  const pos = idx === -1 ? 4 : idx

  const dominantName   = pos <= 4 ? left.alternative_name  : right.alternative_name
  const subordinateName = pos <= 4 ? right.alternative_name : left.alternative_name
  const times = SCALE_STEPS[pos]

  return (
    <div className="py-5 border-b border-slate-700/50 last:border-b-0">
      <div className="flex items-center gap-5">
        <span className={`w-32 text-right text-sm font-semibold shrink-0 transition-colors duration-150 ${pos < 4 ? 'text-blue-400' : 'text-slate-400'}`}>
          {left.alternative_name}
        </span>

        <div className="flex-1">
          <div className="flex justify-between mb-3 px-0.5">
            {SCALE_LABELS.map((label, i) => (
              <span key={i} className={`w-6 h-6 flex items-center justify-center text-[11px] font-bold rounded-md transition-all ${i === pos ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : i < 4 ? 'text-blue-400/50' : 'text-slate-600'}`}>
                {label}
              </span>
            ))}
          </div>

          <div className="relative flex items-center">
            <div className="absolute left-0 h-1.5 rounded-l-full bg-blue-600/70 pointer-events-none transition-all" style={{ width: `${(pos / 8) * 100}%` }} />
            <div className="absolute right-0 h-1.5 rounded-r-full bg-slate-600/40 pointer-events-none transition-all" style={{ width: `${((8 - pos) / 8) * 100}%` }} />
            <input
              type="range"
              min={0} max={8} step={1}
              value={pos}
              onChange={e => onChange(SCALE_VALUES[parseInt(e.target.value)])}
              onMouseUp={onSave}
              onTouchEnd={onSave}
              className="relative w-full h-1.5 bg-transparent appearance-none cursor-pointer z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-slate-900 [&::-webkit-slider-thumb]:cursor-grab"
            />
          </div>

          <p className="text-center text-xs mt-3 font-medium">
            <span className="text-blue-400 font-bold">{dominantName}</span>
            <span className="text-slate-500">
              {' '}{times === 1 ? 'sama penting dengan' : `${times}x lebih penting dari`}{' '}
            </span>
            <span className="text-slate-400 font-semibold">{pos === 4 ? right.alternative_name : subordinateName}</span>
          </p>
        </div>

        <span className={`w-32 text-left text-sm font-semibold shrink-0 transition-colors duration-150 ${pos > 4 ? 'text-blue-400' : 'text-slate-400'}`}>
          {right.alternative_name}
        </span>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────
export default function AltComparisonPage() {
  const { caseId }  = useParams()
  const navigate    = useNavigate()

  const [criteria,   setCriteria]   = useState([])
  const [alts,       setAlts]       = useState([])
  const [sliders,    setSliders]    = useState({})
  
  const [activeCrit, setActiveCrit] = useState(0)
  const [isSaving,   setIsSaving]   = useState(false)
  const [saveStatus, setSaveStatus] = useState('')
  
  const [validating, setValidating] = useState(false)
  const [crResult,   setCRResult]   = useState(null)

  const slidersRef = useRef(sliders)

  // 1. Muat Cache & Fetch API
  useEffect(() => {
    const savedState = localStorage.getItem(`ahp_alts_${caseId}`)
    if (savedState) {
      const parsed = JSON.parse(savedState)
      setSliders(parsed)
      slidersRef.current = parsed
    }

    const fetchData = async () => {
      try {
        const [cRes, aRes] = await Promise.all([
          getCriteria(caseId),
          getAlternatives(caseId)
        ])
        setCriteria(cRes.data?.data || cRes.data || [])
        setAlts(aRes.data?.data || aRes.data || [])
      } catch (err) {
        console.error("FETCH ERROR:", err)
      }
    }
    fetchData()
  }, [caseId])

  const pairs = useMemo(() => getPairs(alts), [alts])
  const activeCriteriaObj = criteria[activeCrit]
  const activeCriteriaId = activeCriteriaObj ? getId(activeCriteriaObj) : null

  // Calculate local weights per active criteria
  const currentWeights = useMemo(() => {
    if (!activeCriteriaId) return []
    return calcWeights(alts, sliders, activeCriteriaId)
  }, [alts, sliders, activeCriteriaId])

  const getSliderVal = (cId, id1, id2) => sliders[`${cId}_${id1}_${id2}`] ?? 1

  const handleSliderChange = (cId, id1, id2, val) => {
    const newSliders = { ...sliders, [`${cId}_${id1}_${id2}`]: val }
    setSliders(newSliders)
    slidersRef.current = newSliders
    setCRResult(null)
    setSaveStatus('Menunggu...')
  }

  const handleValidate = () => {
    setValidating(true)
    setTimeout(() => {
      setCRResult(calculateCR(alts, sliders, currentWeights, activeCriteriaId))
      setValidating(false)
    }, 350)
  }

  // Auto-save: Menyimpan ke LocalStorage & Backend sekaligus
  const autoSaveData = async () => {
    if (criteria.length === 0 || alts.length < 2) return true

    // Simpan ke Cache Browser (Sangat Penting agar state tidak hilang)
    localStorage.setItem(`ahp_alts_${caseId}`, JSON.stringify(slidersRef.current))

    try {
      setIsSaving(true)
      setSaveStatus('Menyimpan...')

      const comparisons = []
      criteria.forEach(c => {
        const cId = getId(c)
        pairs.forEach(([a, b]) => {
          const id1 = getId(a)
          const id2 = getId(b)

          comparisons.push({
            case_id: Number(caseId),
            criteria_id: cId,
            // Dikirim ganda agar kompatibel dengan berbagai bentuk parameter Backend
            alt_1: id1,
            alt_2: id2,
            alternative_1: id1, 
            alternative_2: id2,
            comparison_value: slidersRef.current[`${cId}_${id1}_${id2}`] ?? 1
          })
        })
      })

      // POST ke DB Backend
      await saveAltComparisons({ case_id: Number(caseId), comparisons })
      
      // Auto-calc AHP Ranking di background
      await calculateAHPRanking(caseId).catch(() => {}) 

      setSaveStatus('Disimpan otomatis')
      setTimeout(() => setSaveStatus(''), 2000)
      return true
    } catch (err) {
      console.error("SAVE ALT ERROR:", err)
      setSaveStatus('Gagal menyimpan!')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const handleNavigate = async (path) => {
    await autoSaveData()
    navigate(path)
  }

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <StepNav caseId={caseId} currentStep={5} />

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl">🏢</span>
              <h1 className="text-xl font-semibold text-white">
                Langkah 5: Perbandingan Alternatif (AHP)
              </h1>
              {saveStatus && (
                <span className={`text-xs px-2 py-1 rounded-full ${saveStatus.includes('Gagal') ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                  {isSaving ? '⏳ ' : (saveStatus.includes('Gagal') ? '⚠ ' : '✓ ')}{saveStatus}
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm ml-10">
              Bandingkan setiap alternatif berdasarkan kriteria yang dipilih. Data tersimpan otomatis.
            </p>
          </div>
        </div>

        {/* Tab Navigasi Kriteria */}
        <div className="flex gap-2 flex-wrap pt-2">
          {criteria.map((c, i) => (
            <button
              key={getId(c)}
              onClick={() => {
                setActiveCrit(i)
                setCRResult(null) // Reset CR indikator ketika pindah tab
              }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                i === activeCrit
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              Kriteria: {c.criteria_name}
            </button>
          ))}
        </div>

        {/* Indikator Validasi CR */}
        {crResult && (
          <div className={`rounded-xl px-4 py-3.5 border flex items-start gap-3 ${crResult.isValid ? 'bg-emerald-500/10 border-emerald-500/25' : 'bg-red-500/10 border-red-500/25'}`}>
            <span className={`text-lg shrink-0 font-bold ${crResult.isValid ? 'text-emerald-400' : 'text-red-400'}`}>
              {crResult.isValid ? '✓' : '✕'}
            </span>
            <div>
              <p className={`text-sm font-semibold ${crResult.isValid ? 'text-emerald-300' : 'text-red-300'}`}>
                Consistency Ratio (CR) = {crResult.cr}
              </p>
              <p className={`text-xs mt-0.5 ${crResult.isValid ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
                {crResult.isValid ? 'Matriks konsisten (CR ≤ 0.1). Lanjutkan ke kriteria berikutnya.' : 'Matriks tidak konsisten (CR > 0.1). Silakan sesuaikan perbandingan di atas.'}
              </p>
            </div>
          </div>
        )}

        {/* Slider Render */}
        {alts.length < 2 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 text-sm">Tambahkan minimal 2 alternatif properti terlebih dahulu.</p>
            <Button variant="outline" className="mt-4" onClick={() => handleNavigate(`/alternatives/${caseId}`)}>
              ← Kembali ke Alternatif
            </Button>
          </div>
        ) : activeCriteriaId ? (
          <div className="border border-slate-700/60 rounded-xl px-6 divide-y divide-slate-700/40">
            {pairs.map(([a, b]) => {
              const id1 = getId(a), id2 = getId(b)
              return (
                <ComparisonRow
                  key={`${activeCriteriaId}_${id1}_${id2}`}
                  left={a}  
                  right={b}
                  value={getSliderVal(activeCriteriaId, id1, id2)}
                  onChange={val => handleSliderChange(activeCriteriaId, id1, id2, val)}
                  onSave={autoSaveData} 
                />
              )
            })}
          </div>
        ) : null}

        {/* Preview Bobot Lokal */}
        {currentWeights.length > 0 && (
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
              Preview Prioritas Alternatif (Untuk Kriteria {activeCriteriaObj?.criteria_name})
            </p>
            <div className="space-y-2.5">
              {alts.map((alt, i) => (
                <div key={getId(alt)} className="flex items-center gap-3">
                  <span className="text-slate-400 text-sm w-36 shrink-0 truncate">{alt.alternative_name}</span>
                  <div className="flex-1 bg-slate-700/50 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${((currentWeights[i] ?? 0) * 100).toFixed(1)}%` }} />
                  </div>
                  <span className="text-blue-400 font-mono text-sm w-14 text-right">{((currentWeights[i] ?? 0) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={() => handleNavigate(`/values/${caseId}`)}>← Kembali</Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleValidate} loading={validating}>Validasi Konsistensi CR</Button>
          <Button onClick={() => handleNavigate(`/results/${caseId}`)}>Hitung & Lihat Hasil →</Button>
        </div>
      </div>
    </div>
  )
}
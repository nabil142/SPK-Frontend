import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getCriteria,
  getAlternatives,
  saveAltComparisons,
  calculateAHPRanking
} from '../services/api'

import Button from '../components/Button'
import StepNav from '../components/StepNav'

const SCALE_VALUES = [1/9, 1/7, 1/5, 1/3, 1, 3, 5, 7, 9]

// =========================
// HELPER
// =========================
const getPairs = (list) => {
  const pairs = []
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      pairs.push([list[i], list[j]])
    }
  }
  return pairs
}

const calcWeights = (alts, sliders, criteriaId) => {
  const n = alts.length
  if (n === 0) return []

  const mat = Array.from({ length: n }, () => Array(n).fill(1))

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const id1 = alts[i].alternative_id || alts[i].id
      const id2 = alts[j].alternative_id || alts[j].id

      const key = `${criteriaId}_${id1}_${id2}`
      const val = sliders[key] ?? 1

      mat[i][j] = val
      mat[j][i] = 1 / val
    }
  }

  const gm = mat.map(row => {
    const prod = row.reduce((a, b) => a * b, 1)
    return Math.pow(prod, 1 / n)
  })

  const sum = gm.reduce((a, b) => a + b, 0)
  return gm.map(v => v / sum)
}

// =========================
// COMPONENT
// =========================
export default function AltComparisonPage() {
  const { caseId } = useParams()
  const navigate = useNavigate()

  const [criteria, setCriteria] = useState([])
  const [alts, setAlts] = useState([])
  const [sliders, setSliders] = useState({})
  const [activeCrit, setActiveCrit] = useState(0)
  const [saving, setSaving] = useState(false)

  // =========================
  // FETCH DATA
  // =========================
  useEffect(() => {
    fetchData()
  }, [caseId])

  const fetchData = async () => {
    try {
      const [cRes, aRes] = await Promise.all([
        getCriteria(caseId),
        getAlternatives(caseId)
      ])

      setCriteria(cRes.data.data || cRes.data)
      setAlts(aRes.data.data || aRes.data)

    } catch (err) {
      console.error("FETCH ERROR:", err)
    }
  }

  const pairs = useMemo(() => getPairs(alts), [alts])
  const activeCriteria = criteria[activeCrit]

  const handleChange = (criteriaId, id1, id2, val) => {
    setSliders(prev => ({
      ...prev,
      [`${criteriaId}_${id1}_${id2}`]: val
    }))
  }

  // =========================
  // SAVE
  // =========================
  const handleSave = async () => {
    setSaving(true)

    try {
      const comparisons = []

      criteria.forEach(c => {
        const cId = c.criteria_id || c.id

        pairs.forEach(([a, b]) => {
          const id1 = a.alternative_id || a.id
          const id2 = b.alternative_id || b.id

          comparisons.push({
            case_id: Number(caseId),
            criteria_id: cId,
            alt_1: id1,
            alt_2: id2,
            comparison_value:
              sliders[`${cId}_${id1}_${id2}`] ?? 1
          })
        })
      })

      await saveAltComparisons({
        case_id: Number(caseId),
        comparisons
      })

      // hitung ranking AHP
      await calculateAHPRanking(caseId)

      navigate(`/results/${caseId}`)

    } catch (err) {
      console.error("SAVE ALT ERROR:", err)
    } finally {
      setSaving(false)
    }
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">

      <StepNav caseId={caseId} currentStep={5} />

      <h1 className="text-xl font-bold">
        Perbandingan Alternatif (AHP)
      </h1>

      {/* Tabs Kriteria */}
      <div className="flex gap-2 flex-wrap">
        {criteria.map((c, i) => {
          const cId = c.criteria_id || c.id

          return (
            <button
              key={cId}
              onClick={() => setActiveCrit(i)}
              className={`px-3 py-1 rounded ${
                i === activeCrit ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              {c.criteria_name}
            </button>
          )
        })}
      </div>

      {/* Slider */}
      {activeCriteria && (
        <div className="space-y-4">

          {pairs.map(([a, b]) => {
            const cId = activeCriteria.criteria_id || activeCriteria.id
            const id1 = a.alternative_id || a.id
            const id2 = b.alternative_id || b.id

            const key = `${cId}_${id1}_${id2}`

            return (
              <div key={key} className="border p-4 rounded">
                <p className="text-sm mb-2">
                  {a.alternative_name} vs {b.alternative_name}
                </p>

                <input
                  type="range"
                  min={0}
                  max={8}
                  value={SCALE_VALUES.indexOf(sliders[key] ?? 1)}
                  onChange={(e) =>
                    handleChange(
                      cId,
                      id1,
                      id2,
                      SCALE_VALUES[e.target.value]
                    )
                  }
                  className="w-full"
                />
              </div>
            )
          })}

          {/* Preview bobot */}
          <div className="mt-4">
            <h3 className="font-semibold">Bobot:</h3>

            {alts.map((alt, i) => {
              const w = calcWeights(
                alts,
                sliders,
                activeCriteria.criteria_id || activeCriteria.id
              )

              return (
                <div key={alt.alternative_id || alt.id}>
                  {alt.alternative_name}: {(w[i] * 100).toFixed(2)}%
                </div>
              )
            })}
          </div>

        </div>
      )}

      {/* BUTTON */}
      <div className="flex justify-between pt-4">

        <Button onClick={() => navigate(`/values/${caseId}`)}>
          ← Kembali
        </Button>

        <Button onClick={handleSave} loading={saving}>
          Simpan & Hitung →
        </Button>

      </div>

    </div>
  )
}
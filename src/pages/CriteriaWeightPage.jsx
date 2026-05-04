import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getCriteria,
  saveCriteriaComparisons,
  calculateAHP
} from '../services/api'

import Button from '../components/Button'
import StepNav from '../components/StepNav'

// Skala Saaty
const SCALE_VALUES = [1/9, 1/7, 1/5, 1/3, 1, 3, 5, 7, 9]

// ==============================
// HELPER
// ==============================
const getPairs = (criteria) => {
  const pairs = []
  for (let i = 0; i < criteria.length; i++) {
    for (let j = i + 1; j < criteria.length; j++) {
      pairs.push([criteria[i], criteria[j]])
    }
  }
  return pairs
}

const calcWeights = (criteria, sliders) => {
  const n = criteria.length
  if (n === 0) return []

  const mat = Array.from({ length: n }, () => Array(n).fill(1))

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const id1 = criteria[i].criteria_id || criteria[i].id
      const id2 = criteria[j].criteria_id || criteria[j].id

      const key = `${id1}_${id2}`
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

// ==============================
// COMPONENT
// ==============================
export default function CriteriaWeightPage() {
  const { caseId } = useParams()
  const navigate = useNavigate()

  const [criteria, setCriteria] = useState([])
  const [sliders, setSliders] = useState({})
  const [saving, setSaving] = useState(false)
  const [weights, setWeights] = useState([])

  // ==============================
  // FETCH CRITERIA
  // ==============================
  useEffect(() => {
    fetchCriteria()
  }, [caseId])

  const fetchCriteria = async () => {
    try {
      const res = await getCriteria(caseId)
      const data = res.data.data || res.data

      setCriteria(data)
    } catch (err) {
      console.error("GET CRITERIA ERROR:", err)
    }
  }

  const pairs = useMemo(() => getPairs(criteria), [criteria])

  const getVal = (id1, id2) =>
    sliders[`${id1}_${id2}`] ?? 1

  const handleChange = (id1, id2, val) => {
    setSliders(prev => ({
      ...prev,
      [`${id1}_${id2}`]: val
    }))
  }

  // ==============================
  // HITUNG WEIGHT
  // ==============================
  useEffect(() => {
    setWeights(calcWeights(criteria, sliders))
  }, [criteria, sliders])

  // ==============================
  // SAVE + HITUNG AHP
  // ==============================
  const handleSave = async () => {
    setSaving(true)

    try {
      const comparisons = pairs.map(([a, b]) => {
        const id1 = a.criteria_id || a.id
        const id2 = b.criteria_id || b.id

        return {
          case_id: Number(caseId),
          criteria_1: id1,
          criteria_2: id2,
          comparison_value: getVal(id1, id2)
        }
      })

      // simpan pairwise
      await saveCriteriaComparisons({
        case_id: Number(caseId),
        comparisons
      })

      // hitung AHP di backend
      await calculateAHP(caseId)

      navigate(`/alternatives/${caseId}`)

    } catch (err) {
      console.error("SAVE AHP ERROR:", err)
    } finally {
      setSaving(false)
    }
  }

  // ==============================
  // UI
  // ==============================
  return (
    <div className="p-8 space-y-6 max-w-3xl mx-auto">

      <StepNav caseId={caseId} currentStep={2} />

      <h1 className="text-xl font-bold">
        Perbandingan Kriteria (AHP)
      </h1>

      {criteria.length < 2 ? (
        <div>
          Minimal 2 kriteria diperlukan
        </div>
      ) : (
        <div className="space-y-4">
          {pairs.map(([a, b]) => {
            const id1 = a.criteria_id || a.id
            const id2 = b.criteria_id || b.id

            return (
              <div key={`${id1}_${id2}`} className="border p-4 rounded">
                <p className="mb-2 text-sm">
                  {a.criteria_name} vs {b.criteria_name}
                </p>

                <input
                  type="range"
                  min={0}
                  max={8}
                  value={SCALE_VALUES.indexOf(getVal(id1, id2))}
                  onChange={(e) =>
                    handleChange(id1, id2, SCALE_VALUES[e.target.value])
                  }
                  className="w-full"
                />
              </div>
            )
          })}
        </div>
      )}

      {/* Preview weight */}
      {weights.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Bobot:</h3>
          {criteria.map((c, i) => (
            <div key={c.criteria_id || c.id}>
              {c.criteria_name}: {(weights[i] * 100).toFixed(2)}%
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button onClick={() => navigate(`/criteria/${caseId}`)}>
          ← Kembali
        </Button>

        <Button onClick={handleSave} loading={saving}>
          Simpan & Lanjut →
        </Button>
      </div>

    </div>
  )
}
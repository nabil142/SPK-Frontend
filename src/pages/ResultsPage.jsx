import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getResults,
  calculateSAW,
  calculateSMART,
  calculateWP,
  calculateTOPSIS,
  calculateAHPRanking
} from '../services/api'

import Button from '../components/Button'

const METHODS = ['AHP', 'SAW', 'TOPSIS', 'WP', 'SMART']

export default function ResultsPage() {
  const { caseId } = useParams()
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeMethod, setActiveMethod] = useState('SAW')

  // =========================
  // FETCH RESULTS
  // =========================
  const fetchResults = async (method = activeMethod) => {
    setLoading(true)
    try {
      const res = await getResults(caseId, method)
      setData(res.data.data || res.data)
    } catch (err) {
      console.error("GET RESULTS ERROR:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResults(activeMethod)
  }, [caseId, activeMethod])

  // =========================
  // CALCULATE PER METHOD
  // =========================
  const handleCalculate = async (method) => {
    try {
      if (method === 'SAW') await calculateSAW(caseId)
      if (method === 'SMART') await calculateSMART(caseId)
      if (method === 'WP') await calculateWP(caseId)
      if (method === 'TOPSIS') await calculateTOPSIS(caseId)
      if (method === 'AHP') await calculateAHPRanking(caseId)

      fetchResults(method)

    } catch (err) {
      console.error("CALC ERROR:", err)
    }
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="p-8 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Hasil SPK</h1>

        <Button onClick={() => navigate('/dashboard')}>
          ← Dashboard
        </Button>
      </div>

      {/* METHOD BUTTON */}
      <div className="flex gap-2 flex-wrap">
        {METHODS.map((m) => (
          <button
            key={m}
            onClick={() => setActiveMethod(m)}
            className={`px-4 py-2 rounded ${
              activeMethod === m ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* CALCULATE BUTTON */}
      <div>
        <Button onClick={() => handleCalculate(activeMethod)}>
          Hitung {activeMethod}
        </Button>
      </div>

      {/* TABLE */}
      {loading ? (
        <p>Loading...</p>
      ) : data ? (
        <div className="border rounded p-4">

          <h3 className="font-semibold mb-4">
            Ranking ({activeMethod})
          </h3>

          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Alternatif</th>
                <th>Skor</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{row.alternative_name}</td>
                  <td>{Number(row.score).toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>
      ) : (
        <p>Belum ada hasil</p>
      )}

    </div>
  )
}
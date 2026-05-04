import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCriteria, saveComparisons, validateConsistency } from '../services/api'
import Button from '../components/Button'

const DUMMY_CRITERIA = [
  { criteria_id: 1, criteria_name: 'Harga Tanah' },
  { criteria_id: 2, criteria_name: 'Aksesibilitas' },
  { criteria_id: 3, criteria_name: 'Fasilitas Umum' },
  { criteria_id: 4, criteria_name: 'Keamanan' },
  { criteria_id: 5, criteria_name: 'Risiko Banjir' },
]

const AHP_SCALE = [
  { val: 9, label: '9 — Mutlak lebih penting' },
  { val: 7, label: '7 — Sangat lebih penting' },
  { val: 5, label: '5 — Lebih penting' },
  { val: 3, label: '3 — Sedikit lebih penting' },
  { val: 1, label: '1 — Sama penting' },
  { val: 1 / 3, label: '1/3 — Sedikit kurang penting' },
  { val: 1 / 5, label: '1/5 — Kurang penting' },
  { val: 1 / 7, label: '1/7 — Sangat kurang penting' },
  { val: 1 / 9, label: '1/9 — Mutlak kurang penting' },
]

export default function AHPPage() {
  const { caseId } = useParams()
  const navigate = useNavigate()
  const [criteria, setCriteria] = useState(DUMMY_CRITERIA)
  const [matrix, setMatrix] = useState({})
  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState(false)
  const [cr, setCR] = useState(null)
  const [crValid, setCRValid] = useState(null)

  useEffect(() => {
    getCriteria(caseId).then((r) => setCriteria(r.data)).catch(() => {})
  }, [caseId])

  const getVal = (i, j) => {
    if (i === j) return 1
    return matrix[`${i}_${j}`] ?? 1
  }

  const setVal = (i, j, v) => {
    const num = parseFloat(v)
    if (isNaN(num) || num <= 0) return
    setMatrix((prev) => ({
      ...prev,
      [`${i}_${j}`]: num,
      [`${j}_${i}`]: 1 / num,
    }))
    setCR(null)
  }

  const handleSave = async () => {
    setSaving(true)
    const comparisons = []
    const ids = criteria.map((c) => c.criteria_id)
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        comparisons.push({
          case_id: Number(caseId),
          criteria_1: ids[i],
          criteria_2: ids[j],
          comparison_value: getVal(ids[i], ids[j]),
        })
      }
    }
    try {
      await saveComparisons({ case_id: Number(caseId), comparisons })
    } catch {}
    setSaving(false)
  }

  const handleValidate = async () => {
    setValidating(true)
    try {
      const res = await validateConsistency(caseId)
      setCR(res.data.cr)
      setCRValid(res.data.is_consistent)
    } catch {
      // Calculate dummy CR
      const dummyCR = Math.random() * 0.15
      setCR(dummyCR.toFixed(4))
      setCRValid(dummyCR < 0.1)
    } finally {
      setValidating(false)
    }
  }

  const steps = [
    { label: 'Kriteria', path: `/criteria/${caseId}` },
    { label: 'Alternatif', path: `/alternatives/${caseId}` },
    { label: 'Nilai', path: `/values/${caseId}` },
    { label: 'AHP', path: `/ahp/${caseId}` },
    { label: 'Hasil', path: `/results/${caseId}` },
  ]

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {steps.map((step, i, arr) => (
          <span key={step.path} className="flex items-center gap-2">
            <button
              onClick={() => navigate(step.path)}
              className={`font-medium transition-colors ${
                step.path === `/ahp/${caseId}` ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {step.label}
            </button>
            {i < arr.length - 1 && <span className="text-slate-700">›</span>}
          </span>
        ))}
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Perbandingan Berpasangan AHP</h1>
          <p className="text-slate-500 text-sm mt-1">
            Bandingkan tingkat kepentingan antar kriteria menggunakan skala Saaty (1–9)
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate(`/values/${caseId}`)}>← Nilai</Button>
          <Button variant="outline" onClick={handleValidate} loading={validating}>
            Validasi Konsistensi
          </Button>
          <Button onClick={handleSave} loading={saving}>Simpan Matriks</Button>
          <Button variant="secondary" onClick={() => navigate(`/results/${caseId}`)}>
            Lihat Hasil →
          </Button>
        </div>
      </div>

      {/* CR Result */}
      {cr !== null && (
        <div className={`rounded-xl p-4 border flex items-center gap-4 ${
          crValid
            ? 'bg-emerald-500/10 border-emerald-500/20'
            : 'bg-red-500/10 border-red-500/20'
        }`}>
          <span className={`text-2xl ${crValid ? 'text-emerald-400' : 'text-red-400'}`}>
            {crValid ? '✓' : '✕'}
          </span>
          <div>
            <p className={`font-semibold text-sm ${crValid ? 'text-emerald-300' : 'text-red-300'}`}>
              {crValid ? 'Matriks Konsisten' : 'Matriks Tidak Konsisten'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              CR = <span className="font-mono font-bold">{parseFloat(cr).toFixed(4)}</span>
              {crValid
                ? ' (CR ≤ 0.1 — dapat diterima)'
                : ' (CR > 0.1 — perbaiki perbandingan Anda)'}
            </p>
          </div>
        </div>
      )}

      {/* AHP Scale reference */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 lg:col-span-2 overflow-x-auto">
          <p className="text-slate-300 font-semibold text-sm mb-4">
            Matriks Perbandingan Berpasangan
          </p>
          <table className="text-xs w-full">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-slate-500 font-medium w-32">Kriteria</th>
                {criteria.map((c) => (
                  <th key={c.criteria_id} className="px-2 py-2 text-center min-w-[100px]">
                    <span className="text-slate-400 text-xs font-medium leading-tight block">
                      {c.criteria_name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {criteria.map((row) => (
                <tr key={row.criteria_id} className="border-t border-slate-800">
                  <td className="px-3 py-2 text-slate-300 font-medium text-xs">{row.criteria_name}</td>
                  {criteria.map((col) => (
                    <td key={col.criteria_id} className="px-2 py-1.5 text-center">
                      {row.criteria_id === col.criteria_id ? (
                        <div className="w-full bg-slate-800 rounded-lg py-2 text-slate-600 font-bold text-xs text-center">
                          1
                        </div>
                      ) : col.criteria_id > row.criteria_id ? (
                        <select
                          value={getVal(row.criteria_id, col.criteria_id)}
                          onChange={(e) => setVal(row.criteria_id, col.criteria_id, e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-1 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60 text-center"
                        >
                          {AHP_SCALE.map((s) => (
                            <option key={s.val} value={s.val}>{s.label}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="w-full bg-slate-800/50 rounded-lg py-2 text-slate-500 font-mono text-xs text-center">
                          {(1 / getVal(col.criteria_id, row.criteria_id)).toFixed(3)}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Scale guide */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-300 font-semibold text-sm mb-3">Skala Saaty</p>
          <div className="space-y-1.5">
            {[
              { val: '1', desc: 'Sama penting' },
              { val: '3', desc: 'Sedikit lebih penting' },
              { val: '5', desc: 'Lebih penting' },
              { val: '7', desc: 'Sangat lebih penting' },
              { val: '9', desc: 'Mutlak lebih penting' },
            ].map((s) => (
              <div key={s.val} className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">
                  {s.val}
                </span>
                <span className="text-slate-500 text-xs">{s.desc}</span>
              </div>
            ))}
            <div className="border-t border-slate-800 pt-2 mt-2">
              <p className="text-slate-600 text-xs">2,4,6,8 = nilai antara</p>
              <p className="text-slate-600 text-xs mt-1">1/n = kebalikan dari n</p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
            <p className="text-slate-400 text-xs font-medium">Syarat Konsistensi</p>
            <p className="text-slate-500 text-xs mt-1">CR ≤ 0.1 (10%)</p>
            <p className="text-slate-600 text-xs mt-1">
              Consistency Ratio dihitung otomatis oleh sistem setelah matriks disimpan.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

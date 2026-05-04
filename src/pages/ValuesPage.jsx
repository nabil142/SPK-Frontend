import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCriteria, getAlternatives, getValues, saveValues } from '../services/api'
import Button from '../components/Button'

const DUMMY_CRITERIA = [
  { criteria_id: 1, criteria_name: 'Harga Tanah', criteria_type: 'cost' },
  { criteria_id: 2, criteria_name: 'Aksesibilitas', criteria_type: 'benefit' },
  { criteria_id: 3, criteria_name: 'Fasilitas Umum', criteria_type: 'benefit' },
  { criteria_id: 4, criteria_name: 'Keamanan', criteria_type: 'benefit' },
  { criteria_id: 5, criteria_name: 'Risiko Banjir', criteria_type: 'cost' },
]
const DUMMY_ALTS = [
  { alternative_id: 1, alternative_name: 'Lokasi A' },
  { alternative_id: 2, alternative_name: 'Lokasi B' },
  { alternative_id: 3, alternative_name: 'Lokasi C' },
  { alternative_id: 4, alternative_name: 'Lokasi D' },
  { alternative_id: 5, alternative_name: 'Lokasi E' },
]

export default function ValuesPage() {
  const { caseId } = useParams()
  const navigate = useNavigate()
  const [criteria, setCriteria] = useState(DUMMY_CRITERIA)
  const [alts, setAlts] = useState(DUMMY_ALTS)
  const [values, setValues] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    Promise.all([
      getCriteria(caseId).then((r) => setCriteria(r.data)).catch(() => {}),
      getAlternatives(caseId).then((r) => setAlts(r.data)).catch(() => {}),
      getValues(caseId).then((r) => {
        const map = {}
        r.data.forEach((v) => { map[`${v.alternative_id}_${v.criteria_id}`] = v.value })
        setValues(map)
      }).catch(() => {}),
    ])
  }, [caseId])

  const handleChange = (altId, critId, val) => {
    setValues((prev) => ({ ...prev, [`${altId}_${critId}`]: val }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const payload = []
    alts.forEach((a) => {
      criteria.forEach((c) => {
        const key = `${a.alternative_id}_${c.criteria_id}`
        const val = parseFloat(values[key])
        if (!isNaN(val)) {
          payload.push({
            case_id: Number(caseId),
            alternative_id: a.alternative_id,
            criteria_id: c.criteria_id,
            value: val,
          })
        }
      })
    })
    try {
      await saveValues(payload)
      setSaved(true)
    } catch { setSaved(true) }
    finally { setSaving(false) }
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
                step.path === `/values/${caseId}` ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
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
          <h1 className="text-2xl font-bold text-white">Input Nilai Alternatif</h1>
          <p className="text-slate-500 text-sm mt-1">Isi nilai setiap alternatif terhadap masing-masing kriteria</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate(`/alternatives/${caseId}`)}>← Alternatif</Button>
          <Button onClick={handleSave} loading={saving}>
            {saved ? '✓ Tersimpan' : 'Simpan Nilai'}
          </Button>
          <Button variant="secondary" onClick={() => navigate(`/ahp/${caseId}`)}>Lanjut ke AHP →</Button>
        </div>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3">
        <span className="text-amber-400 shrink-0">⚠</span>
        <p className="text-amber-300/80 text-xs leading-relaxed">
          Masukkan nilai numerik. Untuk kriteria <b>Cost</b> (↓), nilai lebih rendah = lebih baik. Untuk <b>Benefit</b> (↑), nilai lebih tinggi = lebih baik. Skala bebas (misalnya 1–100 atau nilai aktual seperti harga dalam juta rupiah).
        </p>
      </div>

      {/* Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <p className="text-slate-300 font-semibold text-sm">Matriks Nilai (Alternatif × Kriteria)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[160px]">
                  Alternatif
                </th>
                {criteria.map((c) => (
                  <th key={c.criteria_id} className="px-3 py-3 text-center min-w-[130px]">
                    <p className="text-xs font-semibold text-slate-300">{c.criteria_name}</p>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                      c.criteria_type === 'benefit'
                        ? 'text-emerald-400 bg-emerald-500/10'
                        : 'text-red-400 bg-red-500/10'
                    }`}>
                      {c.criteria_type === 'benefit' ? '↑ Benefit' : '↓ Cost'}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alts.map((a, ri) => (
                <tr key={a.alternative_id} className={`border-b border-slate-800/60 ${ri % 2 === 0 ? '' : 'bg-slate-800/20'}`}>
                  <td className="px-4 py-3">
                    <span className="text-slate-300 font-medium text-sm">{a.alternative_name}</span>
                  </td>
                  {criteria.map((c) => (
                    <td key={c.criteria_id} className="px-3 py-2 text-center">
                      <input
                        type="number"
                        value={values[`${a.alternative_id}_${c.criteria_id}`] ?? ''}
                        onChange={(e) => handleChange(a.alternative_id, c.criteria_id, e.target.value)}
                        placeholder="0"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-sm text-slate-200 text-center focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

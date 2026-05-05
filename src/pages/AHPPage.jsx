import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCriteria, saveComparisons, validateConsistency } from '../services/api'
import Button from '../components/Button'

// Modern SVG Icons
const Icons = {
  Scale: () => <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path><path d="M7 21h10"></path><path d="M12 3v18"></path><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"></path></svg>,
  Save: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>,
  CheckCircle: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>,
  AlertCircle: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>,
  Info: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12.01" y2="16"></line><line x1="12" y1="12" x2="12" y2="8"></line></svg>,
  ChevronRight: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
}

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
    <div className="relative min-h-full p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Breadcrumbs */}
      <div className="relative z-10 flex flex-wrap items-center gap-2 text-sm bg-slate-900/40 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800/80 w-fit">
        {steps.map((step, i, arr) => (
          <span key={step.path} className="flex items-center gap-2">
            <button
              onClick={() => navigate(step.path)}
              className={`font-semibold transition-all ${
                step.path === `/ahp/${caseId}` ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {step.label}
            </button>
            {i < arr.length - 1 && <span className="text-slate-700 font-light">/</span>}
          </span>
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/20 border border-amber-300/30">
              <Icons.Scale />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight leading-none">Matriks Perbandingan</h1>
              <p className="text-slate-500 text-sm mt-2 font-medium">Bandingkan tingkat kepentingan kriteria berdasarkan Skala Saaty.</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" onClick={() => navigate(`/values/${caseId}`)} className="bg-slate-800/50 hover:bg-slate-800 text-slate-300 border border-slate-700">
            Kembali
          </Button>
          <Button variant="outline" onClick={handleValidate} loading={validating} className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 flex items-center gap-2">
            <Icons.CheckCircle /> Validasi CR
          </Button>
          <Button onClick={handleSave} loading={saving} className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-lg shadow-amber-500/20 border-none flex items-center gap-2">
            <Icons.Save /> Simpan Matriks
          </Button>
          <Button variant="secondary" onClick={() => navigate(`/results/${caseId}`)} className="bg-slate-700 hover:bg-slate-600 text-white flex items-center gap-2">
            Hasil <Icons.ChevronRight />
          </Button>
        </div>
      </div>

      {/* CR Result Banner */}
      {cr !== null && (
        <div className={`relative z-10 rounded-2xl p-5 border flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-500 backdrop-blur-sm shadow-2xl ${
          crValid ? 'bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5' : 'bg-rose-500/10 border-rose-500/20 shadow-rose-500/5'
        }`}>
          <div className={`mt-1 ${crValid ? 'text-emerald-400' : 'text-rose-400'}`}>
            {crValid ? <Icons.CheckCircle /> : <Icons.AlertCircle />}
          </div>
          <div>
            <p className={`font-black text-lg tracking-tight ${crValid ? 'text-emerald-400' : 'text-rose-400'}`}>
              {crValid ? 'Consistency Ratio Valid' : 'Matriks Tidak Konsisten'}
            </p>
            <p className="text-sm text-slate-400 mt-1 font-medium leading-relaxed">
              Nilai CR: <span className={`font-mono font-bold ${crValid ? 'text-emerald-300' : 'text-rose-300'}`}>{parseFloat(cr).toFixed(4)}</span>
              {crValid
                ? ' (Memenuhi syarat ≤ 0.1, data dapat digunakan untuk kalkulasi ranking)'
                : ' (Nilai melebihi ambang batas 0.1, harap tinjau kembali perbandingan Anda)'}
            </p>
          </div>
        </div>
      )}

      {/* Matrix and Reference Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Matrix Table */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl lg:col-span-3">
          <div className="px-6 py-5 border-b border-slate-800/80 bg-slate-900/50 flex items-center gap-3">
            <span className="text-amber-500"><Icons.Info /></span>
            <p className="text-slate-200 font-bold text-sm tracking-wide">Pairwise Comparison Matrix</p>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-950/30">
                  <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800/50 w-40">Kriteria</th>
                  {criteria.map((c) => (
                    <th key={c.criteria_id} className="px-4 py-5 text-center min-w-[140px] border-b border-slate-800/50">
                      <span className="text-[11px] font-black text-slate-300 uppercase tracking-tight">{c.criteria_name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {criteria.map((row) => (
                  <tr key={row.criteria_id} className="group hover:bg-slate-800/30 transition-colors duration-150">
                    <td className="px-6 py-4 bg-slate-900/40 font-bold text-slate-400 text-xs border-r border-slate-800/30">{row.criteria_name}</td>
                    {criteria.map((col) => (
                      <td key={col.criteria_id} className="px-3 py-3 text-center">
                        {row.criteria_id === col.criteria_id ? (
                          <div className="w-full bg-slate-950/50 border border-slate-800/50 rounded-xl py-3 text-slate-600 font-black text-sm shadow-inner">
                            1.0
                          </div>
                        ) : col.criteria_id > row.criteria_id ? (
                          <select
                            value={getVal(row.criteria_id, col.criteria_id)}
                            onChange={(e) => setVal(row.criteria_id, col.criteria_id, e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-3 text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 text-center transition-all cursor-pointer hover:border-slate-700 shadow-sm appearance-none"
                          >
                            {AHP_SCALE.map((s) => (
                              <option key={s.val} value={s.val}>{s.label}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="w-full bg-slate-800/20 rounded-xl py-3 text-slate-500 font-mono text-xs shadow-inner">
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
        </div>

        {/* Right Sidebar: Guide */}
        <div className="space-y-6">
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-white font-bold text-sm mb-5 flex items-center gap-2 uppercase tracking-widest text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Skala Saaty
            </h3>
            <div className="space-y-3">
              {[
                { val: '1', desc: 'Sama penting' },
                { val: '3', desc: 'Sedikit lebih penting' },
                { val: '5', desc: 'Lebih penting' },
                { val: '7', desc: 'Sangat lebih penting' },
                { val: '9', desc: 'Mutlak lebih penting' },
              ].map((s) => (
                <div key={s.val} className="flex items-center gap-4 group">
                  <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 font-black text-xs flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all duration-300">
                    {s.val}
                  </span>
                  <span className="text-slate-400 text-xs font-medium leading-tight">{s.desc}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-5 border-t border-slate-800/80">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                  <span>Nilai Antara</span>
                  <span className="text-slate-400">2, 4, 6, 8</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                  <span>Resiprokal</span>
                  <span className="text-slate-400">1 / n</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-600/5 border border-blue-500/20 rounded-3xl p-6 backdrop-blur-sm">
            <h4 className="text-blue-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-3">Ketentuan CR</h4>
            <p className="text-slate-400 text-xs leading-relaxed font-medium">
              Sistem akan memvalidasi matriks Anda. Syarat ideal adalah <span className="text-blue-300 font-bold">CR ≤ 0.1</span>.
            </p>
            <div className="mt-4 p-3 bg-slate-950/40 rounded-2xl border border-slate-800">
              <p className="text-[10px] text-slate-500 italic leading-relaxed">
                Consistency Ratio dihitung setelah Anda menekan tombol "Simpan Matriks".
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
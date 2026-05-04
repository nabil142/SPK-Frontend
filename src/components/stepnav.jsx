import { useNavigate } from 'react-router-dom'

// 6 steps sesuai alur baru:
// 1. Kriteria  2. Pembobotan Kriteria  3. Alternatif  4. Nilai Alternatif  5. Perbandingan Alt/AHP  6. Hasil
const STEPS = [
  { num: 1, label: 'Kriteria',       key: 'criteria' },
  { num: 2, label: 'Skala Kriteria', key: 'criteria-weight' },
  { num: 3, label: 'Alternatif',     key: 'alternatives' },
  { num: 4, label: 'Nilai Alternatif', key: 'values' },
  { num: 5, label: 'Skala Alt/AHP',  key: 'alt-comparison' },
  { num: 6, label: 'Hasil',          key: 'results' },
]

export default function StepNav({ caseId, currentStep }) {
  const navigate = useNavigate()

  return (
    <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-2">
      {STEPS.map((step, i) => {
        const isDone    = step.num < currentStep
        const isCurrent = step.num === currentStep
        const isLocked  = step.num > currentStep

        return (
          <div key={step.key} className="flex items-center shrink-0">
            {/* Step bubble */}
            <button
              onClick={() => !isLocked && navigate(`/${step.key}/${caseId}`)}
              disabled={isLocked}
              className={`flex flex-col items-center gap-1.5 group ${isLocked ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
            >
              <div className={`
                w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                ${isDone    ? 'bg-emerald-500 border-emerald-500 text-white' : ''}
                ${isCurrent ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30' : ''}
                ${isLocked  ? 'bg-slate-800 border-slate-700 text-slate-600' : ''}
                ${!isLocked && !isCurrent && !isDone ? 'hover:border-slate-500' : ''}
              `}>
                {isDone
                  ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  : step.num
                }
              </div>
              <span className={`text-xs font-medium whitespace-nowrap transition-colors
                ${isCurrent ? 'text-blue-400' : isDone ? 'text-emerald-400' : 'text-slate-600'}
              `}>
                {step.label}
              </span>
            </button>

            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-10 mx-1 mb-5 rounded transition-colors ${
                isDone ? 'bg-emerald-500/50' : 'bg-slate-800'
              }`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
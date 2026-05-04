import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCases, createCase, deleteCase } from '../services/api'
import { StatCard } from '../components/Card'
import Button from '../components/Button'
import Modal from '../components/Modal'
import { FormInput, FormTextarea } from '../components/FormInput'
import { useAuth } from '../hooks/useAuth'

const STATUS_STYLE = {
  Selesai: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  'Dalam Proses': 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  Draft: 'bg-slate-700/50 text-slate-400 border-slate-700/50',
}

// 6 steps sesuai alur baru
const STEPS = [
  { num: 1, label: 'Kriteria', path: 'criteria' },
  { num: 2, label: 'Skala Kriteria', path: 'criteria-weight' },
  { num: 3, label: 'Alternatif', path: 'alternatives' },
  { num: 4, label: 'Nilai', path: 'values' },
  { num: 5, label: 'Skala Alt/AHP', path: 'alt-comparison' },
  { num: 6, label: 'Hasil', path: 'results' },
]

function ProjectStepBar({ currentStep, caseId, navigate }) {
  return (
    <div className="flex items-center gap-0.5 mb-4">
      {STEPS.map((step) => {
        const isDone = step.num < currentStep
        const isCurrent = step.num === currentStep
        return (
          <button
            key={step.num}
            onClick={() => navigate(`/${step.path}/${caseId}`)}
            title={step.label}
            className={`flex-1 h-1.5 rounded-full transition-all hover:opacity-80 ${
              isDone ? 'bg-emerald-500' : isCurrent ? 'bg-blue-500' : 'bg-slate-700'
            }`}
          />
        )
      })}
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ case_name: '', description: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchProjects() }, [])

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const res = await getCases()
      const rawData = res.data?.data || res.data || []
      
      // Sanitasi Data: Pastikan count & step berupa Angka (Integer), bukan String dari SQL
      const formattedData = rawData.map(proj => {
        const critCount = parseInt(proj.criteria_count) || 0
        const altCount = parseInt(proj.alternatives_count) || 0
        const step = parseInt(proj.current_step) || 1
        
        // Fallback Status jika backend tidak mengirim kolom 'status'
        let autoStatus = 'Draft'
        if (step >= 6) autoStatus = 'Selesai'
        else if (step > 1 || critCount > 0 || altCount > 0) autoStatus = 'Dalam Proses'

        return {
          ...proj,
          criteria_count: critCount,
          alternatives_count: altCount,
          current_step: step,
          status: proj.status || autoStatus
        }
      })
      
      setProjects(formattedData)
    } catch (err) {
      console.error("Gagal memuat dashboard:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!form.case_name.trim()) return
    setSaving(true)
    try {
      const res = await createCase({
        case_name: form.case_name,
        description: form.description
      })
      
      const newProj = res.data?.data || res.data
      
      setProjects(prev => [{
        ...newProj,
        criteria_count: parseInt(newProj.criteria_count) || 0,
        alternatives_count: parseInt(newProj.alternatives_count) || 0,
        current_step: parseInt(newProj.current_step) || 1,
        status: newProj.status || 'Draft'
      }, ...prev])
      
    } catch (err) {
      console.error("Gagal membuat project", err)
    } finally {
      setSaving(false)
      setShowModal(false)
      setForm({ case_name: '', description: '' })
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus project ini? Semua data di dalamnya akan hilang permanen.')) return
    try { 
      await deleteCase(id) 
      setProjects(prev => prev.filter(p => p.case_id !== id))
    } catch (err) {
      console.error("Gagal menghapus", err)
    }
  }

  const handleContinue = (proj) => {
    const step = STEPS.find(s => s.num === proj.current_step) ?? STEPS[0]
    navigate(`/${step.path}/${proj.case_id}`)
  }

  const formatDate = (d) => {
    if (!d) return 'Baru saja'
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            Selamat datang, <span className="text-amber-400 font-medium">{user?.username || 'Admin'}</span> — kelola project SPK Anda
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>+ Project Baru</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Project" value={projects.length} accent />
        <StatCard label="Selesai" value={projects.filter(p => p.status === 'Selesai').length} />
        <StatCard label="Dalam Proses" value={projects.filter(p => p.status === 'Dalam Proses').length} />
        <StatCard label="Draft" value={projects.filter(p => p.status === 'Draft').length} />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Alur Kerja SPK</p>
        <div className="flex flex-wrap items-center gap-2">
          {STEPS.map((step, i) => (
            <div key={step.num} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-800 rounded-lg px-3 py-1.5">
                <span className="w-4 h-4 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-400 text-[10px] font-bold flex items-center justify-center">{step.num}</span>
                <span className="text-slate-400 text-xs font-medium">{step.label}</span>
              </div>
              {i < STEPS.length - 1 && <span className="text-slate-700 text-sm">→</span>}
            </div>
          ))}
        </div>
        <p className="text-slate-600 text-xs mt-2.5">
          Step 2 (Skala Kriteria) dipakai semua metode. Step 5 (Skala Alt/AHP) hanya untuk AHP.
        </p>
      </div>

      <div>
        <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-4">Semua Project</h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3 border border-slate-800 border-dashed rounded-2xl">
            <svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <p>Memuat project...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 border border-slate-800 border-dashed rounded-2xl">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📂</span>
            </div>
            <p className="text-slate-400 font-medium">Belum ada project</p>
            <p className="text-slate-600 text-sm mt-1">Buat project baru untuk memulai analisis SPK</p>
            <Button onClick={() => setShowModal(true)} className="mt-4">Buat Project Pertama</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {projects.map((proj) => (
              <div key={proj.case_id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all group flex flex-col shadow-lg shadow-black/20">
                
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLE[proj.status] ?? STATUS_STYLE.Draft}`}>
                    {proj.status}
                  </span>
                  <button onClick={() => handleDelete(proj.case_id)} className="text-slate-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-sm leading-none" title="Hapus project">✕</button>
                </div>

                <h3 className="text-slate-100 font-semibold text-base leading-snug mb-2 line-clamp-2">
                  {proj.case_name}
                </h3>
                <p className="text-slate-500 text-sm line-clamp-2 mb-4 leading-relaxed flex-1">
                  {proj.description || 'Tidak ada deskripsi'}
                </p>

                <div className="mb-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-slate-600 text-xs">Progress: Step {proj.current_step} dari {STEPS.length}</span>
                    <span className="text-blue-400 font-medium text-xs">{STEPS.find(s => s.num === proj.current_step)?.label}</span>
                  </div>
                  <ProjectStepBar currentStep={proj.current_step} caseId={proj.case_id} navigate={navigate} />
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-600 mb-4 py-3 border-y border-slate-800">
                  <span className="flex items-center gap-1"><span className="text-emerald-500/70">📋</span> {proj.criteria_count} Kriteria</span>
                  <span className="flex items-center gap-1"><span className="text-blue-500/70">📍</span> {proj.alternatives_count} Alternatif</span>
                  <span className="flex items-center gap-1"><span className="text-amber-500/70">🗓</span> {formatDate(proj.created_at)}</span>
                </div>

                <div className="space-y-2">
                  <Button variant="primary" size="sm" onClick={() => handleContinue(proj)} className="w-full">
                    {proj.current_step >= 6 ? '🏆 Lihat Hasil' : `▶ Lanjutkan — ${STEPS.find(s => s.num === proj.current_step)?.label}`}
                  </Button>

                  <div className="grid grid-cols-3 gap-1.5">
                    {STEPS.map(step => (
                      <button
                        key={step.num}
                        onClick={() => navigate(`/${step.path}/${proj.case_id}`)}
                        className={`text-[10px] font-medium px-1.5 py-1.5 rounded-lg border transition-colors text-center leading-tight ${
                          step.num === proj.current_step
                          ? 'bg-blue-600/15 border-blue-500/30 text-blue-400'
                          : step.num < proj.current_step
                            ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-500/70 hover:text-emerald-400'
                            : 'bg-slate-800/50 border-slate-700/50 text-slate-600 hover:text-slate-400'
                        }`}
                      >
                        {step.num}. {step.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Buat Project Baru">
        <div className="space-y-4">
          <FormInput label="Nama Project" placeholder="Contoh: Pemilihan Lokasi Kantor Jakarta" value={form.case_name} onChange={(e) => setForm({ ...form, case_name: e.target.value })} />
          <FormTextarea label="Deskripsi (opsional)" placeholder="Jelaskan tujuan dan konteks analisis ini..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

          <div className="bg-slate-800/60 rounded-xl p-3">
            <p className="text-slate-500 text-xs mb-2">Project baru akan mengikuti alur:</p>
            <div className="flex items-center gap-1 flex-wrap">
              {STEPS.map((step, i) => (
                <span key={step.num} className="flex items-center gap-1 text-xs text-slate-600">
                  <span className="text-slate-500">{step.label}</span>
                  {i < STEPS.length - 1 && <span className="text-slate-700">→</span>}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)} className="flex-1">Batal</Button>
            <Button onClick={handleCreate} loading={saving} className="flex-1">Buat Project</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
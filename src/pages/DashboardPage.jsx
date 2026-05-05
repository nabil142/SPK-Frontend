import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCases, createCase, deleteCase } from '../services/api'
import { StatCard } from '../components/Card'
import Button from '../components/Button'
import Modal from '../components/Modal'
import { FormInput, FormTextarea } from '../components/FormInput'
import { useAuth } from '../hooks/useAuth'

// Icon Components (Inline SVG agar tidak perlu install library tambahan)
const Icons = {
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
  Criteria: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
  Alternative: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
  Calendar: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
  Trophy: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>,
  ArrowRight: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>,
  FolderEmpty: () => <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>
}

const STATUS_STYLE = {
  Selesai: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]',
  'Dalam Proses': 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]',
  Draft: 'bg-slate-800/50 text-slate-400 border-slate-700/50',
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
    <div className="flex items-center gap-1 mb-5">
      {STEPS.map((step) => {
        const isDone = step.num < currentStep
        const isCurrent = step.num === currentStep
        return (
          <button
            key={step.num}
            onClick={() => navigate(`/${step.path}/${caseId}`)}
            title={step.label}
            className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
              isDone ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]' 
              : isCurrent ? 'bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]' 
              : 'bg-slate-800 hover:bg-slate-700'
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
      
      const formattedData = rawData.map(proj => {
        const critCount = parseInt(proj.criteria_count) || 0
        const altCount = parseInt(proj.alternatives_count) || 0
        const step = parseInt(proj.current_step) || 1
        
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
    if (!window.confirm('Hapus project ini? Semua data di dalamnya akan hilang permanen.')) return
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
    <div className="min-h-screen bg-[#0B0F19] text-slate-200 p-6 md:p-10 relative">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Dashboard</h1>
            <p className="text-slate-400 text-sm md:text-base mt-2">
              Selamat datang kembali, <span className="text-amber-400 font-semibold">{user?.username || 'Admin'}</span>. Kelola analisis SPK Anda.
            </p>
          </div>
          <Button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/20 px-6 py-2.5">
            <Icons.Plus /> Project Baru
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatCard label="Total Project" value={projects.length} accent className="bg-slate-900/60 backdrop-blur border-slate-800" />
          <StatCard label="Selesai" value={projects.filter(p => p.status === 'Selesai').length} className="bg-slate-900/60 backdrop-blur border-slate-800" />
          <StatCard label="Dalam Proses" value={projects.filter(p => p.status === 'Dalam Proses').length} className="bg-slate-900/60 backdrop-blur border-slate-800" />
          <StatCard label="Draft" value={projects.filter(p => p.status === 'Draft').length} className="bg-slate-900/60 backdrop-blur border-slate-800" />
        </div>

        {/* Workflow Info Panel (Glassmorphism) */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Alur Kerja SPK</p>
          <div className="flex flex-wrap items-center gap-3">
            {STEPS.map((step, i) => (
              <div key={step.num} className="flex items-center gap-3">
                <div className="flex items-center gap-2.5 bg-slate-950/50 border border-slate-800/60 rounded-xl px-3 py-2 shadow-sm">
                  <span className="w-5 h-5 rounded-md bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[11px] font-bold flex items-center justify-center">
                    {step.num}
                  </span>
                  <span className="text-slate-300 text-sm font-medium">{step.label}</span>
                </div>
                {i < STEPS.length - 1 && <Icons.ArrowRight className="text-slate-700 w-4 h-4" />}
              </div>
            ))}
          </div>
          <p className="text-slate-500 text-xs mt-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Step 2 (Skala Kriteria) dipakai semua metode. Step 5 (Skala Alt/AHP) eksklusif untuk AHP.
          </p>
        </div>

        {/* Projects Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-slate-300 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-sm bg-blue-500"></span> Semua Project
            </h2>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-4 bg-slate-900/20 border border-slate-800/50 rounded-3xl backdrop-blur-sm">
              <svg className="animate-spin w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <p className="font-medium tracking-wide">Memuat data project...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-24 bg-slate-900/20 border border-slate-800/80 border-dashed rounded-3xl backdrop-blur-sm">
              <div className="w-20 h-20 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl flex items-center justify-center mx-auto mb-6">
                <Icons.FolderEmpty />
              </div>
              <h3 className="text-xl text-white font-bold mb-2">Belum ada project</h3>
              <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">Mulai perjalanan analisis data Anda dengan membuat project Sistem Pendukung Keputusan pertama.</p>
              <Button onClick={() => setShowModal(true)} className="flex items-center gap-2 mx-auto">
                <Icons.Plus /> Buat Project Pertama
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {projects.map((proj) => (
                <div key={proj.case_id} className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-6 hover:border-slate-600 hover:-translate-y-1 transition-all duration-300 group flex flex-col shadow-xl shadow-black/10">
                  
                  <div className="flex items-start justify-between mb-4">
                    <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg border backdrop-blur-md ${STATUS_STYLE[proj.status] ?? STATUS_STYLE.Draft}`}>
                      {proj.status}
                    </span>
                    <button 
                      onClick={() => handleDelete(proj.case_id)} 
                      className="w-8 h-8 rounded-lg bg-slate-800/50 hover:bg-red-500/20 text-slate-500 hover:text-red-400 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100" 
                      title="Hapus project"
                    >
                      <Icons.Trash />
                    </button>
                  </div>

                  <h3 className="text-white font-bold text-lg leading-snug mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                    {proj.case_name}
                  </h3>
                  <p className="text-slate-400 text-sm line-clamp-2 mb-6 leading-relaxed flex-1 font-light">
                    {proj.description || 'Tidak ada deskripsi spesifik untuk project ini.'}
                  </p>

                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-slate-500 text-xs font-medium">Progress • <span className="text-slate-300">Step {proj.current_step} / {STEPS.length}</span></span>
                      <span className="text-blue-400 font-bold text-xs">{STEPS.find(s => s.num === proj.current_step)?.label}</span>
                    </div>
                    <ProjectStepBar currentStep={proj.current_step} caseId={proj.case_id} navigate={navigate} />
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400 mb-6 py-4 border-y border-slate-800/60 font-medium">
                    <span className="flex items-center gap-1.5"><span className="text-emerald-400"><Icons.Criteria /></span> {proj.criteria_count} Kriteria</span>
                    <span className="flex items-center gap-1.5"><span className="text-blue-400"><Icons.Alternative /></span> {proj.alternatives_count} Alternatif</span>
                    <span className="flex items-center gap-1.5"><span className="text-amber-400"><Icons.Calendar /></span> {formatDate(proj.created_at)}</span>
                  </div>

                  <div className="space-y-3">
                    <button 
                      onClick={() => handleContinue(proj)} 
                      className={`w-full font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 ${
                        proj.current_step >= 6 
                        ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                      }`}
                    >
                      {proj.current_step >= 6 ? <><Icons.Trophy /> Lihat Hasil</> : <><Icons.ArrowRight /> Lanjutkan Analisis</>}
                    </button>

                    {/* Step Navigator Matrix */}
                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      {STEPS.map(step => (
                        <button
                          key={step.num}
                          onClick={() => navigate(`/${step.path}/${proj.case_id}`)}
                          className={`text-[10px] font-bold px-2 py-2 rounded-lg border transition-all text-center tracking-wide ${
                            step.num === proj.current_step
                            ? 'bg-blue-500/20 border-blue-500/40 text-blue-400 shadow-inner'
                            : step.num < proj.current_step
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20'
                              : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
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

        {/* Create Modal */}
        <Modal open={showModal} onClose={() => setShowModal(false)} title="Inisiasi Project Baru">
          <div className="space-y-5 p-1">
            <FormInput label="Nama Project" placeholder="Contoh: Pemilihan Lokasi Kantor Jakarta" value={form.case_name} onChange={(e) => setForm({ ...form, case_name: e.target.value })} />
            <FormTextarea label="Deskripsi (opsional)" placeholder="Jelaskan tujuan, konteks, atau sasaran dari analisis ini..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">Roadmap Analisis:</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {STEPS.map((step, i) => (
                  <span key={step.num} className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300">
                    <span className="bg-slate-800 px-2 py-1 rounded-md">{step.label}</span>
                    {i < STEPS.length - 1 && <Icons.ArrowRight className="w-3 h-3 text-slate-600" />}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-800">
              <Button variant="ghost" onClick={() => setShowModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700">Batal</Button>
              <Button onClick={handleCreate} loading={saving} className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/20">
                Buat Project
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getAlternatives, createAlternative, updateAlternative, deleteAlternative } from '../services/api'
import Button from '../components/Button'
import Table from '../components/Table'
import Modal from '../components/Modal'
import { FormInput, FormTextarea } from '../components/FormInput'

const DUMMY_ALTS = [
  { alternative_id: 1, alternative_name: 'Lokasi A — Jl. Soekarno-Hatta No.10', description: 'Dekat pusat kota, akses mudah' },
  { alternative_id: 2, alternative_name: 'Lokasi B — Jl. Veteran No.45', description: 'Kawasan bisnis, fasilitas lengkap' },
  { alternative_id: 3, alternative_name: 'Lokasi C — Jl. Diponegoro No.88', description: 'Harga terjangkau, lingkungan tenang' },
  { alternative_id: 4, alternative_name: 'Lokasi D — Jl. Ahmad Yani No.22', description: 'Strategis, dekat stasiun' },
  { alternative_id: 5, alternative_name: 'Lokasi E — Jl. Basuki Rahmat No.5', description: 'Premium, kawasan elite' },
]

export default function AlternativesPage() {
  const { caseId } = useParams()
  const navigate = useNavigate()
  const [alts, setAlts] = useState(DUMMY_ALTS)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ alternative_name: '', description: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAlts() }, [caseId])

  const fetchAlts = async () => {
    setLoading(true)
    try {
      const res = await getAlternatives(caseId)
      setAlts(res.data)
    } catch {} finally { setLoading(false) }
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ alternative_name: '', description: '' })
    setShowModal(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({ alternative_name: row.alternative_name, description: row.description })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.alternative_name.trim()) return
    setSaving(true)
    try {
      if (editing) {
        await updateAlternative(editing.alternative_id, { ...form, case_id: Number(caseId) })
        setAlts((prev) => prev.map((a) => a.alternative_id === editing.alternative_id ? { ...a, ...form } : a))
      } else {
        const res = await createAlternative({ ...form, case_id: Number(caseId) })
        setAlts((prev) => [...prev, res.data])
      }
    } catch {
      if (editing) {
        setAlts((prev) => prev.map((a) => a.alternative_id === editing.alternative_id ? { ...a, ...form } : a))
      } else {
        setAlts((prev) => [...prev, { alternative_id: Date.now(), ...form, case_id: Number(caseId) }])
      }
    } finally {
      setSaving(false)
      setShowModal(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus alternatif ini?')) return
    try { await deleteAlternative(id) } catch {}
    setAlts((prev) => prev.filter((a) => a.alternative_id !== id))
  }

  const columns = [
    { key: 'no', label: 'No', width: '60px' },
    { key: 'alternative_name', label: 'Nama Lokasi / Alternatif' },
    { key: 'description', label: 'Deskripsi', render: (v) => v || <span className="text-slate-600">—</span> },
    {
      key: 'actions', label: 'Aksi', width: '120px',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>Edit</Button>
          <Button variant="danger" size="sm" onClick={() => handleDelete(row.alternative_id)}>Hapus</Button>
        </div>
      ),
    },
  ]

  const tableData = alts.map((a, i) => ({ ...a, no: i + 1 }))

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
                step.path === `/alternatives/${caseId}` ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
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
          <h1 className="text-2xl font-bold text-white">Manajemen Alternatif</h1>
          <p className="text-slate-500 text-sm mt-1">Tambahkan lokasi-lokasi properti yang akan dibandingkan</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate(`/criteria-weight/${caseId}`)}>← Bobot Kriteria</Button>
          <Button onClick={openCreate}>+ Tambah Lokasi</Button>
          <Button variant="secondary" onClick={() => navigate(`/values/${caseId}`)}>Lanjut ke Nilai →</Button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <p className="text-slate-300 font-semibold text-sm">
            Daftar Alternatif Lokasi <span className="text-slate-600 font-normal">({alts.length} total)</span>
          </p>
        </div>
        <Table columns={columns} data={tableData} loading={loading} emptyText="Belum ada alternatif." />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Alternatif' : 'Tambah Alternatif Baru'}>
        <div className="space-y-4">
          <FormInput
            label="Nama Lokasi / Alternatif"
            placeholder="Contoh: Lokasi A — Jl. Soekarno-Hatta No.10"
            value={form.alternative_name}
            onChange={(e) => setForm({ ...form, alternative_name: e.target.value })}
          />
          <FormTextarea
            label="Deskripsi (opsional)"
            placeholder="Keterangan singkat tentang lokasi ini..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)} className="flex-1">Batal</Button>
            <Button onClick={handleSave} loading={saving} className="flex-1">
              {editing ? 'Simpan Perubahan' : 'Tambah Alternatif'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

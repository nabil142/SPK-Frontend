import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCriteria, createCriteria, updateCriteria, deleteCriteria } from '../services/api'
import Button from '../components/Button'
import Table from '../components/Table'
import Modal from '../components/Modal'
import { FormInput, FormSelect } from '../components/FormInput'
import Card from '../components/Card'

const DUMMY_CRITERIA = [
  { criteria_id: 1, criteria_name: 'Harga Tanah', criteria_type: 'cost', weight: null },
  { criteria_id: 2, criteria_name: 'Aksesibilitas Jalan', criteria_type: 'benefit', weight: null },
  { criteria_id: 3, criteria_name: 'Kedekatan Fasilitas Umum', criteria_type: 'benefit', weight: null },
  { criteria_id: 4, criteria_name: 'Keamanan Lingkungan', criteria_type: 'benefit', weight: null },
  { criteria_id: 5, criteria_name: 'Risiko Banjir', criteria_type: 'cost', weight: null },
]

export default function CriteriaPage() {
  const { caseId } = useParams()
  const navigate = useNavigate()
  const [criteria, setCriteria] = useState(DUMMY_CRITERIA)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ criteria_name: '', criteria_type: 'benefit' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchCriteria() }, [caseId])

  const fetchCriteria = async () => {
    setLoading(true)
    try {
      const res = await getCriteria(caseId)
      setCriteria(res.data)
    } catch { /* use dummy */ } finally { setLoading(false) }
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ criteria_name: '', criteria_type: 'benefit' })
    setShowModal(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({ criteria_name: row.criteria_name, criteria_type: row.criteria_type })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.criteria_name.trim()) return
    setSaving(true)
    try {
      if (editing) {
        await updateCriteria(editing.criteria_id, { ...form, case_id: Number(caseId) })
        setCriteria((prev) =>
          prev.map((c) => c.criteria_id === editing.criteria_id ? { ...c, ...form } : c)
        )
      } else {
        const res = await createCriteria({ ...form, case_id: Number(caseId) })
        setCriteria((prev) => [...prev, res.data])
      }
    } catch {
      if (editing) {
        setCriteria((prev) =>
          prev.map((c) => c.criteria_id === editing.criteria_id ? { ...c, ...form } : c)
        )
      } else {
        setCriteria((prev) => [
          ...prev,
          { criteria_id: Date.now(), ...form, case_id: Number(caseId), weight: null },
        ])
      }
    } finally {
      setSaving(false)
      setShowModal(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus kriteria ini?')) return
    try { await deleteCriteria(id) } catch {}
    setCriteria((prev) => prev.filter((c) => c.criteria_id !== id))
  }

  const columns = [
    { key: 'no', label: 'No', width: '60px', render: (_, __, idx) => idx + 1 },
    { key: 'criteria_name', label: 'Nama Kriteria' },
    {
      key: 'criteria_type',
      label: 'Tipe',
      render: (v) => (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
          v === 'benefit'
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : 'bg-red-500/10 text-red-400 border-red-500/20'
        }`}>
          {v === 'benefit' ? '↑ Benefit' : '↓ Cost'}
        </span>
      ),
    },
    { key: 'weight', label: 'Bobot AHP', render: (v) => v ? v.toFixed(4) : <span className="text-slate-600">— belum dihitung</span> },
    {
      key: 'actions',
      label: 'Aksi',
      width: '120px',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>Edit</Button>
          <Button variant="danger" size="sm" onClick={() => handleDelete(row.criteria_id)}>Hapus</Button>
        </div>
      ),
    },
  ]

  // Fix render for No column
  const tableData = criteria.map((c, i) => ({ ...c, no: i + 1 }))
  const fixedCols = columns.map((col) =>
    col.key === 'no' ? { ...col, render: (v) => v } : col
  )

  return (
    <div className="p-8 space-y-6">
      {/* Breadcrumb / nav */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {[
          { label: 'Kriteria', path: `/criteria/${caseId}` },
          { label: 'Alternatif', path: `/alternatives/${caseId}` },
          { label: 'Nilai', path: `/values/${caseId}` },
          { label: 'AHP', path: `/ahp/${caseId}` },
          { label: 'Hasil', path: `/results/${caseId}` },
        ].map((step, i, arr) => (
          <span key={step.path} className="flex items-center gap-2">
            <button
              onClick={() => navigate(step.path)}
              className={`font-medium transition-colors ${
                step.path === `/criteria/${caseId}`
                  ? 'text-amber-400'
                  : 'text-slate-500 hover:text-slate-300'
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
          <h1 className="text-2xl font-bold text-white">Manajemen Kriteria</h1>
          <p className="text-slate-500 text-sm mt-1">
            Tentukan kriteria penilaian beserta tipe benefit/cost untuk project ini
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={openCreate}>+ Tambah Kriteria</Button>
          <Button variant="secondary" onClick={() => navigate(`/alternatives/${caseId}`)}>
            Lanjut ke Alternatif →
          </Button>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
        <span className="text-blue-400 text-lg shrink-0">ℹ</span>
        <div>
          <p className="text-blue-300 text-sm font-medium">Tentang Tipe Kriteria</p>
          <p className="text-blue-400/70 text-xs mt-1">
            <b>Benefit</b> — Semakin tinggi nilainya semakin baik (contoh: aksesibilitas, fasilitas).&nbsp;
            <b>Cost</b> — Semakin rendah nilainya semakin baik (contoh: harga, risiko banjir).
          </p>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <p className="text-slate-300 font-semibold text-sm">
            Daftar Kriteria <span className="text-slate-600 font-normal">({criteria.length} total)</span>
          </p>
        </div>
        <Table columns={fixedCols} data={tableData} loading={loading} emptyText="Belum ada kriteria. Klik '+ Tambah Kriteria' untuk mulai." />
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit Kriteria' : 'Tambah Kriteria Baru'}
      >
        <div className="space-y-4">
          <FormInput
            label="Nama Kriteria"
            placeholder="Contoh: Harga Tanah, Aksesibilitas Jalan"
            value={form.criteria_name}
            onChange={(e) => setForm({ ...form, criteria_name: e.target.value })}
          />
          <FormSelect
            label="Tipe Kriteria"
            value={form.criteria_type}
            onChange={(e) => setForm({ ...form, criteria_type: e.target.value })}
          >
            <option value="benefit">Benefit (semakin tinggi semakin baik)</option>
            <option value="cost">Cost (semakin rendah semakin baik)</option>
          </FormSelect>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)} className="flex-1">Batal</Button>
            <Button onClick={handleSave} loading={saving} className="flex-1">
              {editing ? 'Simpan Perubahan' : 'Tambah Kriteria'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

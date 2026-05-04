import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getCriteria,
  createCriteria,
  updateCriteria,
  deleteCriteria
} from '../services/api'

import Button from '../components/Button'
import Table from '../components/Table'
import Modal from '../components/Modal'
import { FormInput, FormSelect } from '../components/FormInput'

export default function CriteriaPage() {
  const { caseId } = useParams()
  const navigate = useNavigate()

  const [criteria, setCriteria] = useState([])
  const [loading, setLoading] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)

  const [form, setForm] = useState({
    criteria_name: '',
    criteria_type: 'benefit'
  })

  const [saving, setSaving] = useState(false)

  // ================================
  // FETCH DATA
  // ================================
  useEffect(() => {
    fetchCriteria()
  }, [caseId])

  const fetchCriteria = async () => {
    setLoading(true)
    try {
      const res = await getCriteria(caseId)
      const data = res.data.data || res.data

      setCriteria(data)
    } catch (err) {
      console.error("GET CRITERIA ERROR:", err)
    } finally {
      setLoading(false)
    }
  }

  // ================================
  // MODAL CONTROL
  // ================================
  const openCreate = () => {
    setEditing(null)
    setForm({ criteria_name: '', criteria_type: 'benefit' })
    setShowModal(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({
      criteria_name: row.criteria_name,
      criteria_type: row.criteria_type
    })
    setShowModal(true)
  }

  // ================================
  // SAVE (CREATE / UPDATE)
  // ================================
  const handleSave = async () => {
    if (!form.criteria_name.trim()) return

    setSaving(true)

    try {
      if (editing) {
        const id = editing.criteria_id || editing.id

        await updateCriteria(id, {
          criteria_name: form.criteria_name,
          criteria_type: form.criteria_type,
          case_id: Number(caseId)
        })

        setCriteria(prev =>
          prev.map(c =>
            (c.criteria_id || c.id) === id
              ? { ...c, ...form }
              : c
          )
        )
      } else {
        const res = await createCriteria({
          criteria_name: form.criteria_name,
          criteria_type: form.criteria_type,
          case_id: Number(caseId)
        })

        const newData = res.data.data || res.data

        setCriteria(prev => [...prev, newData])
      }

    } catch (err) {
      console.error("SAVE ERROR:", err)
    } finally {
      setSaving(false)
      setShowModal(false)
    }
  }

  // ================================
  // DELETE
  // ================================
  const handleDelete = async (id) => {
    if (!confirm('Hapus kriteria ini?')) return

    try {
      await deleteCriteria(id)
      setCriteria(prev =>
        prev.filter(c => (c.criteria_id || c.id) !== id)
      )
    } catch (err) {
      console.error("DELETE ERROR:", err)
    }
  }

  // ================================
  // TABLE CONFIG
  // ================================
  const columns = [
    {
      key: 'no',
      label: 'No',
      width: '60px',
      render: (_, __, idx) => idx + 1
    },
    {
      key: 'criteria_name',
      label: 'Nama Kriteria'
    },
    {
      key: 'criteria_type',
      label: 'Tipe',
      render: (v) => (
        <span className={`text-xs font-semibold px-2 py-1 rounded ${
          v === 'benefit'
            ? 'bg-green-500/10 text-green-400'
            : 'bg-red-500/10 text-red-400'
        }`}>
          {v === 'benefit' ? 'Benefit' : 'Cost'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (_, row) => {
        const id = row.criteria_id || row.id

        return (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => openEdit(row)}>
              Edit
            </Button>
            <Button size="sm" variant="danger" onClick={() => handleDelete(id)}>
              Hapus
            </Button>
          </div>
        )
      }
    }
  ]

  const tableData = criteria.map((c, i) => ({
    ...c,
    criteria_id: c.criteria_id || c.id,
    no: i + 1
  }))

  // ================================
  // UI
  // ================================
  return (
    <div className="p-8 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between">
        <div>
          <h1 className="text-xl font-bold">Manajemen Kriteria</h1>
          <p className="text-sm text-gray-500">
            Tentukan kriteria untuk penilaian
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={openCreate}>
            + Tambah
          </Button>

          <Button
            variant="secondary"
            onClick={() => navigate(`/criteria-weight/${caseId}`)}
          >
            Lanjut →
          </Button>
        </div>
      </div>

      {/* TABLE */}
      <Table
        columns={columns}
        data={tableData}
        loading={loading}
        emptyText="Belum ada kriteria"
      />

      {/* MODAL */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit Kriteria' : 'Tambah Kriteria'}
      >
        <div className="space-y-4">

          <FormInput
            label="Nama Kriteria"
            value={form.criteria_name}
            onChange={(e) =>
              setForm({ ...form, criteria_name: e.target.value })
            }
          />

          <FormSelect
            label="Tipe"
            value={form.criteria_type}
            onChange={(e) =>
              setForm({ ...form, criteria_type: e.target.value })
            }
          >
            <option value="benefit">Benefit</option>
            <option value="cost">Cost</option>
          </FormSelect>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowModal(false)}
            >
              Batal
            </Button>

            <Button onClick={handleSave} loading={saving}>
              Simpan
            </Button>
          </div>

        </div>
      </Modal>

    </div>
  )
}
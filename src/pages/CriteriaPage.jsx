import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getCriteria,
  createCriteria,
  updateCriteria,
  deleteCriteria,
  updateCaseStep,
} from "../services/api";

import Button from "../components/Button";
import Table from "../components/Table";
import Modal from "../components/Modal";
import { FormInput, FormSelect } from "../components/FormInput";

// Modern SVG Icons
const Icons = {
  Plus: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
  ArrowRight: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  ),
  Edit: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  ),
  Trash: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  ),
  Benefit: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
      <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
  ),
  Cost: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
      <polyline points="17 18 23 18 23 12"></polyline>
    </svg>
  ),
  Alert: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  ),
};

export default function CriteriaPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [criteria, setCriteria] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    criteria_name: "",
    criteria_type: "benefit",
    weight: 0,
  });

  const [saving, setSaving] = useState(false);

  const isCriteriaValid = criteria.length >= 2;

  // ================================
  // FETCH DATA
  // ================================
  useEffect(() => {
    fetchCriteria();
  }, [caseId]);

  const fetchCriteria = async () => {
    setLoading(true);
    try {
      const res = await getCriteria(caseId);
      const data = res.data.data || res.data;
      setCriteria(data);
    } catch (err) {
      console.error("GET CRITERIA ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // NEXT STEP
  // ================================
  const handleNextStep = async () => {
    try {
      setLoading(true);
      await updateCaseStep(caseId, 2); // update database ke step 2
      navigate(`/criteria-weight/${caseId}`);
    } catch (err) {
      console.error("Gagal update step", err);
      alert("Gagal mengupdate progress ke server.");
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // MODAL CONTROL
  // ================================
  const openCreate = () => {
    setEditing(null);
    setForm({ criteria_name: "", criteria_type: "benefit", weight: 0 });
    setShowModal(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      criteria_name: row.criteria_name,
      criteria_type: row.criteria_type,
      weight: row.weight ?? 0,
    });
    setShowModal(true);
  };

  // ================================
  // SAVE (CREATE / UPDATE)
  // ================================
  const handleSave = async () => {
    if (!form.criteria_name.trim()) return;

    setSaving(true);

    try {
      if (editing) {
        const id = editing.criteria_id || editing.id;

        await updateCriteria(id, {
          case_id: Number(caseId),
          criteria_name: form.criteria_name,
          criteria_type: form.criteria_type,
          weight: form.weight,
        });

        setCriteria((prev) =>
          prev.map((c) =>
            (c.criteria_id || c.id) === id ? { ...c, ...form } : c,
          ),
        );
      } else {
        const res = await createCriteria({
          case_id: Number(caseId),
          criteria_name: form.criteria_name,
          criteria_type: form.criteria_type,
          weight: form.weight,
        });

        const newData = res.data.data || res.data;
        setCriteria((prev) => [...prev, newData]);
      }
    } catch (err) {
      console.error("SAVE ERROR:", err);
    } finally {
      setSaving(false);
      setShowModal(false);
    }
  };

  // ================================
  // DELETE
  // ================================
  const handleDelete = async (id) => {
    if (!window.confirm("Hapus kriteria ini?")) return;

    try {
      await deleteCriteria(id);
      setCriteria((prev) => prev.filter((c) => (c.criteria_id || c.id) !== id));
    } catch (err) {
      console.error("DELETE ERROR:", err);
    }
  };

  // ================================
  // TABLE CONFIG
  // ================================
  const columns = [
    {
      key: "no",
      label: "No",
      width: "60px",
      render: (_, __, idx) => (
        <span className="text-slate-500 font-medium">{idx + 1}</span>
      ),
    },
    {
      key: "criteria_name",
      label: "Nama Kriteria",
      render: (v) => <span className="text-slate-200 font-semibold">{v}</span>,
    },
    {
      key: "criteria_type",
      label: "Tipe Atribut",
      render: (v) => (
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg border backdrop-blur-md w-24 justify-around ${
            v === "benefit"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
              : "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]"
          }`}
        >
          {v === "benefit" ? (
            <>
              <Icons.Benefit /> Benefit
            </>
          ) : (
            <>
              <Icons.Cost /> Cost
            </>
          )}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Aksi",
      width: "120px",
      render: (_, row) => {
        const id = row.criteria_id || row.id;
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => openEdit(row)}
              className="p-2 bg-slate-800/50 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 border border-transparent hover:border-blue-500/30 rounded-lg transition-all"
              title="Edit Kriteria"
            >
              <Icons.Edit />
            </button>
            <button
              onClick={() => handleDelete(id)}
              className="p-2 bg-slate-800/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-transparent hover:border-red-500/30 rounded-lg transition-all"
              title="Hapus Kriteria"
            >
              <Icons.Trash />
            </button>
          </div>
        );
      },
    },
  ];

  const tableData = criteria.map((c, i) => ({
    ...c,
    criteria_id: c.criteria_id || c.id,
    no: i + 1,
  }));

  // ================================
  // UI
  // ================================
  return (
    <div className="relative min-h-full p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* HEADER SECTION */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Manajemen Kriteria
          </h1>
          <p className="text-slate-400 text-sm mt-2 max-w-xl leading-relaxed">
            Tentukan kriteria penilaian yang akan digunakan sebagai parameter
            pengambil keputusan. Pastikan Anda memiliki setidaknya 2 kriteria
            untuk dapat melanjutkan analisis.
          </p>
        </div>

        <div className="flex flex-wrap justify-between items-center gap-3 shrink-0">
          <Button
            onClick={openCreate}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600 transition-all shadow-lg"
          >
            <Icons.Plus /> Tambah Kriteria
          </Button>

          <Button
            variant="secondary"
            onClick={handleNextStep}
            disabled={!isCriteriaValid || loading}
            className={`flex items-center gap-2 transition-all ${
              !isCriteriaValid || loading
                ? "opacity-50 cursor-not-allowed bg-slate-800 text-slate-500"
                : "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg shadow-blue-500/25 border-none"
            }`}
          >
            Lanjut ke Skala <Icons.ArrowRight />
          </Button>
        </div>
      </div>

      {/* VALIDATION ALERT */}
      {!isCriteriaValid && !loading && (
        <div className="relative z-10 flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 animate-in fade-in slide-in-from-top-2">
          <div className="text-amber-500 mt-0.5">
            <Icons.Alert />
          </div>
          <div>
            <h3 className="text-amber-400 text-sm font-bold">
              Kriteria Belum Mencukupi
            </h3>
            <p className="text-amber-500/70 text-xs mt-1 font-medium">
              Sistem membutuhkan minimal 2 (dua) kriteria untuk melakukan
              perhitungan komparasi.
            </p>
          </div>
        </div>
      )}

      {/* TABLE WRAPPER (Glassmorphism) */}
      <div className="relative z-10 bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl overflow-hidden">
        <Table
          columns={columns}
          data={tableData}
          loading={loading}
          emptyText="Belum ada data kriteria yang ditambahkan."
        />
      </div>

      {/* MODAL */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit Parameter Kriteria" : "Tambah Parameter Baru"}
      >
        <div className="space-y-5 p-1">
          <FormInput
            label="Nama Kriteria"
            placeholder="Contoh: Harga, Jarak, Fasilitas..."
            value={form.criteria_name}
            onChange={(e) =>
              setForm({ ...form, criteria_name: e.target.value })
            }
          />

          <div className="space-y-1">
            <FormSelect
              label="Tipe Atribut"
              value={form.criteria_type}
              onChange={(e) =>
                setForm({ ...form, criteria_type: e.target.value })
              }
            >
              <option value="benefit">Benefit </option>
              <option value="cost">Cost </option>
            </FormSelect>
            <p className="text-[11px] text-slate-500 font-medium ml-1 mt-1">
              *Tipe atribut menentukan bagaimana algoritma menormalisasi data.
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-800/80">
            <Button
              variant="ghost"
              onClick={() => setShowModal(false)}
              className="flex-1 bg-slate-800/50 hover:bg-slate-700 text-slate-300"
            >
              Batal
            </Button>

            <Button
              onClick={handleSave}
              loading={saving}
              className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-bold shadow-lg shadow-amber-500/20 border-none"
            >
              {saving ? "Menyimpan..." : "Simpan Kriteria"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

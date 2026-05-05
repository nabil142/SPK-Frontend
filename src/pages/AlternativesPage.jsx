import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getAlternatives,
  createAlternative,
  updateAlternative,
  deleteAlternative,
  updateCaseStep,
} from "../services/api";
import Button from "../components/Button";
import Table from "../components/Table";
import Modal from "../components/Modal";
import { FormInput, FormTextarea } from "../components/FormInput";

// Modern SVG Icons
const Icons = {
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  ArrowRight: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>,
  ArrowLeft: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
  Edit: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
  Alert: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>,
  MapPin: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
};

const DUMMY_ALTS = [
  {
    alternative_id: 1,
    alternative_name: "Lokasi A — Jl. Soekarno-Hatta No.10",
    description: "Dekat pusat kota, akses mudah",
  },
  {
    alternative_id: 2,
    alternative_name: "Lokasi B — Jl. Veteran No.45",
    description: "Kawasan bisnis, fasilitas lengkap",
  },
  {
    alternative_id: 3,
    alternative_name: "Lokasi C — Jl. Diponegoro No.88",
    description: "Harga terjangkau, lingkungan tenang",
  },
  {
    alternative_id: 4,
    alternative_name: "Lokasi D — Jl. Ahmad Yani No.22",
    description: "Strategis, dekat stasiun",
  },
  {
    alternative_id: 5,
    alternative_name: "Lokasi E — Jl. Basuki Rahmat No.5",
    description: "Premium, kawasan elite",
  },
];

export default function AlternativesPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [alts, setAlts] = useState(DUMMY_ALTS);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ alternative_name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const isAltsValid = alts.length >= 2;

  useEffect(() => {
    fetchAlts();
  }, [caseId]);

  const fetchAlts = async () => {
    setLoading(true);
    try {
      const res = await getAlternatives(caseId);
      const data = res.data.data || res.data || [];
      setAlts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("GET ALTERNATIVES ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ alternative_name: "", description: "" });
    setShowModal(true);
  };

  const handleNextStep = async () => {
    if (!isAltsValid) return alert("Minimal harus ada 2 alternatif/lokasi!");

    try {
      setLoading(true);
      await updateCaseStep(caseId, 4); // Update database ke step 4 (Nilai)
      navigate(`/values/${caseId}`);
    } catch (err) {
      console.error("Gagal update step", err);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      alternative_name: row.alternative_name,
      description: row.description,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.alternative_name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await updateAlternative(editing.alternative_id, {
          ...form,
          case_id: Number(caseId),
        });
        setAlts((prev) =>
          prev.map((a) =>
            a.alternative_id === editing.alternative_id ? { ...a, ...form } : a,
          ),
        );
      } else {
        const res = await createAlternative({
          ...form,
          case_id: Number(caseId),
        });
        setAlts((prev) => [...prev, res.data]);
      }
    } catch {
      if (editing) {
        setAlts((prev) =>
          prev.map((a) =>
            a.alternative_id === editing.alternative_id ? { ...a, ...form } : a,
          ),
        );
      } else {
        setAlts((prev) => [
          ...prev,
          { alternative_id: Date.now(), ...form, case_id: Number(caseId) },
        ]);
      }
    } finally {
      setSaving(false);
      setShowModal(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus alternatif ini?")) return;
    try {
      await deleteAlternative(id);
    } catch {}
    setAlts((prev) => prev.filter((a) => a.alternative_id !== id));
  };

  const columns = [
    { 
      key: "no", 
      label: "No", 
      width: "60px",
      render: (_, __, idx) => <span className="text-slate-500 font-medium">{idx + 1}</span>
    },
    { 
      key: "alternative_name", 
      label: "Nama Lokasi / Alternatif",
      render: (v) => (
        <span className="flex items-center gap-2 text-slate-200 font-bold">
          <span className="text-amber-500"><Icons.MapPin /></span> {v}
        </span>
      )
    },
    {
      key: "description",
      label: "Deskripsi",
      render: (v) => v ? <span className="text-slate-400 text-sm">{v}</span> : <span className="text-slate-600">—</span>,
    },
    {
      key: "actions",
      label: "Aksi",
      width: "120px",
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEdit(row)}
            className="p-2 bg-slate-800/50 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 border border-transparent hover:border-blue-500/30 rounded-lg transition-all"
            title="Edit Alternatif"
          >
            <Icons.Edit />
          </button>
          <button
            onClick={() => handleDelete(row.alternative_id)}
            className="p-2 bg-slate-800/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-transparent hover:border-red-500/30 rounded-lg transition-all"
            title="Hapus Alternatif"
          >
            <Icons.Trash />
          </button>
        </div>
      ),
    },
  ];

  const tableData = alts.map((a, i) => ({ ...a, no: i + 1 }));

  const steps = [
    { label: "Kriteria", path: `/criteria/${caseId}` },
    { label: "Alternatif", path: `/alternatives/${caseId}` },
    { label: "Nilai", path: `/values/${caseId}` },
    { label: "AHP", path: `/ahp/${caseId}` },
    { label: "Hasil", path: `/results/${caseId}` },
  ];

  return (
    <div className="relative min-h-full p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Breadcrumb Steps */}
      <div className="relative z-10 flex flex-wrap items-center gap-2 text-sm bg-slate-900/40 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800/80 w-fit">
        {steps.map((step, i, arr) => {
          const isActive = step.path === `/alternatives/${caseId}`;
          return (
            <span key={step.path} className="flex items-center gap-2">
              <button
                onClick={() => navigate(step.path)}
                className={`font-semibold transition-colors ${
                  isActive
                    ? "text-blue-400"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {step.label}
              </button>
              {i < arr.length - 1 && <span className="text-slate-700">/</span>}
            </span>
          )
        })}
      </div>

      {/* HEADER SECTION */}
      <div className="relative z-10 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Manajemen Alternatif
          </h1>
          <p className="text-slate-400 text-sm mt-2 max-w-xl leading-relaxed">
            Tambahkan lokasi-lokasi properti yang akan dievaluasi dan dibandingkan berdasarkan kriteria yang telah ditentukan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button
            variant="ghost"
            onClick={() => navigate(`/criteria-weight/${caseId}`)}
            className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
          >
            <Icons.ArrowLeft /> Kembali
          </Button>

          <Button 
            onClick={openCreate}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600 transition-all shadow-lg"
          >
            <Icons.Plus /> Tambah Lokasi
          </Button>

          <Button
            variant="secondary"
            onClick={handleNextStep}
            disabled={!isAltsValid || loading}
            className={`flex items-center gap-2 transition-all ${
              !isAltsValid || loading 
              ? 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-500' 
              : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg shadow-blue-500/25 border-none'
            }`}
          >
            Lanjut ke Nilai <Icons.ArrowRight />
          </Button>
        </div>
      </div>

      {/* VALIDATION ALERT */}
      {!isAltsValid && !loading && (
        <div className="relative z-10 flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 animate-in fade-in slide-in-from-top-2">
          <div className="text-amber-500 mt-0.5"><Icons.Alert /></div>
          <div>
            <h3 className="text-amber-400 text-sm font-bold">Alternatif Belum Mencukupi</h3>
            <p className="text-amber-500/70 text-xs mt-1 font-medium">Sistem membutuhkan minimal 2 (dua) alternatif lokasi untuk dapat melakukan komparasi keputusan.</p>
          </div>
        </div>
      )}

      {/* TABLE WRAPPER (Glassmorphism) */}
      <div className="relative z-10 bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-5 border-b border-slate-800/80 bg-slate-900/50 flex items-center justify-between">
          <p className="text-slate-200 font-bold text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Daftar Alternatif Lokasi
          </p>
          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
            {alts.length} Total
          </span>
        </div>
        <div className="p-6">
          <Table
            columns={columns}
            data={tableData}
            loading={loading}
            emptyText="Belum ada alternatif lokasi yang ditambahkan."
          />
        </div>
      </div>

      {/* MODAL */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit Alternatif Lokasi" : "Tambah Alternatif Baru"}
      >
        <div className="space-y-5 p-1">
          <FormInput
            label="Nama Lokasi / Alternatif"
            placeholder="Contoh: Lokasi A — Jl. Soekarno-Hatta No.10"
            value={form.alternative_name}
            onChange={(e) =>
              setForm({ ...form, alternative_name: e.target.value })
            }
          />
          
          <FormTextarea
            label="Deskripsi (Opsional)"
            placeholder="Keterangan singkat tentang lokasi, fasilitas, atau poin penting lainnya..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

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
              {editing ? "Simpan Perubahan" : "Tambah Alternatif"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
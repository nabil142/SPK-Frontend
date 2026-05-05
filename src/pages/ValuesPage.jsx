import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  getCriteria,
  getAlternatives,
  getValues,
  saveValues,
  updateCaseStep,
} from "../services/api";

import Button from "../components/Button";

export default function ValuesPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [criteria, setCriteria] = useState([]);
  const [alts, setAlts] = useState([]);
  const [values, setValues] = useState({});

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  const valuesRef = useRef(values);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [critRes, altRes, valRes] = await Promise.all([
          getCriteria(caseId),
          getAlternatives(caseId),
          getValues(caseId),
        ]);

        const critData = critRes.data?.data || critRes.data || [];
        const altData = altRes.data?.data || altRes.data || [];
        const valData = valRes.data?.data || valRes.data || [];

        setCriteria(Array.isArray(critData) ? critData : []);
        setAlts(Array.isArray(altData) ? altData : []);

        const map = {};
        if (Array.isArray(valData)) {
          valData.forEach((v) => {
            map[`${v.alternative_id}_${v.criteria_id}`] = v.value;
          });
        }
        setValues(map);
        valuesRef.current = map;
      } catch (error) {
        console.error("Gagal mengambil data dari backend:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (caseId) fetchData();
  }, [caseId]);

  const handleChange = (altId, critId, val) => {
    const newValues = { ...values, [`${altId}_${critId}`]: val };
    setValues(newValues);
    valuesRef.current = newValues;
    setSaveStatus("Menunggu...");
  };

  // 1. Simpan baris spesifik (Dipanggil setiap kali user selesai ngetik - onBlur)
  const saveAlternativeRow = async (altId) => {
    const rowValues = [];

    // Kumpulkan semua nilai untuk alternatif ini
    criteria.forEach((c) => {
      const key = `${altId}_${c.criteria_id}`;
      const valStr = valuesRef.current[key];

      if (valStr !== undefined && valStr !== "") {
        const val = parseFloat(valStr);
        if (!isNaN(val)) {
          rowValues.push({
            criteria_id: c.criteria_id,
            value: val,
          });
        }
      }
    });

    // Sesuai validasi backend: tidak boleh array kosong
    if (rowValues.length === 0) return true;

    // BENTUK PAYLOAD YANG DIHARAPKAN BACKEND
    const payload = {
      alternative_id: altId,
      values: rowValues,
    };

    try {
      setIsSaving(true);
      setSaveStatus("Menyimpan...");

      await saveValues(payload); // Tembak API

      setSaveStatus("Disimpan otomatis");
      setTimeout(() => setSaveStatus(""), 2000);
      return true;
    } catch (error) {
      console.error(`Gagal menyimpan alternatif ${altId}:`, error);
      setSaveStatus("Gagal menyimpan!");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // 2. Simpan semua baris (Dipanggil ketika user klik Lanjut / Pindah Halaman)
  const saveAllAlternatives = async () => {
    setIsSaving(true);
    setSaveStatus("Menyimpan semua...");
    try {
      const promises = alts.map((a) => {
        const rowValues = [];
        criteria.forEach((c) => {
          const valStr =
            valuesRef.current[`${a.alternative_id}_${c.criteria_id}`];
          if (valStr !== undefined && valStr !== "") {
            rowValues.push({
              criteria_id: c.criteria_id,
              value: parseFloat(valStr),
            });
          }
        });

        if (rowValues.length > 0) {
          // Promise untuk menembak API per alternatif
          return saveValues({
            alternative_id: a.alternative_id,
            values: rowValues,
          });
        }
        return Promise.resolve();
      });

      await Promise.all(promises); // Tunggu semua API selesai
      return true;
    } catch (error) {
      console.error("Gagal menyimpan semua:", error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const isMatrixComplete = useMemo(() => {
    if (criteria.length === 0 || alts.length === 0) return false;
    for (const a of alts) {
      for (const c of criteria) {
        const val = values[`${a.alternative_id}_${c.criteria_id}`];
        // Cek apakah nilai kosong, undefined, atau bukan angka
        if (val === undefined || val === "" || isNaN(parseFloat(val))) {
          return false;
        }
      }
    }
    return true;
  }, [values, criteria, alts]);

  // 2. Update fungsi handleNavigate[cite: 7]
  const handleNavigate = async (path) => {
    const isGoingToNextStep =
      path.includes("ahp") || path.includes("alt-comparison");

    if (isGoingToNextStep && !isMatrixComplete) {
      alert("Harap isi SEMUA kolom nilai pada matriks sebelum melanjutkan!");
      return;
    }

    await saveAllAlternatives();

    // Jika berhasil save dan memang tujuannya ke step 5
    if (isGoingToNextStep) {
      try {
        await updateCaseStep(caseId, 5); // Update database ke step 5 (AHP)
      } catch (err) {
        console.error("Gagal update step", err);
      }
    }

    navigate(path);
  };
  const steps = [
    { label: "Kriteria", path: `/criteria/${caseId}` },
    { label: "Alternatif", path: `/alternatives/${caseId}` },
    { label: "Nilai", path: `/values/${caseId}` },
    { label: "AHP", path: `/ahp/${caseId}` },
    { label: "Hasil", path: `/results/${caseId}` },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {steps.map((step, i, arr) => (
          <span key={step.path} className="flex items-center gap-2">
            <button
              onClick={() => {
                if (step.path.includes("ahp") && !isMatrixComplete) {
                  return alert(
                    "Harap isi semua nilai matriks terlebih dahulu!",
                  );
                }
                handleNavigate(step.path);
              }}
              className={`font-medium transition-colors ${
                step.path === `/values/${caseId}`
                  ? "text-amber-400"
                  : "text-slate-500 hover:text-slate-300"
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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">
              Input Nilai Alternatif
            </h1>
            {saveStatus && (
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  saveStatus.includes("Gagal")
                    ? "bg-red-500/20 text-red-400"
                    : "bg-emerald-500/10 text-emerald-400"
                }`}
              >
                {isSaving ? "⏳ " : saveStatus.includes("Gagal") ? "⚠ " : "✓ "}
                {saveStatus}
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Isi nilai setiap alternatif terhadap masing-masing kriteria. Data
            tersimpan otomatis.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => handleNavigate(`/alternatives/${caseId}`)}
          >
            ← Kembali
          </Button>
          <Button
            onClick={() => handleNavigate(`/alt-comparison/${caseId}`)}
            disabled={!isMatrixComplete}
          >
            Lanjut ke Perbandingan →
          </Button>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center">
          <p className="text-slate-300 font-semibold text-sm">
            Matriks Nilai (Alternatif × Kriteria)
          </p>
          {isLoading && (
            <span className="text-xs text-amber-400 animate-pulse">
              Memuat data dari server...
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          {!isLoading && criteria.length === 0 && alts.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              Tidak ada data Kriteria atau Alternatif yang ditemukan untuk kasus
              ini.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[160px]">
                    Alternatif
                  </th>
                  {criteria?.map((c) => (
                    <th
                      key={c.criteria_id}
                      className="px-3 py-3 text-center min-w-[130px]"
                    >
                      <p className="text-xs font-semibold text-slate-300">
                        {c.criteria_name}
                      </p>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          c.criteria_type === "benefit"
                            ? "text-emerald-400 bg-emerald-500/10"
                            : "text-red-400 bg-red-500/10"
                        }`}
                      >
                        {c.criteria_type === "benefit" ? "↑ Benefit" : "↓ Cost"}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {alts?.map((a, ri) => (
                  <tr
                    key={a.alternative_id}
                    className={`border-b border-slate-800/60 ${ri % 2 === 0 ? "" : "bg-slate-800/20"}`}
                  >
                    <td className="px-4 py-3">
                      <span className="text-slate-300 font-medium text-sm">
                        {a.alternative_name}
                      </span>
                    </td>
                    {criteria?.map((c) => (
                      <td key={c.criteria_id} className="px-3 py-2 text-center">
                        <input
                          type="number"
                          value={
                            values[`${a.alternative_id}_${c.criteria_id}`] ?? ""
                          }
                          onChange={(e) =>
                            handleChange(
                              a.alternative_id,
                              c.criteria_id,
                              e.target.value,
                            )
                          }
                          onBlur={() => saveAlternativeRow(a.alternative_id)} // <-- Fokus: Panggil API hanyak untuk baris id ini
                          placeholder="0"
                          disabled={isLoading}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-sm text-slate-200 text-center focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-colors disabled:opacity-50"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

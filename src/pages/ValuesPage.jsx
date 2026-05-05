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

// Modern SVG Icons
const Icons = {
  Table: () => <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18"/></svg>,
  Benefit: () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>,
  Cost: () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>,
  ArrowRight: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>,
  ArrowLeft: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
  Check: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  Info: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12.01" y2="16"></line><line x1="12" y1="12" x2="12" y2="8"></line></svg>
};

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

  const saveAlternativeRow = async (altId) => {
    const rowValues = [];
    criteria.forEach((c) => {
      const key = `${altId}_${c.criteria_id}`;
      const valStr = valuesRef.current[key];
      if (valStr !== undefined && valStr !== "") {
        const val = parseFloat(valStr);
        if (!isNaN(val)) {
          rowValues.push({ criteria_id: c.criteria_id, value: val });
        }
      }
    });

    if (rowValues.length === 0) return true;

    const payload = { alternative_id: altId, values: rowValues };

    try {
      setIsSaving(true);
      setSaveStatus("Menyimpan...");
      await saveValues(payload);
      setSaveStatus("Tersimpan");
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

  const saveAllAlternatives = async () => {
    setIsSaving(true);
    setSaveStatus("Menyimpan semua...");
    try {
      const promises = alts.map((a) => {
        const rowValues = [];
        criteria.forEach((c) => {
          const valStr = valuesRef.current[`${a.alternative_id}_${c.criteria_id}`];
          if (valStr !== undefined && valStr !== "") {
            rowValues.push({
              criteria_id: c.criteria_id,
              value: parseFloat(valStr),
            });
          }
        });

        if (rowValues.length > 0) {
          return saveValues({ alternative_id: a.alternative_id, values: rowValues });
        }
        return Promise.resolve();
      });

      await Promise.all(promises);
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
        if (val === undefined || val === "" || isNaN(parseFloat(val))) {
          return false;
        }
      }
    }
    return true;
  }, [values, criteria, alts]);

  const handleNavigate = async (path) => {
    const isGoingToNextStep = path.includes("ahp") || path.includes("alt-comparison");

    if (isGoingToNextStep && !isMatrixComplete) {
      alert("Harap isi SEMUA kolom nilai pada matriks sebelum melanjutkan!");
      return;
    }

    await saveAllAlternatives();

    if (isGoingToNextStep) {
      try {
        await updateCaseStep(caseId, 5);
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
    <div className="relative min-h-full p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Breadcrumbs */}
      <div className="relative z-10 flex flex-wrap items-center gap-2 text-sm bg-slate-900/40 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800/80 w-fit shadow-sm">
        {steps.map((step, i, arr) => (
          <span key={step.path} className="flex items-center gap-2">
            <button
              onClick={() => {
                if (step.path.includes("ahp") && !isMatrixComplete) {
                  return alert("Harap isi semua nilai matriks terlebih dahulu!");
                }
                handleNavigate(step.path);
              }}
              className={`font-semibold transition-all ${
                step.path === `/values/${caseId}`
                  ? "text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {step.label}
            </button>
            {i < arr.length - 1 && <span className="text-slate-700 font-light">/</span>}
          </span>
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-3xl font-black text-white tracking-tight">Input Nilai Alternatif</h1>
            {saveStatus && (
              <div className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg border backdrop-blur-md transition-all animate-in fade-in zoom-in duration-300 ${
                saveStatus.includes("Gagal")
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              }`}>
                {isSaving ? <span className="animate-spin text-lg leading-none shrink-0">◌</span> : saveStatus.includes("Gagal") ? "!" : <Icons.Check />}
                <span className="uppercase tracking-wider">{saveStatus}</span>
              </div>
            )}
          </div>
          <p className="text-slate-400 text-sm mt-2 max-w-xl leading-relaxed">
            Masukkan performa setiap alternatif properti pada tiap kriteria. Gunakan nilai numerik objektif untuk hasil analisis yang akurat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button
            variant="ghost"
            onClick={() => handleNavigate(`/alternatives/${caseId}`)}
            className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
          >
            <Icons.ArrowLeft /> Kembali
          </Button>
          <Button
            onClick={() => handleNavigate(`/alt-comparison/${caseId}`)}
            disabled={!isMatrixComplete}
            className={`flex items-center gap-2 transition-all ${
              !isMatrixComplete
                ? "bg-slate-800 text-slate-500 cursor-not-allowed opacity-60"
                : "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg shadow-blue-500/25 border-none font-bold"
            }`}
          >
            Lanjut ke Perbandingan <Icons.ArrowRight />
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="relative z-10 flex items-center gap-3 bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 backdrop-blur-sm">
        <span className="text-blue-400 shrink-0"><Icons.Info /></span>
        <p className="text-blue-300/80 text-xs font-medium">
          Data akan tersimpan secara otomatis setiap kali Anda berpindah antar sel input (*on-blur*).
        </p>
      </div>

      {/* Matrix Table Card */}
      <div className="relative z-10 bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-3xl shadow-2xl overflow-hidden shadow-black/20">
        <div className="px-6 py-5 border-b border-slate-800/80 bg-slate-900/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-blue-400"><Icons.Table /></span>
            <p className="text-slate-200 font-bold text-sm tracking-wide">Matriks Keputusan (Alternatif × Kriteria)</p>
          </div>
          {isLoading && (
            <span className="text-xs font-bold text-amber-500 flex items-center gap-2 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Sinkronisasi Server...
            </span>
          )}
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          {!isLoading && criteria.length === 0 && alts.length === 0 ? (
            <div className="p-20 text-center text-slate-500 italic flex flex-col items-center gap-3">
              <div className="p-4 bg-slate-800 rounded-2xl mb-2 opacity-50">⚠️</div>
              <p>Belum ada data Kriteria atau Alternatif untuk ditampilkan.</p>
            </div>
          ) : (
            <table className="w-full text-sm border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-950/30">
                  <th className="sticky left-0 z-20 bg-slate-900/90 backdrop-blur-md px-6 py-5 text-left text-xs font-black text-slate-500 uppercase tracking-[0.15em] border-b border-slate-800/50 w-[160px]">
                    Alternatif
                  </th>
                  {criteria?.map((c) => (
                    <th key={c.criteria_id} className="px-4 py-5 text-center w-[150px] border-b border-slate-800/50">
                      <div className="flex flex-col items-center gap-1.5">
                        <p className="text-xs font-black text-slate-200 tracking-tight uppercase line-clamp-1">{c.criteria_name}</p>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          c.criteria_type === "benefit"
                            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                            : "text-rose-400 bg-rose-500/10 border-rose-500/20"
                        }`}>
                          {c.criteria_type === "benefit" ? <><Icons.Benefit /> Benefit</> : <><Icons.Cost /> Cost</>}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {alts?.map((a, ri) => (
                  <tr key={a.alternative_id} className="group hover:bg-slate-800/30 transition-colors duration-150">
                    <td className="sticky left-0 z-20 bg-slate-900/90 backdrop-blur-md px-6 py-4 border-r border-slate-800/30 w-[160px]">
                      <div className="flex flex-col">
                        <span className="text-white font-bold text-sm tracking-tight break-words">{a.alternative_name}</span>
                      </div>
                    </td>
                    {criteria?.map((c) => (
                      <td key={c.criteria_id} className="px-4 py-4 text-center w-[150px]">
                        <input
                          type="number"
                          step="any"
                          value={values[`${a.alternative_id}_${c.criteria_id}`] ?? ""}
                          onChange={(e) => handleChange(a.alternative_id, c.criteria_id, e.target.value)}
                          onBlur={() => saveAlternativeRow(a.alternative_id)}
                          placeholder="0.00"
                          disabled={isLoading}
                          className="w-full bg-slate-950/50 border border-slate-800/80 rounded-xl px-4 py-2.5 text-sm font-mono text-blue-400 placeholder-slate-700 text-center focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 hover:border-slate-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-inner"
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
      
      {/* Matrix Status Indicator */}
      <div className="flex justify-center md:justify-end">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-bold transition-all ${
          isMatrixComplete 
          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
          : "bg-slate-800 border-slate-700 text-slate-500 opacity-50"
        }`}>
          <span className={`w-2 h-2 rounded-full ${isMatrixComplete ? "bg-emerald-500 animate-pulse" : "bg-slate-600"}`}></span>
          {isMatrixComplete ? "Matriks Siap untuk Dianalisis" : "Matriks Belum Lengkap"}
        </div>
      </div>
    </div>
  );
}
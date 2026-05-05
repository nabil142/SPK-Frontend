import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getCriteria,
  saveCriteriaComparisons,
  updateCaseStep,
  calculateAHP,
} from "../services/api";
import Button from "../components/Button";
import StepNav from "../components/stepnav";

const SCALE_STEPS = [9, 7, 5, 3, 1, 3, 5, 7, 9];
const SCALE_VALUES = [1 / 9, 1 / 7, 1 / 5, 1 / 3, 1, 3, 5, 7, 9];
const SCALE_LABELS = ["9", "7", "5", "3", "1", "3", "5", "7", "9"];

// Modern SVG Icons
const Icons = {
  ArrowLeft: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
  ArrowRight: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>,
  Scale: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path><path d="M7 21h10"></path><path d="M12 3v18"></path><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"></path></svg>,
  Lightbulb: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5"></path><path d="M9 18h6"></path><path d="M10 22h4"></path></svg>,
  Check: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  X: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Alert: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>,
  Loader: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
};

// ── Helpers ────────────────────────────────────────────────────────
function getPairs(criteria) {
  const pairs = [];
  for (let i = 0; i < criteria.length; i++)
    for (let j = i + 1; j < criteria.length; j++)
      pairs.push([criteria[i], criteria[j]]);
  return pairs;
}

function getId(c) {
  return c.criteria_id ?? c.id;
}

function calcWeights(criteria, sliders) {
  const n = criteria.length;
  if (n === 0) return [];
  const mat = Array.from({ length: n }, () => Array(n).fill(1));
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const v = sliders[`${getId(criteria[i])}_${getId(criteria[j])}`] ?? 1;
      mat[i][j] = v;
      mat[j][i] = 1 / v;
    }
  const gm = mat.map((row) =>
    Math.pow(
      row.reduce((a, b) => a * b, 1),
      1 / n,
    ),
  );
  const sum = gm.reduce((a, b) => a + b, 0);
  return gm.map((v) => v / sum);
}

function calculateCR(criteria, sliders, weights) {
  const n = criteria.length;
  if (n < 3) return { cr: 0, isValid: true };
  const mat = Array.from({ length: n }, () => Array(n).fill(1));
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const v = sliders[`${getId(criteria[i])}_${getId(criteria[j])}`] ?? 1;
      mat[i][j] = v;
      mat[j][i] = 1 / v;
    }
  let lambdaMax = 0;
  for (let i = 0; i < n; i++) {
    let rowSum = 0;
    for (let j = 0; j < n; j++) rowSum += mat[i][j] * weights[j];
    lambdaMax += rowSum / weights[i];
  }
  lambdaMax /= n;
  const CI = (lambdaMax - n) / (n - 1);
  const RI_TABLE = [0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49];
  const RI = RI_TABLE[n - 1] ?? 1.49;
  const CR = CI / RI;
  return { cr: isNaN(CR) ? 0 : Number(CR.toFixed(3)), isValid: CR <= 0.1 };
}

// ── Comparison Row ─────────────────────────────────────────────────
function ComparisonRow({ left, right, value, onChange, onSave }) {
  const idx = SCALE_VALUES.findIndex((v) => Math.abs(v - value) < 0.0001);
  const pos = idx === -1 ? 4 : idx;

  const dominantName = pos <= 4 ? left.criteria_name : right.criteria_name;
  const subordinateName = pos <= 4 ? right.criteria_name : left.criteria_name;
  const times = SCALE_STEPS[pos];

  return (
    <div className="py-4 sm:py-6 border-b border-slate-700/50 last:border-b-0 hover:bg-slate-800/20 transition-colors px-1 sm:px-2 rounded-lg">
      <div className="flex flex-col md:flex-row md:items-center md:gap-6">
        
        <span
          className={`text-sm md:text-sm font-bold md:font-semibold tracking-tight transition-colors duration-300 mb-2 md:mb-0
            text-left md:text-right 
            w-full md:w-40 shrink-0 truncate
            ${pos < 4 ? "text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "text-slate-400"}`}
          title={left.criteria_name}
        >
          {left.criteria_name}
        </span>

        <div className="flex-1 w-full relative">
          <div className="flex justify-between mb-2 sm:mb-4 px-0.5">
            {SCALE_LABELS.map((label, i) => (
              <span
                key={i}
                className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-[10px] sm:text-[12px] font-black rounded-lg transition-all duration-300 ${i === pos ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/40 scale-110" : i < 4 ? "text-blue-400/40" : i > 4 ? "text-cyan-400/40" : "text-slate-500"}`}
              >
                {label}
              </span>
            ))}
          </div>

          <div className="relative flex items-center h-1.5 sm:h-2">
            <div
              className="absolute left-0 h-1.5 sm:h-2 rounded-l-full bg-gradient-to-r from-blue-600 to-blue-400 pointer-events-none transition-all duration-300"
              style={{ width: `${(pos / 8) * 100}%` }}
            />
            <div
              className="absolute right-0 h-1.5 sm:h-2 rounded-r-full bg-slate-700/50 pointer-events-none transition-all duration-300"
              style={{ width: `${((8 - pos) / 8) * 100}%` }}
            />
            <input
              type="range"
              min={0}
              max={8}
              step={1}
              value={pos}
              onChange={(e) => onChange(SCALE_VALUES[parseInt(e.target.value)])}
              onMouseUp={onSave}
              onTouchEnd={onSave}
              className="relative w-full h-1.5 sm:h-2 bg-transparent appearance-none cursor-pointer z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-slate-100 [&::-webkit-slider-thumb]:border-2 sm:[&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(59,130,246,0.6)] [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing active:[&::-webkit-slider-thumb]:scale-110 [&::-webkit-slider-thumb]:transition-transform"
            />
          </div>

          <p className="text-center text-[10px] md:text-xs mt-4 font-medium px-2 py-1.5 bg-slate-900/50 border border-slate-800 rounded-lg inline-block w-full backdrop-blur-sm">
            <span className="text-blue-400 font-bold">{dominantName}</span>
            <span className="text-slate-400">
              {" "}
              {times === 1
                ? "sama penting dengan"
                : <><span className="text-amber-400 font-bold">{times}x</span> lebih penting dari</>}{" "}
            </span>
            <span className="text-slate-300 font-semibold">
              {pos === 4 ? right.criteria_name : subordinateName}
            </span>
          </p>
        </div>

        <span
          className={`text-sm md:text-sm font-bold md:font-semibold tracking-tight transition-colors duration-300 mt-2 md:mt-0
            text-right md:text-left 
            w-full md:w-40 shrink-0 truncate
            ${pos > 4 ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" : "text-slate-400"}`}
          title={right.criteria_name}
        >
          {right.criteria_name}
        </span>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
export default function CriteriaWeightPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [criteria, setCriteria] = useState([]);
  const [sliders, setSliders] = useState({});
  const [weights, setWeights] = useState([]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [validating, setValidating] = useState(false);
  const [crResult, setCRResult] = useState(null);

  const isInitialLoad = useRef(true);
  const slidersRef = useRef(sliders);

  useEffect(() => {
    const savedState = localStorage.getItem(`ahp_criteria_${caseId}`);
    if (savedState) {
      const parsed = JSON.parse(savedState);
      setSliders(parsed);
      slidersRef.current = parsed;
    }

    getCriteria(caseId)
      .then((res) => {
        setCriteria(res.data?.data ?? res.data ?? []);
      })
      .catch(() => {});
  }, [caseId]);

  const pairs = useMemo(() => getPairs(criteria), [criteria]);
  const getSliderVal = (id1, id2) => sliders[`${id1}_${id2}`] ?? 1;

  const handleSliderChange = (id1, id2, val) => {
    const newSliders = { ...sliders, [`${id1}_${id2}`]: val };
    setSliders(newSliders);
    slidersRef.current = newSliders;
    setCRResult(null);
    setSaveStatus("Menunggu...");
  };

  useEffect(() => {
    setWeights(calcWeights(criteria, sliders));
  }, [criteria, sliders]);

  useEffect(() => {
    if (isInitialLoad.current && criteria.length >= 2 && weights.length > 0) {
      setCRResult(calculateCR(criteria, slidersRef.current, weights));
      isInitialLoad.current = false;
    }
  }, [criteria, weights]);

  const handleValidate = () => {
    setValidating(true);
    setTimeout(() => {
      setCRResult(calculateCR(criteria, sliders, weights));
      setValidating(false);
    }, 450);
  };

  const autoSaveData = async () => {
    if (criteria.length < 2) return true;

    localStorage.setItem(
      `ahp_criteria_${caseId}`,
      JSON.stringify(slidersRef.current),
    );

    const currentWeights = calcWeights(criteria, slidersRef.current);
    const comparisons = pairs.map(([a, b]) => ({
      case_id: Number(caseId),
      criteria_1: getId(a),
      criteria_2: getId(b),
      comparison_value: slidersRef.current[`${getId(a)}_${getId(b)}`] ?? 1,
    }));

    try {
      setIsSaving(true);
      setSaveStatus("Menyimpan...");

      await saveCriteriaComparisons({
        case_id: Number(caseId),
        comparisons,
        weights: currentWeights,
      });

      await calculateAHP(caseId);

      setSaveStatus("Disimpan otomatis");
      setTimeout(() => setSaveStatus(""), 2000);
      return true;
    } catch (error) {
      console.error("Gagal menyimpan data:", error);
      setSaveStatus("Gagal menyimpan!");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleNavigate = async (path) => {
    if (path.includes("alternatives") && !crResult?.isValid) {
      alert(
        "Harap lakukan Validasi Konsistensi terlebih dahulu dan pastikan matriks valid!",
      );
      return;
    }

    await autoSaveData();

    if (path.includes("alternatives")) {
      try {
        await updateCaseStep(caseId, 3);
      } catch (err) {
        console.error("Gagal update step", err);
      }
    }

    navigate(path);
  };

  return (
    <div className="relative p-6 md:p-10 space-y-8 max-w-5xl mx-auto min-h-full">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10">
        <StepNav caseId={caseId} currentStep={2} />
      </div>

      <div className="relative z-10 bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 md:p-10 shadow-2xl space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                <Icons.Scale />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Skala Perbandingan Kriteria
              </h1>
            </div>
            <p className="text-slate-400 text-sm md:ml-14 max-w-lg leading-relaxed">
              Tentukan tingkat kepentingan antar kriteria menggunakan skala AHP (1-9). Perubahan akan otomatis tersimpan.
            </p>
          </div>

          {/* Save Status Badge */}
          {saveStatus && (
            <div className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg border backdrop-blur-md transition-all ${
              saveStatus.includes("Gagal") 
              ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            }`}>
              {isSaving ? <Icons.Loader /> : saveStatus.includes("Gagal") ? <Icons.Alert /> : <Icons.Check />}
              <span>{saveStatus}</span>
            </div>
          )}
        </div>

        {/* INFO BANNER */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl px-5 py-4 flex items-start gap-3 backdrop-blur-sm">
          <span className="text-blue-400 mt-0.5"><Icons.Lightbulb /></span>
          <p className="text-blue-300/80 text-sm font-medium leading-relaxed">
            <strong className="text-blue-400">Informasi Penting:</strong> Bobot Kriteria yang dihasilkan dari kalkulasi AHP di sini akan otomatis digunakan sebagai pengali matriks oleh seluruh metode lain (SAW, TOPSIS, WP, SMART).
          </p>
        </div>

        {/* CONSISTENCY RATIO (CR) RESULT BOX */}
        {crResult && (
          <div className={`rounded-2xl px-5 py-4 border flex items-start gap-4 animate-in fade-in slide-in-from-top-2 backdrop-blur-sm ${
            crResult.isValid 
            ? "bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]" 
            : "bg-rose-500/10 border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.1)]"
          }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
              crResult.isValid ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border-rose-500/30"
            }`}>
              {crResult.isValid ? <Icons.Check /> : <Icons.X />}
            </div>
            <div>
              <p className={`text-base font-bold tracking-wide ${crResult.isValid ? "text-emerald-400" : "text-rose-400"}`}>
                Consistency Ratio (CR) = <span className="text-xl">{crResult.cr}</span>
              </p>
              <p className={`text-sm mt-1 font-medium ${crResult.isValid ? "text-emerald-500/70" : "text-rose-400/80"}`}>
                {crResult.isValid
                  ? "Bagus! Matriks Anda konsisten (CR ≤ 0.1). Anda dapat melanjutkan ke langkah berikutnya."
                  : "Peringatan! Matriks perbandingan tidak konsisten (CR > 0.1). Harap evaluasi ulang penilaian logika Anda pada form di bawah."}
              </p>
            </div>
          </div>
        )}

        {/* SLIDERS SECTION */}
        {criteria.length < 2 ? (
          <div className="text-center py-16 bg-slate-900/50 border border-slate-800/80 border-dashed rounded-3xl">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-500">
              <Icons.Alert />
            </div>
            <p className="text-slate-400 font-medium text-lg">Kriteria Belum Lengkap</p>
            <p className="text-slate-500 text-sm mt-1 mb-6">Tambahkan minimal 2 kriteria untuk melakukan perbandingan matriks.</p>
            <Button
              variant="outline"
              className="mx-auto flex items-center gap-2 border-slate-700 text-slate-300 hover:bg-slate-800"
              onClick={() => handleNavigate(`/criteria/${caseId}`)}
            >
              <Icons.ArrowLeft /> Kembali ke Form Kriteria
            </Button>
          </div>
        ) : (
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-2 md:p-4 shadow-inner">
            {pairs.map(([a, b]) => {
              const id1 = getId(a), id2 = getId(b);
              return (
                <ComparisonRow
                  key={`${id1}_${id2}`}
                  left={a}
                  right={b}
                  value={getSliderVal(id1, id2)}
                  onChange={(val) => handleSliderChange(id1, id2, val)}
                  onSave={autoSaveData}
                />
              );
            })}
          </div>
        )}

        {/* PREVIEW WEIGHTS SECTION */}
        {weights.length > 0 && criteria.length >= 2 && (
          <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-800/80 backdrop-blur-md mt-8">
            <h3 className="text-slate-300 text-sm font-bold uppercase tracking-widest mb-5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> Hasil Bobot Sementara
            </h3>
            <div className="space-y-4">
              {criteria.map((c, i) => {
                const percentage = ((weights[i] ?? 0) * 100).toFixed(1);
                return (
                  <div key={getId(c)} className="flex items-center gap-4 group">
                    <span className="text-slate-300 font-semibold text-sm w-32 md:w-48 shrink-0 truncate group-hover:text-white transition-colors" title={c.criteria_name}>
                      {c.criteria_name}
                    </span>
                    <div className="flex-1 bg-slate-800/80 rounded-full h-3 overflow-hidden shadow-inner border border-slate-700/50">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(34,211,238,0.5)] relative"
                        style={{ width: `${percentage}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                      </div>
                    </div>
                    <span className="text-cyan-400 font-black text-sm w-16 text-right drop-shadow-[0_0_5px_rgba(34,211,238,0.3)]">
                      {percentage}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>

      {/* FOOTER ACTIONS */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 mt-8">
        <Button
          variant="ghost"
          onClick={() => handleNavigate(`/criteria/${caseId}`)}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 border border-slate-700/50 transition-all"
        >
          <Icons.ArrowLeft /> Kembali
        </Button>
        <div className="flex flex-col md:flex-row w-full md:w-auto gap-3">
          <Button
            variant="outline"
            onClick={handleValidate}
            loading={validating}
            className="w-full md:w-auto border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:border-blue-400 transition-all"
          >
            {validating ? "Mengecek..." : "Validasi Konsistensi CR"}
          </Button>
          <Button
            onClick={() => handleNavigate(`/alternatives/${caseId}`)}
            disabled={!crResult?.isValid}
            className={`w-full md:w-auto flex items-center justify-center gap-2 transition-all duration-300 ${
              !crResult?.isValid 
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60' 
              : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-lg shadow-blue-500/25 border-none text-white'
            }`}
          >
            Lanjut ke Alternatif <Icons.ArrowRight />
          </Button>
        </div>
      </div>

    </div>
  );
}
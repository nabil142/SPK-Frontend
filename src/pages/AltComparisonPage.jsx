import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getCriteria,
  getAlternatives,
  saveAltComparisons,
  calculateAHPRanking,
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
  Building: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M8 10h.01"></path><path d="M16 10h.01"></path><path d="M8 14h.01"></path><path d="M16 14h.01"></path></svg>,
  Check: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  X: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Loader: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>,
  FileText: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
};

// ── Helpers ────────────────────────────────────────────────────────
function getPairs(list) {
  const pairs = [];
  for (let i = 0; i < list.length; i++)
    for (let j = i + 1; j < list.length; j++) pairs.push([list[i], list[j]]);
  return pairs;
}

function getId(item) {
  return item.alternative_id ?? item.criteria_id ?? item.id;
}

function calcWeights(alts, sliders, criteriaId) {
  const n = alts.length;
  if (n === 0) return [];
  const mat = Array.from({ length: n }, () => Array(n).fill(1));
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const v = sliders[`${criteriaId}_${getId(alts[i])}_${getId(alts[j])}`] ?? 1;
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

function calculateCR(alts, sliders, weights, criteriaId) {
  const n = alts.length;
  if (n < 3) return { cr: 0, isValid: true };
  const mat = Array.from({ length: n }, () => Array(n).fill(1));
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const v = sliders[`${criteriaId}_${getId(alts[i])}_${getId(alts[j])}`] ?? 1;
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

  const dominantName = pos <= 4 ? left.alternative_name : right.alternative_name;
  const subordinateName = pos <= 4 ? right.alternative_name : left.alternative_name;
  const times = SCALE_STEPS[pos];

  return (
    <div className="py-6 border-b border-slate-700/50 last:border-b-0 hover:bg-slate-800/20 transition-colors px-2 md:px-4 rounded-xl">
      <div className="flex flex-col md:flex-row md:items-center md:gap-6">
        
        {/* Kriteria Kiri - Mobile: Left Aligned Above */}
        <span
          className={`text-sm font-bold md:font-semibold tracking-tight transition-colors duration-300 mb-2 md:mb-0
            text-left md:text-right 
            w-full md:w-40 shrink-0 truncate
            ${pos < 4 ? "text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "text-slate-400"}`}
          title={left.alternative_name}
        >
          {left.alternative_name}
        </span>

        {/* Slider Tengah */}
        <div className="flex-1 w-full relative">
          <div className="flex justify-between mb-3 px-0.5">
            {SCALE_LABELS.map((label, i) => (
              <span
                key={i}
                className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-[10px] sm:text-[12px] font-black rounded-lg transition-all duration-300 ${i === pos ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/40 scale-110" : i < 4 ? "text-blue-400/40" : i > 4 ? "text-cyan-400/40" : "text-slate-500"}`}
              >
                {label}
              </span>
            ))}
          </div>

          <div className="relative flex items-center h-2">
            <div
              className="absolute left-0 h-2 rounded-l-full bg-gradient-to-r from-blue-600 to-blue-400 pointer-events-none transition-all duration-300"
              style={{ width: `${(pos / 8) * 100}%` }}
            />
            <div
              className="absolute right-0 h-2 rounded-r-full bg-slate-700/50 pointer-events-none transition-all duration-300"
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
              className="relative w-full h-2 bg-transparent appearance-none cursor-pointer z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-slate-100 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:shadow-[0_0_15px_rgba(59,130,246,0.6)] [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing active:[&::-webkit-slider-thumb]:scale-110 [&::-webkit-slider-thumb]:transition-transform"
            />
          </div>

          <div className="text-center text-[10px] md:text-xs mt-4 font-medium px-2 py-1.5 bg-slate-900/50 border border-slate-800 rounded-lg inline-block w-full backdrop-blur-sm">
            <span className="text-blue-400 font-bold">{dominantName}</span>
            <span className="text-slate-400">
              {" "}
              {times === 1
                ? "sama penting dengan"
                : <><span className="text-amber-400 font-bold">{times}x</span> lebih penting dari</>}{" "}
            </span>
            <span className="text-slate-300 font-semibold">
              {pos === 4 ? right.alternative_name : subordinateName}
            </span>
          </div>
        </div>

        {/* Kriteria Kanan - Mobile: Right Aligned Below */}
        <span
          className={`text-sm font-bold md:font-semibold tracking-tight transition-colors duration-300 mt-2 md:mt-0
            text-right md:text-left 
            w-full md:w-40 shrink-0 truncate
            ${pos > 4 ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" : "text-slate-400"}`}
          title={right.alternative_name}
        >
          {right.alternative_name}
        </span>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
export default function AltComparisonPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [criteria, setCriteria] = useState([]);
  const [alts, setAlts] = useState([]);
  const [sliders, setSliders] = useState({});

  const [activeCrit, setActiveCrit] = useState(0);
  const [saveStatus, setSaveStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [validating, setValidating] = useState(false);
  const [crResult, setCRResult] = useState(null);

  const slidersRef = useRef(sliders);
  const isInitialLoad = useRef({});

  useEffect(() => {
    const savedState = localStorage.getItem(`ahp_alts_${caseId}`);
    if (savedState) {
      const parsed = JSON.parse(savedState);
      setSliders(parsed);
      slidersRef.current = parsed;
    }

    const fetchData = async () => {
      try {
        const [cRes, aRes] = await Promise.all([
          getCriteria(caseId),
          getAlternatives(caseId),
        ]);
        setCriteria(cRes.data?.data || cRes.data || []);
        setAlts(aRes.data?.data || aRes.data || []);
      } catch (err) {
        console.error("FETCH ERROR:", err);
      }
    };
    fetchData();
  }, [caseId]);

  const pairs = useMemo(() => getPairs(alts), [alts]);
  const activeCriteriaObj = criteria[activeCrit];
  const activeCriteriaId = activeCriteriaObj ? getId(activeCriteriaObj) : null;

  const currentWeights = useMemo(() => {
    if (!activeCriteriaId) return [];
    return calcWeights(alts, sliders, activeCriteriaId);
  }, [alts, sliders, activeCriteriaId]);

  useEffect(() => {
    if (!activeCriteriaId) return;

    if (
      !isInitialLoad.current[activeCriteriaId] &&
      alts.length >= 2 &&
      currentWeights.length > 0
    ) {
      setCRResult(
        calculateCR(
          alts,
          slidersRef.current,
          currentWeights,
          activeCriteriaId,
        ),
      );
      isInitialLoad.current[activeCriteriaId] = true;
    }
  }, [alts, currentWeights, activeCriteriaId]);

  const getSliderVal = (cId, id1, id2) => sliders[`${cId}_${id1}_${id2}`] ?? 1;

  const handleSliderChange = (cId, id1, id2, val) => {
    const newSliders = { ...sliders, [`${cId}_${id1}_${id2}`]: val };
    setSliders(newSliders);
    slidersRef.current = newSliders;
    setCRResult(null);
    setSaveStatus("Menunggu...");
  };

  const handleValidate = () => {
    setValidating(true);
    setTimeout(() => {
      setCRResult(calculateCR(alts, sliders, currentWeights, activeCriteriaId));
      setValidating(false);
    }, 450);
  };

  const autoSaveData = async () => {
    if (criteria.length === 0 || alts.length < 2) return true;
    localStorage.setItem(
      `ahp_alts_${caseId}`,
      JSON.stringify(slidersRef.current),
    );
    setSaveStatus("Disimpan otomatis");
    setTimeout(() => setSaveStatus(""), 2000);
    return true;
  };

  const handleFinalize = async () => {
    if (!crResult?.isValid) {
      alert("Matriks tidak konsisten. Harap perbaiki sebelum menghitung!");
      return;
    }

    setIsProcessing(true);
    setSaveStatus("Memproses keputusan...");

    try {
      const comparisons = [];
      criteria.forEach((c) => {
        const cId = getId(c);
        pairs.forEach(([a, b]) => {
          const id1 = getId(a);
          const id2 = getId(b);
          comparisons.push({
            case_id: Number(caseId),
            criteria_id: cId,
            alternative_1: id1, 
            alternative_2: id2, 
            comparison_value: slidersRef.current[`${cId}_${id1}_${id2}`] ?? 1,
          });
        });
      });

      await saveAltComparisons({ case_id: Number(caseId), comparisons });
      await calculateAHPRanking(caseId);

      setSaveStatus("Selesai!");
      setTimeout(() => {
        setIsProcessing(false);
        navigate(`/results/${caseId}`);
      }, 1200);
    } catch (err) {
      console.error("FINALIZATION ERROR:", err);
      setSaveStatus("Gagal memproses!");
      setTimeout(() => setIsProcessing(false), 2000);
    }
  };

  const handleBack = async () => {
    await autoSaveData();
    navigate(`/values/${caseId}`);
  };

  return (
    <div className="relative p-6 md:p-10 space-y-8 max-w-5xl mx-auto min-h-full">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10">
        <StepNav caseId={caseId} currentStep={5} />
      </div>

      <div className="relative z-10 bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 md:p-10 shadow-2xl space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Icons.Building />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Perbandingan Alternatif
              </h1>
            </div>
            <p className="text-slate-400 text-sm md:ml-14 max-w-lg leading-relaxed">
              Bandingkan setiap alternatif lokasi properti satu per satu berdasarkan setiap kriteria yang ada.
            </p>
          </div>

          {saveStatus && (
            <div className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg border backdrop-blur-md transition-all ${
              saveStatus.includes("Gagal") ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            }`}>
              {saveStatus.includes("Memproses") ? <Icons.Loader /> : <Icons.Check />}
              <span>{saveStatus}</span>
            </div>
          )}
        </div>

        {/* CRITERIA TABS */}
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
          {criteria.map((c, i) => (
            <button
              key={getId(c)}
              onClick={() => {
                setActiveCrit(i);
                setCRResult(null);
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 border ${
                i === activeCrit
                  ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/30"
                  : "bg-slate-800/50 border-slate-700/50 text-slate-500 hover:text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Icons.FileText /> {c.criteria_name}
            </button>
          ))}
        </div>

        {/* CONSISTENCY RATIO (CR) BOX */}
        {crResult && (
          <div className={`rounded-2xl px-5 py-4 border flex items-start gap-4 animate-in fade-in slide-in-from-top-2 backdrop-blur-sm ${
            crResult.isValid ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20"
          }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
              crResult.isValid ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border-rose-500/30"
            }`}>
              {crResult.isValid ? <Icons.Check /> : <Icons.X />}
            </div>
            <div>
              <p className={`text-base font-bold tracking-wide ${crResult.isValid ? "text-emerald-400" : "text-rose-400"}`}>
                CR Kriteria Ini = <span className="text-xl">{crResult.cr}</span>
              </p>
              <p className={`text-sm mt-1 font-medium ${crResult.isValid ? "text-emerald-500/70" : "text-rose-400/80"}`}>
                {crResult.isValid ? "Matriks untuk kriteria ini konsisten." : "Matriks tidak konsisten. Sesuaikan nilai perbandingan."}
              </p>
            </div>
          </div>
        )}

        {/* COMPARISON SLIDERS LIST */}
        <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-2 md:p-4 shadow-inner">
          {activeCriteriaId &&
            pairs.map(([a, b]) => (
              <ComparisonRow
                key={`${activeCriteriaId}_${getId(a)}_${getId(b)}`}
                left={a}
                right={b}
                value={getSliderVal(activeCriteriaId, getId(a), getId(b))}
                onChange={(val) =>
                  handleSliderChange(activeCriteriaId, getId(a), getId(b), val)
                }
                onSave={autoSaveData}
              />
            ))}
        </div>

        {/* PREVIEW WEIGHTS */}
        {currentWeights.length > 0 && (
          <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-800/80 backdrop-blur-md mt-8">
            <h3 className="text-slate-300 text-sm font-bold uppercase tracking-widest mb-5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> Prioritas Berdasarkan {activeCriteriaObj?.criteria_name}
            </h3>
            <div className="space-y-4">
              {alts.map((alt, i) => {
                const percentage = ((currentWeights[i] ?? 0) * 100).toFixed(1);
                return (
                  <div key={getId(alt)} className="flex items-center gap-4 group">
                    <span className="text-slate-300 font-semibold text-sm w-32 md:w-48 shrink-0 truncate transition-colors">
                      {alt.alternative_name}
                    </span>
                    <div className="flex-1 bg-slate-800 rounded-full h-2.5 overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-cyan-400 font-black text-sm w-16 text-right">
                      {percentage}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ACTIONS */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <Button variant="ghost" onClick={handleBack} className="w-full md:w-auto bg-slate-800/50 hover:bg-slate-800 text-slate-300 border border-slate-700/50">
          <Icons.ArrowLeft /> Kembali
        </Button>
        <div className="flex flex-col md:flex-row w-full md:w-auto gap-3">
          <Button
            variant="outline"
            onClick={handleValidate}
            loading={validating}
            className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
          >
            Validasi Konsistensi CR
          </Button>
          <Button
            onClick={handleFinalize}
            disabled={!crResult?.isValid || isProcessing}
            className={`flex items-center justify-center gap-2 transition-all duration-300 ${
              !crResult?.isValid ? 'bg-slate-800 text-slate-500' : 'bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/25'
            }`}
          >
            {isProcessing ? "Menghitung..." : <>Hitung & Lihat Hasil <Icons.ArrowRight /></>}
          </Button>
        </div>
      </div>

      {/* PROCESSING OVERLAY */}
      {isProcessing && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 p-10 rounded-3xl max-w-sm w-full text-center space-y-6 shadow-2xl">
            <div className="flex justify-center">
              <div className="relative flex items-center justify-center h-16 w-16">
                <div className="animate-spin absolute h-16 w-16 border-4 border-blue-500 border-t-transparent rounded-full opacity-20"></div>
                <div className="animate-spin h-10 w-10 border-4 border-blue-400 border-t-transparent rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
              </div>
            </div>
            <div>
              <h3 className="text-white font-black text-xl mb-2">{saveStatus}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Menyimpan perbandingan seluruh kriteria dan menghitung ranking akhir properti...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
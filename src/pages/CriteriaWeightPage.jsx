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
    <div className="py-5 border-b border-slate-700/50 last:border-b-0">
      <div className="flex items-center gap-5">
        <span
          className={`w-32 text-right text-sm font-semibold shrink-0 transition-colors duration-150 ${pos < 4 ? "text-blue-400" : "text-slate-400"}`}
        >
          {left.criteria_name}
        </span>

        <div className="flex-1">
          <div className="flex justify-between mb-3 px-0.5">
            {SCALE_LABELS.map((label, i) => (
              <span
                key={i}
                className={`w-6 h-6 flex items-center justify-center text-[11px] font-bold rounded-md transition-all ${i === pos ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : i < 4 ? "text-blue-400/50" : "text-slate-600"}`}
              >
                {label}
              </span>
            ))}
          </div>

          <div className="relative flex items-center">
            <div
              className="absolute left-0 h-1.5 rounded-l-full bg-blue-600/70 pointer-events-none transition-all"
              style={{ width: `${(pos / 8) * 100}%` }}
            />
            <div
              className="absolute right-0 h-1.5 rounded-r-full bg-slate-600/40 pointer-events-none transition-all"
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
              className="relative w-full h-1.5 bg-transparent appearance-none cursor-pointer z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-slate-900 [&::-webkit-slider-thumb]:cursor-grab"
            />
          </div>

          <p className="text-center text-xs mt-3 font-medium">
            <span className="text-blue-400 font-bold">{dominantName}</span>
            <span className="text-slate-500">
              {" "}
              {times === 1
                ? "sama penting dengan"
                : `${times}x lebih penting dari`}{" "}
            </span>
            <span className="text-slate-400 font-semibold">
              {pos === 4 ? right.criteria_name : subordinateName}
            </span>
          </p>
        </div>

        <span
          className={`w-32 text-left text-sm font-semibold shrink-0 transition-colors duration-150 ${pos > 4 ? "text-blue-400" : "text-slate-400"}`}
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

  // 1. Ambil Kriteria & Muat memori slider saat halaman dibuka
  useEffect(() => {
    // Ambil state terakhir dari LocalStorage agar slider tidak balik ke tengah
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
    // Jika data kriteria dan bobot sudah ter-load, lakukan auto-validasi
    if (isInitialLoad.current && criteria.length >= 2 && weights.length > 0) {
      setCRResult(calculateCR(criteria, slidersRef.current, weights));
      isInitialLoad.current = false; // Kunci agar tidak auto-validasi terus saat slider digeser
    }
  }, [criteria, weights]);

  const handleValidate = () => {
    setValidating(true);
    setTimeout(() => {
      setCRResult(calculateCR(criteria, sliders, weights));
      setValidating(false);
    }, 350);
  };

  // 2. Simpan ke Backend dan LocalStorage secara bersamaan
  const autoSaveData = async () => {
    if (criteria.length < 2) return true;

    // Simpan ingatan ke browser cache
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

      // Simpan ke database
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

    // Jika arah navigasinya adalah ke langkah selanjutnya (alternatives)
    if (path.includes("alternatives")) {
      try {
        await updateCaseStep(caseId, 3); // Update database ke step 3
      } catch (err) {
        console.error("Gagal update step", err);
      }
    }

    navigate(path);
  };

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <StepNav caseId={caseId} currentStep={2} />

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl">⚖️</span>
              <h1 className="text-xl font-semibold text-white">
                Langkah 2: Perbandingan Skala Kriteria
              </h1>
              {saveStatus && (
                <span
                  className={`text-xs px-2 py-1 rounded-full ${saveStatus.includes("Gagal") ? "bg-red-500/20 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}
                >
                  {isSaving
                    ? "⏳ "
                    : saveStatus.includes("Gagal")
                      ? "⚠ "
                      : "✓ "}
                  {saveStatus}
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm ml-10">
              Skala ini digunakan AHP untuk menentukan bobot kriteria — data
              tersimpan otomatis.
            </p>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-blue-400 text-base shrink-0 mt-0.5">💡</span>
          <p className="text-blue-300 text-sm">
            Bobot dari AHP akan otomatis digunakan oleh semua metode lainnya.
          </p>
        </div>

        {crResult && (
          <div
            className={`rounded-xl px-4 py-3.5 border flex items-start gap-3 ${crResult.isValid ? "bg-emerald-500/10 border-emerald-500/25" : "bg-red-500/10 border-red-500/25"}`}
          >
            <span
              className={`text-lg shrink-0 font-bold ${crResult.isValid ? "text-emerald-400" : "text-red-400"}`}
            >
              {crResult.isValid ? "✓" : "✕"}
            </span>
            <div>
              <p
                className={`text-sm font-semibold ${crResult.isValid ? "text-emerald-300" : "text-red-300"}`}
              >
                Consistency Ratio (CR) = {crResult.cr}
              </p>
              <p
                className={`text-xs mt-0.5 ${crResult.isValid ? "text-emerald-400/70" : "text-red-400/70"}`}
              >
                {crResult.isValid
                  ? "Matriks konsisten (CR ≤ 0.1). Anda bisa melanjutkan."
                  : "Matriks tidak konsisten (CR > 0.1). Silakan sesuaikan perbandingan di bawah."}
              </p>
            </div>
          </div>
        )}

        {criteria.length < 2 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 text-sm">
              Tambahkan minimal 2 kriteria terlebih dahulu.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => handleNavigate(`/criteria/${caseId}`)}
            >
              ← Kembali ke Kriteria
            </Button>
          </div>
        ) : (
          <div className="border border-slate-700/60 rounded-xl px-6 divide-y divide-slate-700/40">
            {pairs.map(([a, b]) => {
              const id1 = getId(a),
                id2 = getId(b);
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

        {weights.length > 0 && criteria.length >= 2 && (
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
              Preview Bobot Kriteria
            </p>
            <div className="space-y-2.5">
              {criteria.map((c, i) => (
                <div key={getId(c)} className="flex items-center gap-3">
                  <span className="text-slate-400 text-sm w-36 shrink-0 truncate">
                    {c.criteria_name}
                  </span>
                  <div className="flex-1 bg-slate-700/50 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${((weights[i] ?? 0) * 100).toFixed(1)}%`,
                      }}
                    />
                  </div>
                  <span className="text-blue-400 font-mono text-sm w-14 text-right">
                    {((weights[i] ?? 0) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={() => handleNavigate(`/criteria/${caseId}`)}
        >
          ← Kembali
        </Button>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleValidate}
            loading={validating}
          >
            Validasi Konsistensi
          </Button>
          <Button
            onClick={() => handleNavigate(`/alternatives/${caseId}`)}
            disabled={!crResult?.isValid}
          >
            Lanjut →
          </Button>
        </div>
      </div>
    </div>
  );
}

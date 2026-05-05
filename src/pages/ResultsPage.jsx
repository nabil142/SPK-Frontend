import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getResults,
  calculateSAW,
  calculateSMART,
  calculateWP,
  calculateTOPSIS,
  calculateAHPRanking,
  updateCaseStep,
} from "../services/api";

import Button from "../components/Button";
import StepNav from "../components/StepNav";

const METHODS = [
  {
    id: "SAW",
    name: "SAW",
    desc: "Simple Additive Weighting (Penjumlahan Terbobot)",
  },
  { id: "WP", name: "WP", desc: "Weighted Product (Perkalian Terbobot)" },
  {
    id: "TOPSIS",
    name: "TOPSIS",
    desc: "Jarak ke Solusi Ideal Positif & Negatif",
  },
  {
    id: "SMART",
    name: "SMART",
    desc: "Simple Multi-Attribute Rating Technique",
  },
  {
    id: "AHP",
    name: "AHP",
    desc: "Analytic Hierarchy Process (Berdasarkan Skala Alternatif)",
  },
];

export default function ResultsPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMethod, setActiveMethod] = useState("SAW");

  useEffect(() => {
    const fetchAndCalculate = async () => {
      setLoading(true);
      setData([]);

      try {
        // 1. Eksekusi kalkulasi di backend agar tersimpan ke Database
        if (activeMethod === "SAW") {
          await calculateSAW(caseId);
        } else if (activeMethod === "SMART") {
          await calculateSMART(caseId);
        } else if (activeMethod === "WP") {
          await calculateWP(caseId);
        } else if (activeMethod === "TOPSIS") {
          await calculateTOPSIS(caseId);
        } else if (activeMethod === "AHP") {
          await calculateAHPRanking(caseId);
        }

        // 2. Ambil hasil akhir dari database menggunakan method sebagai parameter query
        const res = await getResults(caseId, activeMethod);

        // Memastikan pengambilan data sesuai struktur response
        const rawData = res.data?.data || res.data || [];

        // Urutkan berdasarkan skor tertinggi ke terendah
        const sortedData = [...rawData].sort(
          (a, b) => Number(b.score) - Number(a.score),
        );

        setData(sortedData);

        // 3. JIKA BERHASIL MENDAPATKAN DATA, UPDATE STEP KE 6 (SELESAI)
        if (sortedData.length > 0) {
          await updateCaseStep(caseId, 6);
        }
      } catch (err) {
        console.error("Gagal sinkronisasi hasil:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    if (caseId) fetchAndCalculate();
  }, [caseId, activeMethod]);

  const getRankBadge = (index) => {
    if (index === 0)
      return (
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 font-bold text-sm shadow-lg shadow-amber-500/10">
          1
        </span>
      );
    if (index === 1)
      return (
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-300/20 text-slate-300 border border-slate-300/30 font-bold text-sm">
          2
        </span>
      );
    if (index === 2)
      return (
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-700/20 text-orange-400 border border-orange-700/30 font-bold text-sm">
          3
        </span>
      );
    return (
      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 text-slate-500 font-bold text-sm">
        {index + 1}
      </span>
    );
  };

  const activeMethodDesc = METHODS.find((m) => m.id === activeMethod)?.desc;

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <StepNav caseId={caseId} currentStep={6} />

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">🏆</span>
            <h1 className="text-2xl font-bold text-white">
              Hasil Analisis SPK
            </h1>
          </div>
          <p className="text-slate-500 text-sm ml-10">
            Peringkat alternatif berdasarkan metode yang dipilih. Data dihitung
            secara otomatis.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          Buka Dashboard
        </Button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Pilih Metode Perhitungan
          </p>
          <div className="flex gap-2 flex-wrap">
            {METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveMethod(m.id)}
                disabled={loading}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                  activeMethod === m.id
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-500/50"
                    : "bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200 disabled:opacity-50"
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
          <p className="text-slate-500 text-xs mt-3 bg-slate-800/50 inline-block px-3 py-1.5 rounded-lg border border-slate-700/50">
            ℹ️ <strong>Metode {activeMethod}:</strong> {activeMethodDesc}
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 border border-slate-800 border-dashed rounded-xl bg-slate-900/50">
            <svg
              className="animate-spin w-8 h-8 text-blue-500 mb-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            <p className="text-blue-400 font-medium">
              Menghitung matriks {activeMethod}...
            </p>
            <p className="text-slate-500 text-xs mt-1">
              Sistem sedang memproses bobot dan nilai alternatif
            </p>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {data && data.length > 0 ? (
              <>
                <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-900 border border-amber-500/30 rounded-2xl p-6 md:p-8 flex items-center gap-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10 blur-xl pointer-events-none">
                    <div className="w-32 h-32 bg-amber-500 rounded-full"></div>
                  </div>

                  <div className="text-5xl md:text-7xl drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                    🥇
                  </div>
                  <div className="z-10">
                    <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-1">
                      Rekomendasi Terbaik
                    </p>
                    <h2 className="text-2xl md:text-3xl font-black text-white">
                      {data[0].alternative_name}
                    </h2>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-lg text-sm font-mono font-bold">
                        Skor Akhir: {Number(data[0].score).toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-700/60 rounded-xl overflow-hidden bg-slate-900/50">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-800/80 border-b border-slate-700 text-slate-400 uppercase tracking-wider text-xs">
                      <tr>
                        <th className="px-6 py-4 w-24 text-center font-semibold">
                          Peringkat
                        </th>
                        <th className="px-6 py-4 font-semibold">
                          Alternatif Properti
                        </th>
                        <th className="px-6 py-4 font-semibold text-right">
                          Skor Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {data.map((row, i) => (
                        <tr
                          key={i}
                          className={`hover:bg-slate-800/30 transition-colors ${i === 0 ? "bg-amber-500/5" : ""}`}
                        >
                          <td className="px-6 py-3 flex justify-center">
                            {getRankBadge(i)}
                          </td>
                          <td className="px-6 py-3">
                            <span
                              className={`font-semibold ${i === 0 ? "text-amber-400" : "text-slate-200"}`}
                            >
                              {row.alternative_name}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right">
                            <span
                              className={`font-mono font-medium ${i === 0 ? "text-amber-400" : "text-blue-400"}`}
                            >
                              {Number(row.score).toFixed(4)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="text-center py-12 border border-slate-800 border-dashed rounded-xl">
                <span className="text-4xl">📭</span>
                <p className="text-slate-400 mt-3 font-medium">
                  Belum ada data untuk dihitung.
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  Pastikan Anda sudah mengisi Nilai Alternatif dan Bobot
                  Kriteria.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate(`/values/${caseId}`)}
                >
                  ← Kembali ke Nilai
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

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
import StepNav from "../components/stepnav";

// Modern SVG Icons
const Icons = {
  Trophy: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>,
  Layout: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>,
  Info: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12.01" y2="16"></line><line x1="12" y1="12" x2="12" y2="8"></line></svg>,
  Medal: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6.1 2h11.8a2 2 0 0 1 1.7.8l1.61 2.14a2 2 0 0 1 .13 2.2L16.79 15"></path><path d="M11 12 5.12 2.2"></path><path d="m13 12 5.88-9.8"></path><path d="M8 7h8"></path><circle cx="12" cy="17" r="5"></circle><path d="M12 18v-2"></path></svg>
};

const METHODS = [
  { id: "SAW", name: "SAW", desc: "Simple Additive Weighting (Penjumlahan Terbobot)" },
  { id: "WP", name: "WP", desc: "Weighted Product (Perkalian Terbobot)" },
  { id: "TOPSIS", name: "TOPSIS", desc: "Jarak ke Solusi Ideal Positif & Negatif" },
  { id: "SMART", name: "SMART", desc: "Simple Multi-Attribute Rating Technique" },
  { id: "AHP", name: "AHP", desc: "Analytic Hierarchy Process (Matriks Alternatif)" },
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
        if (activeMethod === "SAW") await calculateSAW(caseId);
        else if (activeMethod === "SMART") await calculateSMART(caseId);
        else if (activeMethod === "WP") await calculateWP(caseId);
        else if (activeMethod === "TOPSIS") await calculateTOPSIS(caseId);
        else if (activeMethod === "AHP") await calculateAHPRanking(caseId);

        const res = await getResults(caseId, activeMethod);
        const rawData = res.data?.data || res.data || [];

        const sortedData = [...rawData].sort(
          (a, b) => Number(b.score) - Number(a.score),
        );

        setData(sortedData);

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
    const baseClasses = "flex items-center justify-center w-9 h-9 rounded-xl font-black text-sm shadow-lg transition-transform hover:scale-110";
    if (index === 0)
      return (
        <span className={`${baseClasses} bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 border border-amber-300 shadow-amber-500/20`}>
          1
        </span>
      );
    if (index === 1)
      return (
        <span className={`${baseClasses} bg-gradient-to-br from-slate-300 to-slate-500 text-slate-900 border border-slate-200 shadow-slate-400/10`}>
          2
        </span>
      );
    if (index === 2)
      return (
        <span className={`${baseClasses} bg-gradient-to-br from-orange-500 to-orange-700 text-white border border-orange-400 shadow-orange-600/10`}>
          3
        </span>
      );
    return (
      <span className={`${baseClasses} bg-slate-800 text-slate-400 border border-slate-700`}>
        {index + 1}
      </span>
    );
  };

  const activeMethodDesc = METHODS.find((m) => m.id === activeMethod)?.desc;

  return (
    <div className="relative min-h-full p-6 md:p-10 max-w-6xl mx-auto space-y-10">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10">
        <StepNav caseId={caseId} currentStep={6} />
      </div>

      {/* HEADER SECTION */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/20 border border-amber-300/30">
              <Icons.Trophy />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight leading-none">
                Hasil Analisis SPK
              </h1>
              <p className="text-slate-500 text-sm mt-1 font-medium">
                Peringkat alternatif berdasarkan kalkulasi multi-metode
              </p>
            </div>
          </div>
        </div>
        <Button 
          variant="ghost" 
          onClick={() => navigate("/dashboard")}
          className="bg-slate-800/50 hover:bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-2"
        >
          <Icons.Layout /> Kembali ke Dashboard
        </Button>
      </div>

      {/* MAIN CONTENT CARD */}
      <div className="relative z-10 bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-[2.5rem] p-6 md:p-10 shadow-2xl space-y-10">
        
        {/* METHOD SELECTOR */}
        <div className="space-y-5">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] ml-1">
            Engine Perhitungan
          </p>
          <div className="flex gap-2.5 flex-wrap">
            {METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveMethod(m.id)}
                disabled={loading}
                className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 border ${
                  activeMethod === m.id
                    ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/30 -translate-y-0.5"
                    : "bg-slate-800/50 border-slate-700 text-slate-500 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-50"
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-3.5 backdrop-blur-sm">
            <span className="text-blue-400"><Icons.Info /></span>
            <p className="text-slate-400 text-xs font-medium leading-relaxed">
              <strong className="text-slate-200 uppercase tracking-wide mr-1">Metode {activeMethod}:</strong> 
              {activeMethodDesc}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 rounded-[2rem] bg-slate-950/30 border border-slate-800/50 border-dashed animate-pulse">
            <div className="relative flex items-center justify-center mb-6">
               <div className="absolute w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
               <Icons.Medal />
            </div>
            <p className="text-blue-400 font-black tracking-widest uppercase text-xs">Processing Algorithm...</p>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {data && data.length > 0 ? (
              <>
                {/* WINNER SPOTLIGHT CARD */}
                <div className="group relative bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent border-2 border-amber-500/30 rounded-[2rem] p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 overflow-hidden shadow-2xl shadow-amber-500/5">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-[60px] group-hover:bg-amber-500/20 transition-colors duration-500"></div>
                  
                  <div className="text-7xl md:text-8xl select-none animate-bounce-slow">
                    🥇
                  </div>
                  
                  <div className="text-center md:text-left flex-1">
                    <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                      <Icons.Medal /> Best Recommendation
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-sm mb-3">
                      {data[0].alternative_name}
                    </h2>
                    <div className="flex items-center justify-center md:justify-start  gap-3">
                      <div className="bg-slate-950/80 backdrop-blur px-5 py-2.5 rounded-2xl border border-amber-500/20 shadow-inner">
                        <span className="text-slate-500 text-[10px] font-bold uppercase block tracking-tighter">Final Score</span>
                        <span className="text-amber-400 font-mono text-2xl font-black tracking-wider">
                          {Number(data[0].score).toFixed(4)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RANKING LIST TABLE */}
                <div className="space-y-4">
                   <h3 className="text-slate-300 text-xs font-bold uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Full Ranking Table
                   </h3>
                   <div className="border border-slate-800 rounded-[2rem] overflow-hidden bg-slate-950/30 backdrop-blur-sm">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-500 uppercase tracking-widest text-[10px] font-black">
                          <th className="px-8 py-5 w-32 text-center">Rank</th>
                          <th className="px-6 py-5 text-left font-black">Alternative</th>
                          <th className="px-8 py-5 text-right w-40 font-black">Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {data.map((row, i) => (
                          <tr
                            key={i}
                            className={`group hover:bg-slate-800/40 transition-all duration-300 ${i === 0 ? "bg-amber-500/[0.03]" : ""}`}
                          >
                            <td className="px-8 py-4">
                              <div className="flex justify-center">
                                {getRankBadge(i)}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-base font-bold tracking-tight transition-colors duration-300 ${i === 0 ? "text-amber-400" : "text-slate-300 group-hover:text-white"}`}>
                                {row.alternative_name}
                              </span>
                            </td>
                            <td className="px-8 py-4 text-right">
                              <span className={`font-mono text-base font-bold ${i === 0 ? "text-amber-400" : "text-blue-400"}`}>
                                {Number(row.score).toFixed(4)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-20 bg-slate-950/30 border border-slate-800 border-dashed rounded-[2.5rem]">
                <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 opacity-50 grayscale">
                   <Icons.Trophy />
                </div>
                <h3 className="text-xl text-white font-bold mb-2">Data Tidak Ditemukan</h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">
                  Matriks keputusan belum lengkap atau kriteria belum dikonfigurasi dengan benar.
                </p>
                <Button
                  variant="outline"
                  className="mt-8 border-slate-700 text-slate-400 hover:text-white"
                  onClick={() => navigate(`/values/${caseId}`)}
                >
                  ← Lengkapi Nilai Matriks
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* FOOTER INFO */}
      <p className="text-center text-slate-600 text-[10px] font-bold uppercase tracking-widest animate-pulse">
        System Synchronized • Method Engine: {activeMethod}
      </p>
    </div>
  );
}
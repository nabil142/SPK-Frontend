
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import PrivateRoute from './components/PrivateRoute'
import MainLayout from './layouts/MainLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import CriteriaPage from './pages/CriteriaPage'
import CriteriaWeightPage from './pages/CriteriaWeightPage'
import AlternativesPage from './pages/AlternativesPage'
import ValuesPage from './pages/ValuesPage'
import AltComparisonPage from './pages/AltComparisonPage'
import ResultsPage from './pages/ResultsPage'

// Alur: Kriteria → Pembobotan Kriteria → Alternatif → Nilai Alternatif → Perbandingan Alt/AHP → Hasil
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            {/* Step 1 */}
            <Route path="criteria/:caseId" element={<CriteriaPage />} />
            {/* Step 2 - Pembobotan Kriteria dengan Skala (dipakai SEMUA metode) */}
            <Route path="criteria-weight/:caseId" element={<CriteriaWeightPage />} />
            {/* Step 3 */}
            <Route path="alternatives/:caseId" element={<AlternativesPage />} />
            {/* Step 4 - Nilai Alternatif (SAW, WP, TOPSIS, SMART bisa hitung di sini) */}
            <Route path="values/:caseId" element={<ValuesPage />} />
            {/* Step 5 - Perbandingan Alternatif per Kriteria (khusus AHP) */}
            <Route path="alt-comparison/:caseId" element={<AltComparisonPage />} />
            {/* Step 6 - Hasil semua metode */}
            <Route path="results/:caseId" element={<ResultsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

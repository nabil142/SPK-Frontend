import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom'

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

// 🔥 SESUAI NAMA FILE ASLI
import MLPage from './pages/MLPages'

export default function App() {

  return (

    <AuthProvider>

      <Router>

        <Routes>

          {/* ─────────────────────────────
              LOGIN
          ───────────────────────────── */}
          <Route
            path="/login"
            element={<LoginPage />}
          />

          {/* ─────────────────────────────
              PRIVATE ROUTE
          ───────────────────────────── */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            }
          >

            {/* DEFAULT */}
            <Route
              index
              element={
                <Navigate
                  to="/dashboard"
                  replace
                />
              }
            />

            {/* DASHBOARD */}
            <Route
              path="dashboard"
              element={<DashboardPage />}
            />

            {/* ─────────────────────────────
                SPK PER CASE
            ───────────────────────────── */}

            <Route
              path="criteria/:caseId"
              element={<CriteriaPage />}
            />

            <Route
              path="criteria-weight/:caseId"
              element={<CriteriaWeightPage />}
            />

            <Route
              path="alternatives/:caseId"
              element={<AlternativesPage />}
            />

            <Route
              path="values/:caseId"
              element={<ValuesPage />}
            />

            <Route
              path="alt-comparison/:caseId"
              element={<AltComparisonPage />}
            />

            <Route
              path="results/:caseId"
              element={<ResultsPage />}
            />

            {/* ─────────────────────────────
                MACHINE LEARNING GLOBAL
            ───────────────────────────── */}
            <Route
              path="ml"
              element={<MLPage />}
            />

          </Route>

          {/* ─────────────────────────────
              FALLBACK
          ───────────────────────────── */}
          <Route
            path="*"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

        </Routes>

      </Router>

    </AuthProvider>
  )
}
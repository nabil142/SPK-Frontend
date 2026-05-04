import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000/api/',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('spk_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('spk_token')
      localStorage.removeItem('spk_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth
export const login = (data) => api.post('/login', data)
export const logout = () => api.post('/logout')

// Projects
export const getProjects = () => api.get('/projects')
export const getProject = (id) => api.get('/projects/' + id)
export const createProject = (data) => api.post('/projects', data)
export const updateProject = (id, data) => api.put('/projects/' + id, data)
export const deleteProject = (id) => api.delete('/projects/' + id)

// Step 1 - Kriteria
export const getCriteria = (caseId) => api.get('/criteria?case_id=' + caseId)
export const createCriteria = (data) => api.post('/criteria', data)
export const updateCriteria = (id, data) => api.put('/criteria/' + id, data)
export const deleteCriteria = (id) => api.delete('/criteria/' + id)

// Step 2 - Pembobotan Kriteria (Skala Perbandingan Berpasangan)
// Dipakai SEMUA metode: AHP, SAW, WP, TOPSIS, SMART
export const getCriteriaComparisons = (caseId) => api.get('/criteria-comparisons?case_id=' + caseId)
export const saveCriteriaComparisons = (data) => api.post('/criteria-comparisons', data)
export const validateCriteriaConsistency = (caseId) => api.post('/criteria-comparisons/validate', { case_id: caseId })

// Step 3 - Alternatif
export const getAlternatives = (caseId) => api.get('/alternatives?case_id=' + caseId)
export const createAlternative = (data) => api.post('/alternatives', data)
export const updateAlternative = (id, data) => api.put('/alternatives/' + id, data)
export const deleteAlternative = (id) => api.delete('/alternatives/' + id)

// Step 4 - Nilai Alternatif (matriks alt x kriteria)
// Setelah ini SAW, WP, TOPSIS, SMART sudah bisa dihitung
export const getValues = (caseId) => api.get('/values?case_id=' + caseId)
export const saveValues = (data) => api.post('/values', data)

// Step 5 - Perbandingan Alternatif per Kriteria (KHUSUS AHP)
export const getAltComparisons = (caseId) => api.get('/alt-comparisons?case_id=' + caseId)
export const saveAltComparisons = (data) => api.post('/alt-comparisons', data)
export const validateAltConsistency = (caseId) => api.post('/alt-comparisons/validate', { case_id: caseId })

// Step 6 - Hitung & Hasil
export const calculate = (caseId) => api.post('/calculate', { case_id: caseId })
export const getResults = (caseId) => api.get('/results?case_id=' + caseId)
export const predictML = (caseId) => api.post('/predict', { case_id: caseId })

export default api
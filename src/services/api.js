import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("spk_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// =====================================================
// AUTH
// =====================================================

export const login = (data) => api.post("/auth/login", data);

// =====================================================
// CASES
// =====================================================

export const getCases = () => api.get("/cases");
export const getCase = (id) => api.get(`/cases/${id}`);
export const createCase = (data) => api.post("/cases", data);
export const updateCase = (id, data) => api.put(`/cases/${id}`, data);
export const deleteCase = (id) => api.delete(`/cases/${id}`);


// =====================================================
// CRITERIA
// =====================================================

export const getCriteria = (caseId) => api.get(`/criteria/${caseId}`);
export const createCriteria = (data) => api.post("/criteria", data);
export const updateCriteria = (id, data) => api.put(`/criteria/${id}`, data);
export const deleteCriteria = (id) => api.delete(`/criteria/${id}`);


// =====================================================
// ALTERNATIVES
// =====================================================

export const getAlternatives = (caseId) => api.get(`/alternatives/${caseId}`);
export const createAlternative = (data) => api.post("/alternatives", data);
export const updateAlternative = (id, data) => api.put(`/alternatives/${id}`, data);
export const deleteAlternative = (id) => api.delete(`/alternatives/${id}`);


// =====================================================
// VALUES (MATRIX)
// =====================================================

export const getValues = (caseId) => api.get(`/values/${caseId}`);
export const saveValues = (data) => api.post("/values", data);


// =====================================================
// AHP (CRITERIA COMPARISON)
// =====================================================

export const saveCriteriaComparisons = (data) =>
  api.post("/spk/ahp/comparisons", data);

export const calculateAHP = (caseId) =>
  api.post(`/spk/ahp/calculate/${caseId}`);


// =====================================================
// AHP (ALTERNATIVE COMPARISON - PURE AHP)
// =====================================================

export const saveAltComparisons = (data) =>
  api.post("/spk/ahp/alternative-comparisons", data);

export const calculateAHPRanking = (caseId) =>
  api.post(`/spk/ahp/calculate-ranking/${caseId}`);


// =====================================================
// SPK HYBRID METHODS
// =====================================================

export const calculateSAW = (caseId) =>
  api.post(`/spk/saw/${caseId}`);

export const calculateSMART = (caseId) =>
  api.post(`/spk/smart/${caseId}`);

export const calculateWP = (caseId) =>
  api.post(`/spk/wp/${caseId}`);

export const calculateTOPSIS = (caseId) =>
  api.post(`/spk/topsis/${caseId}`);


// =====================================================
// RESULTS
// =====================================================

export const getResults = (caseId, method = "SAW") =>
  api.get(`/spk/results/${caseId}?method=${method}`);


// =====================================================
// MACHINE LEARNING DATASET
// =====================================================

export const getDataset = (caseId, method = "SAW") =>
  api.get(`/ml/dataset/${caseId}?method=${method}`);

export default api;
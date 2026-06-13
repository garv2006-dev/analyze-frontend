import axios from 'axios';

// Dynamically use proxy target or direct host fallback
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000, // Playwright capture + AI analysis might take up to 30-40s in high network latency conditions
  headers: {
    'Content-Type': 'application/json',
  }
});

// Axios Request Interceptor to dynamically inject the JWT Access Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Helper to extract meaningful user-facing messages from axios catches
 */
function parseError(error) {
  if (error.response) {
    return new Error(
      error.response.data?.error || 
      error.response.data?.message || 
      error.response.data?.detail || 
      'Server error occurred'
    );
  } else if (error.request) {
    return new Error('No response received from the automation server. Make sure the backend service is running.');
  } else {
    return new Error(error.message || 'API client network request failure');
  }
}

// ─── Authentication Endpoints ──────────────────────────────────────────

export async function registerUser(name, email, password) {
  try {
    const response = await api.post('/api/auth/register', { name, email, password });
    return response.data;
  } catch (error) {
    console.error('❌ Registration failed:', error.message);
    throw parseError(error);
  }
}

export async function loginUser(email, password) {
  try {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    throw parseError(error);
  }
}

export async function getMe() {
  try {
    const response = await api.get('/api/auth/me');
    return response.data;
  } catch (error) {
    console.error('❌ Fetching current profile failed:', error.message);
    throw parseError(error);
  }
}

// ─── Target URL Management ─────────────────────────────────────────────

export async function getTargetUrl() {
  try {
    const response = await api.get('/api/target-url/');
    return response.data;
  } catch (error) {
    console.error('❌ Fetching target URL failed:', error.message);
    throw parseError(error);
  }
}

export async function createTargetUrl(url, intervalMinutes = 5) {
  try {
    const response = await api.post('/api/target-url/', { 
      url, 
      interval_minutes: parseInt(intervalMinutes, 10) 
    });
    return response.data;
  } catch (error) {
    console.error('❌ Configuring target URL failed:', error.message);
    throw parseError(error);
  }
}

export async function deleteTargetUrl() {
  try {
    const response = await api.delete('/api/target-url/');
    return response.data;
  } catch (error) {
    console.error('❌ Deleting target URL failed:', error.message);
    throw parseError(error);
  }
}

// ─── Schedule & Monitoring Control ─────────────────────────────────────

export async function getMonitoringStatus() {
  try {
    const response = await api.get('/api/monitoring/status');
    return response.data;
  } catch (error) {
    console.error('❌ Fetching monitoring status failed:', error.message);
    throw parseError(error);
  }
}

export async function updateMonitoringStatus(statusStr) {
  try {
    const response = await api.post('/api/monitoring/status', { status: statusStr });
    return response.data;
  } catch (error) {
    console.error('❌ Updating monitoring status failed:', error.message);
    throw parseError(error);
  }
}

// ─── Predictions Endpoints ─────────────────────────────────────────────

export async function getPredictions(page = 1, pageSize = 10, limit = null, symbol = null) {
  try {
    const url = `/api/predictions?page=${page}&page_size=${pageSize}`;
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('❌ Failed fetching predictions:', error.message);
    throw parseError(error);
  }
}

export async function getPredictionById(id) {
  try {
    const response = await api.get(`/api/predictions/${id}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed fetching prediction detail for ID ${id}:`, error.message);
    throw parseError(error);
  }
}

export async function deletePrediction(id) {
  try {
    const response = await api.delete(`/api/predictions/${id}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed deleting prediction ID ${id}:`, error.message);
    throw parseError(error);
  }
}

export async function bulkDeletePredictions(ids = [], deleteAll = false) {
  try {
    const response = await api.post(`/api/predictions/bulk-delete`, {
      ids,
      delete_all: deleteAll
    });
    return response.data;
  } catch (error) {
    console.error(`❌ Failed bulk deleting predictions:`, error.message);
    throw parseError(error);
  }
}

export async function chatWithAI(messages, predictionId = null) {
  try {
    const response = await api.post('/api/chat', { messages, prediction_id: predictionId });
    return response.data;
  } catch (error) {
    console.error('❌ AI Chat failed:', error.message);
    throw parseError(error);
  }
}

export async function triggerAnalysis() {
  try {
    const response = await api.post('/api/predictions/trigger', {});
    return response.data;
  } catch (error) {
    console.error('❌ Manual analysis trigger failed:', error.message);
    throw parseError(error);
  }
}

// Keep legacy triggerAllAnalysis and watchlists mapping as mock call to prevent visual reference exceptions
export async function triggerAllAnalysis() {
  return { success: true, total: 1, completed: 1, results: [] };
}

export async function getSavedAssets() {
  return { success: true, data: [] };
}

export async function createSavedAsset() {
  return { success: true, data: {} };
}

export async function deleteSavedAsset() {
  return { success: true, message: 'Deleted' };
}

export async function getSchedulerSettings() {
  return { success: true, interval_minutes: 1 };
}

export async function updateSchedulerSettings() {
  return { success: true, interval_minutes: 1 };
}

// ─── Auditing Logs & Rate Limit Stats ──────────────────────────────────

export async function getAuditLogs(page = 1, pageSize = 20, eventType = 'ALL', search = '') {
  try {
    let url = `/api/logs?page=${page}&page_size=${pageSize}`;
    if (eventType && eventType !== 'ALL') {
      url += `&event_type=${eventType}`;
    }
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('❌ Failed fetching audit logs:', error.message);
    throw parseError(error);
  }
}

export async function getRateLimitStats() {
  try {
    const response = await api.get('/api/rate-limit-stats/');
    return response.data;
  } catch (error) {
    console.error('❌ Failed fetching rate limit statistics:', error.message);
    throw parseError(error);
  }
}

import axios from 'axios';

// Dynamically use proxy target or direct host fallback
const API_BASE_URL = ''; // Empty string lets Vite config proxy serve it in development

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000, // Playwright capture + AI analysis might take up to 30-40s in high network latency conditions
  headers: {
    'Content-Type': 'application/json',
  }
});

/**
 * Fetch predictions from backend
 * @param {number} limit - maximum logs to retrieve
 */
export async function getPredictions(limit = 50) {
  try {
    const response = await api.get(`/api/predictions?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed fetching predictions:', error.message);
    throw parseError(error);
  }
}

/**
 * Fetch detailed metrics for a single prediction ID
 * @param {number|string} id - prediction primary key
 */
export async function getPredictionById(id) {
  try {
    const response = await api.get(`/api/predictions/${id}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed fetching prediction detail for ID ${id}:`, error.message);
    throw parseError(error);
  }
}

/**
 * Manually trigger an on-demand browser screenshot capture and AI analysis cycle
 */
export async function triggerAnalysis() {
  try {
    const response = await api.post('/api/predictions/trigger');
    return response.data;
  } catch (error) {
    console.error('❌ Manual analysis trigger failed:', error.message);
    throw parseError(error);
  }
}

/**
 * Helper to extract meaningful user-facing messages from axios catches
 */
function parseError(error) {
  if (error.response) {
    // Server responded with non-2xx status
    return new Error(error.response.data?.error || error.response.data?.message || 'Server error occurred');
  } else if (error.request) {
    // Request was made but no response received
    return new Error('No response received from the automation server. Make sure the backend service is running.');
  } else {
    // Something else went wrong setting up the request
    return new Error(error.message || 'API client network request failure');
  }
}

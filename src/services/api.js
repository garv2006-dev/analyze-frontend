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
 * Fetch predictions from backend supporting paginated results
 * @param {number} page - the page number to fetch
 * @param {number} pageSize - the count of records per page
 * @param {number|null} limit - optional limit for backward compatibility
 */
export async function getPredictions(page = 1, pageSize = 10, limit = null) {
  try {
    const url = limit 
      ? `/api/predictions?limit=${limit}` 
      : `/api/predictions?page=${page}&page_size=${pageSize}`;
    const response = await api.get(url);
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
 * Delete a prediction record by its primary key
 * @param {number|string} id - prediction ID
 */
export async function deletePrediction(id) {
  try {
    const response = await api.delete(`/api/predictions/${id}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed deleting prediction ID ${id}:`, error.message);
    throw parseError(error);
  }
}

/**
 * Send messages to the AI assistant agent, incorporating latest chart parameters
 * @param {Array} messages - conversation history [{role, content}]
 * @param {number|null} predictionId - optional prediction ID to focus on
 */
export async function chatWithAI(messages, predictionId = null) {
  try {
    const response = await api.post('/api/chat', { messages, prediction_id: predictionId });
    return response.data;
  } catch (error) {
    console.error('❌ AI Chat failed:', error.message);
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
    return new Error(
      error.response.data?.error || 
      error.response.data?.message || 
      error.response.data?.detail || 
      'Server error occurred'
    );
  } else if (error.request) {
    // Request was made but no response received
    return new Error('No response received from the automation server. Make sure the backend service is running.');
  } else {
    // Something else went wrong setting up the request
    return new Error(error.message || 'API client network request failure');
  }
}

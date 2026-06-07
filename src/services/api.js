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
export async function getPredictions(page = 1, pageSize = 10, limit = null, symbol = null) {
  try {
    let url = limit 
      ? `/api/predictions?limit=${limit}` 
      : `/api/predictions?page=${page}&page_size=${pageSize}`;
    if (symbol && symbol !== 'ALL') {
      url += `&symbol=${symbol}`;
    }
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
 * Bulk hide prediction records from the dashboard
 * @param {Array<number>} ids - Array of prediction IDs to hide
 * @param {boolean} deleteAll - If true, ignores ids array and hides all predictions
 */
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
export async function triggerAnalysis(targetUrl = null, stockSymbol = null) {
  try {
    const payload = {};
    if (targetUrl && typeof targetUrl === 'string') payload.target_url = targetUrl;
    if (stockSymbol && typeof stockSymbol === 'string') payload.stock_symbol = stockSymbol;
    
    const response = await api.post('/api/predictions/trigger', payload);
    return response.data;
  } catch (error) {
    console.error('❌ Manual analysis trigger failed:', error.message);
    throw parseError(error);
  }
}

/**
 * Trigger full capture + AI analysis for ALL saved watchlist assets simultaneously.
 * Returns a per-asset summary with individual success/failure status.
 */
export async function triggerAllAnalysis() {
  try {
    const response = await api.post('/api/predictions/trigger-all', {});
    return response.data;
  } catch (error) {
    console.error('❌ Trigger-all analysis failed:', error.message);
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

/**
 * Retrieve the background scheduler's active capture interval in minutes
 */
export async function getSchedulerSettings() {
  try {
    const response = await api.get('/api/predictions/scheduler-settings');
    return response.data;
  } catch (error) {
    console.error('❌ Failed fetching scheduler settings:', error.message);
    throw parseError(error);
  }
}

/**
 * Update the background scheduler's active capture interval dynamically
 * @param {number} intervalMinutes - the new interval in minutes
 */
export async function updateSchedulerSettings(settingsOrInterval) {
  try {
    const payload = typeof settingsOrInterval === 'object'
      ? settingsOrInterval
      : { interval_minutes: Number(settingsOrInterval) };
      
    const response = await api.post('/api/predictions/scheduler-settings', payload);
    return response.data;
  } catch (error) {
    console.error('❌ Failed updating scheduler settings:', error.message);
    throw parseError(error);
  }
}

// ─── Saved Assets (Persistent DB Watchlist) ───────────────────────────────────

/**
 * Fetch all saved watchlist assets from the database
 */
export async function getSavedAssets() {
  try {
    const response = await api.get('/api/assets/');
    return response.data;
  } catch (error) {
    console.error('❌ Failed fetching saved assets:', error.message);
    throw parseError(error);
  }
}

/**
 * Permanently add a new watchlist asset to the database
 * @param {string} symbol - stock/index ticker (e.g. "RELIANCE")
 * @param {string} url - chart URL to capture
 */
export async function createSavedAsset(symbol, url) {
  try {
    const response = await api.post('/api/assets/', { symbol, url });
    return response.data;
  } catch (error) {
    console.error('❌ Failed creating saved asset:', error.message);
    throw parseError(error);
  }
}

/**
 * Permanently remove a watchlist asset from the database
 * @param {string} symbol - ticker symbol to delete
 */
export async function deleteSavedAsset(symbol) {
  try {
    const response = await api.delete(`/api/assets/${symbol}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed deleting saved asset '${symbol}':`, error.message);
    throw parseError(error);
  }
}


import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, User, Sun, Moon, Zap, LogOut
} from 'lucide-react';
import { 
  registerUser, loginUser, getMe, getTargetUrl, createTargetUrl, 
  deleteTargetUrl, getMonitoringStatus, updateMonitoringStatus, 
  getPredictions, getAuditLogs, getRateLimitStats
} from './services/api';

// Import newly created modular subcomponents
import AuthShell from './components/AuthShell';
import TargetUrlManager from './components/TargetUrlManager';
import SchedulerController from './components/SchedulerController';
import RateLimitWidget from './components/RateLimitWidget';
import ScreenshotComparator from './components/ScreenshotComparator';
import CaptureGallery from './components/CaptureGallery';
import LogsPanel from './components/LogsPanel';

export default function App() {
  // Authentication States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authSuccess, setAuthSuccess] = useState(null);

  // Target URL Management States
  const [targetUrl, setTargetUrl] = useState(null);
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState(null);

  // Monitoring Scheduler States
  const [monitoringStatus, setMonitoringStatus] = useState('inactive'); // 'active' | 'inactive'
  const [isWithinHours, setIsWithinHours] = useState(true);
  const [serverTime, setServerTime] = useState('');
  const [serverTimezone, setServerTimezone] = useState('');
  const [monitoringLoading, setMonitoringLoading] = useState(false);
  const [monitoringError, setMonitoringError] = useState(null);

  // Predictions / Screenshots States
  const [predictions, setPredictions] = useState([]);
  const [predictionsLoading, setPredictionsLoading] = useState(true);
  const [predictionsError, setPredictionsError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activePrediction, setActivePrediction] = useState(null);
  const [viewMode, setViewMode] = useState('original'); // 'original' | 'highlighted'
  const [isTriggering, setIsTriggering] = useState(false);

  // Auditing Logs States
  const [auditLogs, setAuditLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  const [logFilter, setLogFilter] = useState('ALL');

  // Rate Limits States
  const [rateLimits, setRateLimits] = useState(null);

  // WS Connection Status
  const [wsStatus, setWsStatus] = useState('CONNECTING'); // CONNECTING, CONNECTED, DISCONNECTED

  // UI Theme (Default to Dark Mode for premium aesthetics)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  // Initialize and check JWT on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      bootstrapApp();
    } else {
      setIsAuthenticated(false);
      setPredictionsLoading(false);
    }
  }, []);

  // Sync theme class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Load and refresh dashboard data
  const bootstrapApp = async () => {
    try {
      setPredictionsLoading(true);
      const meData = await getMe();
      if (meData.success) {
        setUser(meData.user);
        setTargetUrl(meData.target_url);
        setIsAuthenticated(true);
        
        // Parallel data loading
        loadPredictions(1);
        loadMonitoringStatus();
        loadAuditLogs(1);
        loadRateLimitStats();
      }
    } catch (err) {
      console.error("Session bootstrap failed:", err);
      handleLogout();
    } finally {
      setPredictionsLoading(false);
    }
  };

  // Load predictions (chronological history)
  const loadPredictions = async (page = 1) => {
    try {
      const res = await getPredictions(page, 10);
      if (res.success) {
        setPredictions(res.data);
        setCurrentPage(page);
        
        // Auto-select latest prediction if none selected
        if (res.data.length > 0 && !activePrediction) {
          setActivePrediction(res.data[0]);
        }
      }
    } catch (err) {
      setPredictionsError(err.message);
    }
  };

  // Load monitoring scheduler configuration
  const loadMonitoringStatus = async () => {
    try {
      const res = await getMonitoringStatus();
      if (res.success) {
        setMonitoringStatus(res.status);
        setIsWithinHours(res.is_within_hours);
        setServerTime(res.server_time);
        setServerTimezone(res.timezone);
      }
    } catch (err) {
      console.error("Failed to load monitoring details:", err);
    }
  };

  // Load audit logs
  const loadAuditLogs = async (page = 1, eventFilter = logFilter, searchVal = logSearch) => {
    try {
      setLogsLoading(true);
      const res = await getAuditLogs(page, 15, eventFilter, searchVal);
      if (res.success) {
        setAuditLogs(res.data);
        // We only show first page of logs in custom component, paginate if needed
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLogsLoading(false);
    }
  };

  // Load rate limits
  const loadRateLimitStats = async () => {
    try {
      const res = await getRateLimitStats();
      if (res.success) {
        setRateLimits(res);
      }
    } catch (err) {
      console.error("Failed to load rate limits:", err);
    }
  };

  // Establish WebSocket connection
  useEffect(() => {
    if (!isAuthenticated) return;

    let socket = null;
    let reconnectTimeout = null;

    const connectWS = () => {
      setWsStatus('CONNECTING');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname === 'localhost' ? 'localhost:5000' : window.location.host;
      const wsUrl = `${protocol}//${host}/api/ws`;

      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        setWsStatus('CONNECTED');
        console.log("✔️ Live synchronization connection established.");
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.success && payload.type === 'NEW_PREDICTION' && payload.user_id === user?.id) {
            console.log("📡 Real-time update received:", payload.data);
            loadPredictions(1);
            loadAuditLogs(1);
            loadRateLimitStats();
            loadMonitoringStatus();
            setActivePrediction(payload.data);
          }
        } catch (err) {
          console.error("WS parse error:", err);
        }
      };

      socket.onclose = () => {
        setWsStatus('DISCONNECTED');
        reconnectTimeout = setTimeout(connectWS, 5000);
      };

      socket.onerror = (err) => {
        console.error("WS connection error:", err);
        socket.close();
      };
    };

    connectWS();

    return () => {
      if (socket) socket.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [isAuthenticated, user]);

  // Auth Operations
  const handleRegister = async (name, email, password) => {
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      const res = await registerUser(name, email, password);
      if (res.success) {
        // Automatically login the user after successful registration
        const loginRes = await loginUser(email, password);
        if (loginRes.success && loginRes.access_token) {
          localStorage.setItem('token', loginRes.access_token);
          setUser(loginRes.user);
          setIsAuthenticated(true);
          await bootstrapApp();
        } else {
          setAuthSuccess("Registration completed successfully! You can now sign in.");
        }
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (email, password) => {
    setAuthLoading(true);
    setAuthError(null);

    try {
      const res = await loginUser(email, password);
      if (res.success && res.access_token) {
        localStorage.setItem('token', res.access_token);
        setUser(res.user);
        setIsAuthenticated(true);
        await bootstrapApp();
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    setTargetUrl(null);
    setPredictions([]);
    setAuditLogs([]);
    setRateLimits(null);
  };

  // Target URL Management
  const handleSaveUrl = async (url, intervalMinutes) => {
    setUrlError(null);
    setUrlLoading(true);

    try {
      const res = await createTargetUrl(url, intervalMinutes);
      if (res.success) {
        setTargetUrl(res.data);
        loadAuditLogs(1);
      }
    } catch (err) {
      setUrlError(err.message);
    } finally {
      setUrlLoading(false);
    }
  };

  const handleDeleteUrl = async () => {
    if (!window.confirm("Are you sure you want to delete this target URL? This will also stop any active monitoring.")) return;
    
    setUrlError(null);
    setUrlLoading(true);

    try {
      const res = await deleteTargetUrl();
      if (res.success) {
        setTargetUrl(null);
        setMonitoringStatus('inactive');
        setPredictions([]);
        setActivePrediction(null);
        loadAuditLogs(1);
      }
    } catch (err) {
      setUrlError(err.message);
    } finally {
      setUrlLoading(false);
    }
  };

  // Schedule Monitoring
  const handleToggleMonitoring = async (statusToSet) => {
    setMonitoringLoading(true);
    setMonitoringError(null);

    try {
      const res = await updateMonitoringStatus(statusToSet);
      if (res.success) {
        setMonitoringStatus(res.status);
        loadAuditLogs(1);
      }
    } catch (err) {
      setMonitoringError(err.message);
      loadMonitoringStatus();
    } finally {
      setMonitoringLoading(false);
    }
  };

  // Manual Scan Trigger
  const handleTriggerManualScan = async () => {
    if (isTriggering) return;
    setIsTriggering(true);
    setPredictionsError(null);

    try {
      const res = await triggerAnalysis();
      if (res.success && res.data) {
        loadPredictions(1);
        loadAuditLogs(1);
        loadRateLimitStats();
        setActivePrediction(res.data);
      }
    } catch (err) {
      setPredictionsError(err.message);
    } finally {
      setIsTriggering(false);
    }
  };

  const handleLogFilterChange = (filter) => {
    setLogFilter(filter);
    loadAuditLogs(1, filter, logSearch);
  };

  const handleLogSearchChange = (val) => {
    setLogSearch(val);
    loadAuditLogs(1, logFilter, val);
  };

  // Loader screen on bootstrap
  if (predictionsLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <RefreshCw className="h-10 w-10 animate-spin text-cyan-500 mb-4" />
        <span className="text-sm font-semibold tracking-wider font-mono">LOADING AETHER SYSTEMS...</span>
      </div>
    );
  }

  // 1. UNAUTHENTICATED SCREEN (Form layout)
  if (!isAuthenticated) {
    return (
      <AuthShell 
        onLogin={handleLogin}
        onRegister={handleRegister}
        loading={authLoading}
        error={authError}
        success={authSuccess}
        setError={setAuthError}
        setSuccess={setAuthSuccess}
      />
    );
  }

  // 2. MAIN DASHBOARD VIEW
  return (
    <div className={`min-h-screen pb-16 transition-colors duration-200 ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
    } font-sans overflow-x-hidden`}>
      
      {/* Top Header navbar */}
      <header className={`max-w-7xl mx-auto py-5 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b ${
        theme === 'dark' ? 'border-slate-900 bg-slate-950' : 'border-slate-200 bg-white shadow-sm'
      } gap-4 relative z-40`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl shrink-0 shadow-lg">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className={`text-lg font-black tracking-wider uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Aether Monitor
            </h1>
            <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">AI Audit System Dashboard</p>
          </div>
        </div>

        {/* Global Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* User Badge */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-250 text-slate-650'
          }`}>
            <User className="h-4 w-4 text-cyan-500" />
            <span>{user?.name}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${
              user?.role === 'admin' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-slate-800 text-slate-400'
            }`}>
              {user?.role}
            </span>
          </div>

          {/* Sync badge */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-250 text-slate-650'
          }`}>
            <span className="relative flex h-2 w-2">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                wsStatus === 'CONNECTED' ? 'bg-emerald-500' : wsStatus === 'CONNECTING' ? 'bg-amber-500' : 'bg-rose-500'
              }`}></span>
            </span>
            <span className="text-[10px]">
              {wsStatus === 'CONNECTED' ? 'Live Synced' : wsStatus === 'CONNECTING' ? 'Syncing...' : 'Disconnected'}
            </span>
          </div>

          {/* Theme switcher */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`p-2 rounded-lg border transition-colors flex items-center justify-center shadow-sm ${
              theme === 'dark' ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-amber-400' : 'bg-slate-100 hover:bg-slate-200 border-slate-250 text-indigo-600'
            }`}
          >
            {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>

          {/* Log out action */}
          <button
            onClick={handleLogout}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
            title="Log Out Session"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container Grid */}
      <main className="max-w-7xl mx-auto mt-8 px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Toolbar panel */}
        <div className="space-y-6 lg:col-span-1 order-2 lg:order-1">
          <TargetUrlManager 
            targetUrl={targetUrl}
            onSaveUrl={handleSaveUrl}
            onDeleteUrl={handleDeleteUrl}
            urlLoading={urlLoading}
            urlError={urlError}
            monitoringStatus={monitoringStatus}
            theme={theme}
          />
          
          <SchedulerController 
            monitoringStatus={monitoringStatus}
            isWithinHours={isWithinHours}
            serverTime={serverTime}
            serverTimezone={serverTimezone}
            monitoringLoading={monitoringLoading}
            monitoringError={monitoringError}
            targetUrl={targetUrl}
            onToggleMonitoring={handleToggleMonitoring}
            theme={theme}
          />
          
          <RateLimitWidget 
            rateLimits={rateLimits}
            theme={theme}
          />
        </div>

        {/* Right Details/Results panel */}
        <div className="space-y-6 lg:col-span-2 order-1 lg:order-2">
          <ScreenshotComparator 
            activePrediction={activePrediction}
            viewMode={viewMode}
            setViewMode={setViewMode}
            targetUrl={targetUrl}
            onTriggerScan={handleTriggerManualScan}
            isTriggering={isTriggering}
            monitoringStatus={monitoringStatus}
            predictionsError={predictionsError}
            theme={theme}
          />
          
          <CaptureGallery 
            predictions={predictions}
            activePrediction={activePrediction}
            onSelectPrediction={setActivePrediction}
            theme={theme}
          />
          
          <LogsPanel 
            auditLogs={auditLogs}
            logsLoading={logsLoading}
            logSearch={logSearch}
            onLogSearchChange={handleLogSearchChange}
            logFilter={logFilter}
            onLogFilterChange={handleLogFilterChange}
            theme={theme}
          />
        </div>

      </main>
    </div>
  );
}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RefreshCw, Layers, Globe, Radio, ShieldCheck, AlertCircle, TrendingUp, TrendingDown, Clock, Activity, Zap, Sun, Moon, Sparkles, ChevronDown } from 'lucide-react';
import { getPredictions, triggerAnalysis, deletePrediction, getSchedulerSettings, updateSchedulerSettings } from './services/api';
import MetricCard from './components/MetricCard';
import ChartSection from './components/ChartSection';
import LogList from './components/LogList';
import ImagePreviewModal from './components/ImagePreviewModal';
import ChatBot from './components/ChatBot';
import AssetDropdown from './components/AssetDropdown';
import { translations, translateDynamic } from './services/translations';

const DEFAULT_TARGETS = [
  { symbol: 'NIFTY50', url: 'https://groww.in/charts/indices/nifty' },
  { symbol: 'HDFC', url: 'https://groww.in/stocks/hdfc-bank-ltd' },
  { symbol: 'JIO', url: 'https://groww.in/stocks/jio-financial-services-ltd' }
];

export default function App() {
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);
  const [error, setError] = useState(null);
  const [wsStatus, setWsStatus] = useState('CONNECTING'); // CONNECTING, CONNECTED, DISCONNECTED

  // Multi-language states
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const langMenuRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // Close dropdown click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const t = (key) => translations[language]?.[key] || translations['en']?.[key] || key;
  
  // Custom asset trigger states
  const [customUrl, setCustomUrl] = useState('');
  const [customSymbol, setCustomSymbol] = useState('');
  
  // Background automated scheduler states
  const [schedulerInterval, setSchedulerInterval] = useState(5);
  const [customIntervalInput, setCustomIntervalInput] = useState('');
  const [isUpdatingInterval, setIsUpdatingInterval] = useState(false);
  const [intervalFeedback, setIntervalFeedback] = useState('');
  const [onlyDuringMarketHours, setOnlyDuringMarketHours] = useState(false);
  const [marketStartTime, setMarketStartTime] = useState('09:15');
  const [marketEndTime, setMarketEndTime] = useState('15:30');
  const [excludeWeekends, setExcludeWeekends] = useState(true);
  
  // Saved targets list from local storage or defaults
  const [targets, setTargets] = useState(() => {
    const saved = localStorage.getItem('target_assets');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Automatically migrate old 404 URLs if they exist in localStorage
        let migrated = false;
        const updated = parsed.map(target => {
          if (target.url === 'https://groww.in/charts/ext/stocks/hdfc-bank') {
            migrated = true;
            return { ...target, url: 'https://groww.in/stocks/hdfc-bank-ltd' };
          }
          if (target.url === 'https://groww.in/charts/ext/stocks/jio-financial-services') {
            migrated = true;
            return { ...target, url: 'https://groww.in/stocks/jio-financial-services-ltd' };
          }
          return target;
        });
        
        if (migrated) {
          localStorage.setItem('target_assets', JSON.stringify(updated));
          return updated;
        }
        return parsed;
      } catch (e) {
        console.error('Failed to parse target assets from localStorage:', e);
      }
    }
    return DEFAULT_TARGETS;
  });

  // Workspace symbol filter state
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  // Theme state
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(10);

  // Lightbox preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  // Keep refs of latest states to avoid closing/opening WebSocket connections
  const selectedFilterRef = useRef(selectedFilter);
  const currentPageRef = useRef(currentPage);

  useEffect(() => {
    selectedFilterRef.current = selectedFilter;
  }, [selectedFilter]);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  // Apply theme class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Load scheduler settings on bootstrap
  useEffect(() => {
    const fetchSchedulerSettings = async () => {
      try {
        const response = await getSchedulerSettings();
        if (response.success) {
          setSchedulerInterval(response.interval_minutes);
          setCustomIntervalInput(response.interval_minutes.toString());
          if (response.only_during_market_hours !== undefined) setOnlyDuringMarketHours(response.only_during_market_hours);
          if (response.market_start_time !== undefined) setMarketStartTime(response.market_start_time);
          if (response.market_end_time !== undefined) setMarketEndTime(response.market_end_time);
          if (response.exclude_weekends !== undefined) setExcludeWeekends(response.exclude_weekends);
        }
      } catch (err) {
        console.error('Failed to load background scheduler settings:', err);
      }
    };
    fetchSchedulerSettings();
  }, []);

  // Update background scheduler settings dynamically
  const handleUpdateInterval = async () => {
    const mins = parseInt(customIntervalInput, 10);
    if (isNaN(mins) || mins < 1) {
      setError(t('invalidInterval'));
      return;
    }
    
    setIsUpdatingInterval(true);
    setError(null);
    setIntervalFeedback('');
    try {
      const response = await updateSchedulerSettings({
        interval_minutes: mins,
        only_during_market_hours: onlyDuringMarketHours,
        market_start_time: marketStartTime,
        market_end_time: marketEndTime,
        exclude_weekends: excludeWeekends
      });
      if (response.success) {
        setSchedulerInterval(response.interval_minutes);
        setOnlyDuringMarketHours(response.only_during_market_hours);
        setMarketStartTime(response.market_start_time);
        setMarketEndTime(response.market_end_time);
        setExcludeWeekends(response.exclude_weekends);
        setIntervalFeedback(t('intervalSuccess').replace('{mins}', response.interval_minutes.toString()));
        setTimeout(() => setIntervalFeedback(''), 4000);
      }
    } catch (err) {
      console.error(err);
      setError(`Failed to update background scheduler settings: ${err.message}`);
    } finally {
      setIsUpdatingInterval(false);
    }
  };

  // Primary data fetcher
  const loadData = useCallback(async (showQuietly = false, page = currentPage, symbol = selectedFilter) => {
    if (!showQuietly) setIsLoading(true);
    try {
      const result = await getPredictions(page, pageSize, null, symbol);
      if (result.success) {
        const mappedData = result.data.map(item => ({
          ...item,
          image_url: item.image_url || `/screenshots/${item.image_path}`
        }));
        setPredictions(mappedData);
        setTotalPages(Math.ceil(result.total / pageSize) || 1);
        setTotalCount(result.total || 0);
        setError(null);
      } else {
        throw new Error(result.error || result.message || 'Failed to fetch predictions from server.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed connecting to predictions server.');
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  // Fetch data on page change or filter change
  useEffect(() => {
    loadData(false, currentPage, selectedFilter);
  }, [currentPage, selectedFilter, loadData]);

  // WebSocket connection management for instant real-time broadcasts
  useEffect(() => {
    let socket = null;
    let reconnectTimeout = null;
    let isMounted = true;

    const connectWS = () => {
      if (!isMounted) return;
      setWsStatus('CONNECTING');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname === 'localhost' ? 'localhost:5000' : window.location.host;
      const wsUrl = `${protocol}//${host}/api/ws`;

      console.log('🔌 Connecting to FastAPI WebSocket server:', wsUrl);
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        if (!isMounted) {
          socket.close();
          return;
        }
        console.log('✔️ WebSocket connected.');
        setWsStatus('CONNECTED');
        setError(null);
      };

      socket.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'NEW_PREDICTION' && payload.data) {
            console.log('📡 Real-time broadcast received:', payload.data);
            // Refresh first page to load latest item and synchronize pagination offsets
            loadData(true, 1, selectedFilterRef.current);
            setCurrentPage(1);
          }
        } catch (err) {
          console.error('Error parsing WebSocket data:', err);
        }
      };

      socket.onclose = () => {
        if (!isMounted) return;
        console.warn('❌ WebSocket connection closed. Attempting reconnect...');
        setWsStatus('DISCONNECTED');
        reconnectTimeout = setTimeout(connectWS, 5000);
      };

      socket.onerror = (err) => {
        console.error('WebSocket connection error:', err);
        socket.close();
      };
    };

    connectWS();

    // Fallback Polling (Every 15 seconds)
    const interval = setInterval(() => {
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        loadData(true, currentPageRef.current, selectedFilterRef.current);
      }
    }, 15000);

    return () => {
      isMounted = false;
      if (socket) socket.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      clearInterval(interval);
    };
  }, [loadData]);

  // Asset selection helper
  const handleSelectAsset = (symbol) => {
    setSelectedFilter(symbol);
    setCurrentPage(1);
    
    // Auto-fill Custom Asset Console inputs if select option has matching configuration
    if (symbol === 'ALL') {
      setCustomSymbol('');
      setCustomUrl('');
    } else {
      const match = targets.find(t => t.symbol.toUpperCase() === symbol.toUpperCase());
      if (match) {
        setCustomSymbol(match.symbol);
        setCustomUrl(match.url);
      }
    }
  };

  // Handle manual, on-demand capture trigger
  const handleTriggerScan = async (targetUrl = null, stockSymbol = null) => {
    if (isTriggering) return;
    setIsTriggering(true);
    setError(null);
    try {
      // Sanitize inputs to ignore React event objects from onClick triggers
      const sanitizedUrl = (targetUrl && typeof targetUrl === 'string') ? targetUrl : null;
      const sanitizedSymbol = (stockSymbol && typeof stockSymbol === 'string') ? stockSymbol : null;

      const activeSymbol = sanitizedSymbol || customSymbol || 'NIFTY50';
      const activeUrl = sanitizedUrl || customUrl || 'https://groww.in/charts/indices/nifty';
      
      const response = await triggerAnalysis(activeUrl, activeSymbol);
      if (response.success && response.data) {
        // Parse and check if we should add it to saved dropdown options list
        const exists = targets.some(t => t.symbol.toUpperCase() === activeSymbol.toUpperCase());
        let updatedTargets = targets;
        if (!exists) {
          updatedTargets = [...targets, { symbol: activeSymbol.toUpperCase(), url: activeUrl }];
          setTargets(updatedTargets);
          localStorage.setItem('target_assets', JSON.stringify(updatedTargets));
        }
        
        // Switch the selected workspace filter to this newly analyzed asset
        setSelectedFilter(activeSymbol.toUpperCase());
        
        // Clear inputs after successful add
        setCustomUrl('');
        setCustomSymbol('');

        // Sync lists by loading page 1
        loadData(false, 1, activeSymbol.toUpperCase());
        setCurrentPage(1);
      }
    } catch (err) {
      console.error(err);
      setError(`Manual trigger workflow failed: ${err.message}`);
    } finally {
      setIsTriggering(false);
    }
  };

  // Handle delete target asset from saved dropdown targets
  const handleDeleteTarget = (symbolToDelete) => {
    const updatedTargets = targets.filter(t => t.symbol.toUpperCase() !== symbolToDelete.toUpperCase());
    setTargets(updatedTargets);
    localStorage.setItem('target_assets', JSON.stringify(updatedTargets));
    
    // If the currently selected workspace is the deleted one, switch back to ALL
    if (selectedFilter.toUpperCase() === symbolToDelete.toUpperCase()) {
      setSelectedFilter('ALL');
      setCurrentPage(1);
    }
  };

  // Handle row deletion
  const handleDeletePrediction = async (id) => {
    setError(null);
    try {
      const response = await deletePrediction(id);
      if (response.success) {
        // Calculate pagination shift
        const newTotalCount = totalCount - 1;
        const newTotalPages = Math.ceil(newTotalCount / pageSize) || 1;
        const targetPage = currentPage > newTotalPages ? newTotalPages : currentPage;
        
        loadData(false, targetPage, selectedFilter);
        if (targetPage !== currentPage) {
          setCurrentPage(targetPage);
        }
      }
    } catch (err) {
      console.error(err);
      setError(`Failed to delete record #${id}: ${err.message}`);
    }
  };

  const openPreview = (url) => {
    setPreviewUrl(url);
    setPreviewOpen(true);
  };

  // Filter is now robustly handled by the backend pagination engine
  const filteredPredictions = predictions;
  const latestPrediction = filteredPredictions[0] || null;

  // Multi-timeline Forecast configuration helper
  const getPredictionIntervals = (pred) => {
    if (!pred || !pred.prediction_json) return null;
    const details = pred.prediction_json.predictions;
    if (!details) return null;

    return [
      { label: t('next15Mins'), data: details['15_minutes'] },
      { label: t('next1Hour'), data: details['1_hour'] },
      { label: t('next4Hours'), data: details['4_hours'] },
      { label: t('next24Hours'), data: details['24_hours'] }
    ];
  };

  const intervals = getPredictionIntervals(latestPrediction);


  return (
    <div className="min-h-screen relative pb-16 px-4 sm:px-6 lg:px-8 z-10 font-sans transition-colors duration-200 text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 overflow-x-hidden">
      
      {/* Navigation Header */}
      <header className="max-w-7xl mx-auto py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 dark:border-slate-800 gap-4 relative z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shrink-0">
            <Layers className="h-5 w-5 text-slate-700 dark:text-slate-200" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{t('title')}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide">{t('subtitle')}</p>
          </div>
        </div>

        {/* Global Pipeline Indicators & Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">          {/* Theme Toggle Switch */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors flex items-center justify-center shrink-0 shadow-sm"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />}
          </button>

          {/* Premium Language Dropdown Selector */}
          <div className="relative shrink-0" ref={langMenuRef}>
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors flex items-center gap-2 shrink-0 shadow-sm text-xs font-bold"
              title="Select Language"
            >
              <Globe className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              <span>
                {language === 'en' ? 'English' : language === 'gu' ? 'ગુજરાતી' : 'हिन्दी'}
              </span>
              <ChevronDown className="h-4 w-4 opacity-60" />
            </button>
            {langDropdownOpen && (
              <div className="absolute right-0 mt-1 w-32 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 shadow-md z-50 flex flex-col gap-0.5 overflow-hidden">
                <button
                  onClick={() => {
                    setLanguage('en');
                    setLangDropdownOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 text-xs rounded font-medium transition-colors ${
                    language === 'en'
                      ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => {
                    setLanguage('gu');
                    setLangDropdownOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 text-xs rounded font-medium transition-colors ${
                    language === 'gu'
                      ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  ગુજરાતી
                </button>
                <button
                  onClick={() => {
                    setLanguage('hi');
                    setLangDropdownOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 text-xs rounded font-medium transition-colors ${
                    language === 'hi'
                      ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  हिन्दी
                </button>
              </div>
            )}
          </div>

          {/* Target Asset Dropdown Switcher */}
          <AssetDropdown
            value={selectedFilter}
            onChange={handleSelectAsset}
            targets={targets}
            onDeleteTarget={handleDeleteTarget}
          />

          {/* WebSocket status pill */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 font-semibold shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                wsStatus === 'CONNECTED' ? 'bg-emerald-500' : wsStatus === 'CONNECTING' ? 'bg-amber-500' : 'bg-rose-500'
              }`}></span>
            </span>
            <span>
              {t('wsSync')}: {wsStatus === 'CONNECTED' ? t('connected') : wsStatus === 'CONNECTING' ? t('connecting') : t('disconnected')}
            </span>
          </div>

          {/* Cron frequency indicator */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 font-bold shadow-sm">
            <Clock className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            <span>{t('apScheduler')}: {t('active')} ({schedulerInterval}m)</span>
          </div>

          {/* Trigger Scan Button */}
          <button
            onClick={handleTriggerScan}
            disabled={isTriggering || isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {isTriggering ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>{t('scanningMsg')}</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{t('instantPipelineTrigger')}</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto mt-8 space-y-8 relative z-20">
        
        {/* Error notification block */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs sm:text-sm shadow-sm animate-fade-in">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Pipeline Alert</p>
              <p className="text-slate-600 dark:text-slate-300 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Loading skeleton wrapper */}
        {isLoading && predictions.length === 0 ? (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700" />
              ))}
            </div>
            <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700" />
            <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700" />
          </div>
        ) : (
          <>
            {/* On-Demand Custom Asset Scanner Console */}
            <div className="glass-panel p-5 rounded-lg border border-slate-200 dark:border-slate-800 relative z-30">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-20">
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-slate-850 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Globe className="h-4 w-4 text-slate-500" /> {t('customAssetConsole')}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {t('customAssetDesc')}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0 items-stretch sm:items-center">
                  {/* Quick Select Saved Asset */}
                  <AssetDropdown
                    value={selectedFilter}
                    onChange={handleSelectAsset}
                    targets={targets}
                    onDeleteTarget={handleDeleteTarget}
                    placeholder={t('quickSelectAsset')}
                    isConsole={true}
                  />

                  {/* Symbol input */}
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder={t('symbolPlaceholder')} 
                      value={customSymbol}
                      onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())}
                      className="w-full sm:w-44 px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-cyan-600 transition-colors text-slate-800 dark:text-white font-mono uppercase font-bold"
                    />
                  </div>
                  {/* URL input */}
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder={t('urlPlaceholder')} 
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      className="w-full sm:w-80 px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-cyan-600 transition-colors text-slate-800 dark:text-white font-mono"
                    />
                  </div>
                  {/* Action Trigger Button */}
                  <button
                    onClick={() => handleTriggerScan(customUrl, customSymbol)}
                    disabled={isTriggering || !customUrl.trim()}
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shrink-0"
                  >
                    {isTriggering ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>{t('analyzing')}</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-3.5 w-3.5 fill-current" />
                        <span>{t('analyzeAsset')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="my-4 border-t border-slate-200 dark:border-slate-800"></div>
              
              {/* Automated Scheduler Settings Control */}
              <div className="flex flex-col gap-4 relative z-10 text-xs">
                {/* Header */}
                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <Clock className="h-4 w-4 text-slate-500" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Automated Capturing Scheduler Configuration</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      Configure active background capture frequency and trading hour constraints. Current active interval: <span className="font-bold text-cyan-600 dark:text-cyan-400 font-mono">{schedulerInterval}m</span>
                    </p>
                  </div>
                </div>

                {/* Settings Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  {/* 1. Exclude Weekends */}
                  <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none h-14">
                    <input 
                      type="checkbox"
                      checked={excludeWeekends}
                      onChange={(e) => setExcludeWeekends(e.target.checked)}
                      className="h-4 w-4 rounded text-cyan-600 focus:ring-cyan-500 border-slate-350 dark:border-slate-700 dark:bg-slate-950"
                    />
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-750 dark:text-slate-200 block text-[10px] uppercase tracking-wide">Exclude Weekends</span>
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">Capture Monday - Friday only</span>
                    </div>
                  </label>

                  {/* 2. Limit to Market Hours */}
                  <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none h-14">
                    <input 
                      type="checkbox"
                      checked={onlyDuringMarketHours}
                      onChange={(e) => setOnlyDuringMarketHours(e.target.checked)}
                      className="h-4 w-4 rounded text-cyan-600 focus:ring-cyan-500 border-slate-350 dark:border-slate-700 dark:bg-slate-950"
                    />
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-750 dark:text-slate-200 block text-[10px] uppercase tracking-wide">Limit to Market Hours</span>
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">Only run inside configured window</span>
                    </div>
                  </label>

                  {/* 3. Time Window inputs */}
                  <div className={`flex items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-all h-14 ${onlyDuringMarketHours ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <div className="space-y-1 w-full">
                      <span className="font-bold text-slate-500 dark:text-slate-400 block text-[8px] uppercase tracking-wider">Trading Time Window</span>
                      <div className="flex items-center gap-1.5 justify-between">
                        <input 
                          type="text"
                          placeholder="09:15"
                          value={marketStartTime}
                          onChange={(e) => setMarketStartTime(e.target.value)}
                          className="w-16 text-center py-0.5 text-[11px] rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-mono font-bold focus:outline-none"
                        />
                        <span className="text-slate-400 text-[10px] select-none font-bold">to</span>
                        <input 
                          type="text"
                          placeholder="15:30"
                          value={marketEndTime}
                          onChange={(e) => setMarketEndTime(e.target.value)}
                          className="w-16 text-center py-0.5 text-[11px] rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-mono font-bold focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4. Interval minutes + Save button */}
                  <div className="flex items-center gap-2 h-14">
                    <div className="relative flex items-center w-1/3">
                      <input 
                        type="text" 
                        inputMode="numeric"
                        placeholder="5" 
                        value={customIntervalInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^\d*$/.test(val)) {
                            setCustomIntervalInput(val);
                          }
                        }}
                        className="w-full px-2 py-2 pr-6 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-cyan-600 transition-colors text-slate-800 dark:text-white font-mono font-bold text-center h-9"
                        title="Interval minutes"
                      />
                      <span className="absolute right-2 text-[9px] text-slate-400 dark:text-slate-550 font-bold font-sans select-none">m</span>
                    </div>

                    <button
                      onClick={handleUpdateInterval}
                      disabled={isUpdatingInterval || !customIntervalInput.trim()}
                      className="w-2/3 h-9 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      {isUpdatingInterval ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Updating</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>Update Settings</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Feedback indicator row */}
                {intervalFeedback && (
                  <div className="text-[11px] text-emerald-500 dark:text-emerald-450 font-bold tracking-wide mt-1 animate-fade-in">
                    ✓ {intervalFeedback}
                  </div>
                )}
              </div>
            </div>

             {/* 1. Metric Cards Grid */}
            <MetricCard prediction={latestPrediction} language={language} />


            {/* 2. Detailed Predictions & Timeline Analytics Panel (User request: "more ditels of pridiction") */}
            {latestPrediction && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Timeline Panel */}
                <div className="lg:col-span-2 glass-panel p-5 rounded-lg border border-slate-200 dark:border-slate-800 relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-slate-500" /> {t('dynamicProjections')}
                    </h3>
                    
                    {intervals ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {intervals.map((item, index) => {
                          const direction = item.data?.direction || 'SIDEWAYS';
                          const confidence = item.data?.confidence || 50;
                          
                          const isUp = direction === 'UP';
                          const isDown = direction === 'DOWN';
                          
                          return (
                            <div key={index} className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-28">
                              <div className="flex justify-between items-start">
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{item.label}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  isUp ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/25' : isDown ? 'bg-rose-500/10 text-rose-600 dark:text-rose-450 border border-rose-500/25' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                }`}>
                                  {translateDynamic(direction, language)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2">
                                  {isUp && <TrendingUp className="h-6 w-6 text-emerald-500 dark:text-emerald-450" />}
                                  {isDown && <TrendingDown className="h-6 w-6 text-rose-500 dark:text-rose-450" />}
                                  {!isUp && !isDown && <Activity className="h-6 w-6 text-slate-400 dark:text-slate-500" />}
                                  <span className="text-lg font-bold font-mono text-slate-800 dark:text-white">
                                    {direction === 'UP' ? '⬆ ' + t('up') : direction === 'DOWN' ? '⬇ ' + t('down') : '➡️ ' + t('sideways')}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-bold">{t('accuracy')}</span>
                                  <span className="text-xs font-bold font-mono text-cyan-600 dark:text-cyan-400">{confidence}%</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-48 text-slate-450 dark:text-slate-500">
                        {t('projectionsParsing')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Cognitive Report details */}
                <div className="glass-panel p-5 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col justify-between relative overflow-hidden">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-slate-500" /> {t('aiPredictionBreakdown')}
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Sentiment bar */}
                      <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 dark:text-slate-400 font-semibold">{t('marketSentiment')}:</span>
                          <span className={`font-extrabold uppercase tracking-wide text-xs ${
                            latestPrediction.prediction_json?.market_sentiment === 'POSITIVE' ? 'text-emerald-600 dark:text-emerald-450' :
                            latestPrediction.prediction_json?.market_sentiment === 'NEGATIVE' ? 'text-rose-600 dark:text-rose-450' : 'text-amber-600 dark:text-amber-455'
                          }`}>{translateDynamic(latestPrediction.prediction_json?.market_sentiment || 'NEUTRAL', language)}</span>
                        </div>
                        <div className="flex h-2 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-850 gap-0.5">
                          <div className={`h-full ${latestPrediction.prediction_json?.market_sentiment === 'NEGATIVE' ? 'w-full bg-rose-500' : 'w-1/3 bg-rose-500/20'}`} />
                          <div className={`h-full ${latestPrediction.prediction_json?.market_sentiment === 'NEUTRAL' ? 'w-full bg-amber-500' : 'w-1/3 bg-amber-500/20'}`} />
                          <div className={`h-full ${latestPrediction.prediction_json?.market_sentiment === 'POSITIVE' ? 'w-full bg-emerald-500' : 'w-1/3 bg-emerald-500/20'}`} />
                        </div>
                      </div>

                      {/* Technical values */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-bold">{t('rsiMomentum')}</span>
                          <span className="text-sm font-bold font-mono text-slate-800 dark:text-white">
                            {latestPrediction.prediction_json?.indicators?.rsi || latestPrediction.extracted_metrics?.indicators?.rsi || 'N/A'}
                          </span>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-bold">{t('macdTrend')}</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate block leading-5">
                            {latestPrediction.prediction_json?.indicators?.macd_trend || latestPrediction.extracted_metrics?.indicators?.macd_trend || 'Neutral'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Block */}
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500 mb-1">{t('executiveSummary')}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed line-clamp-3">
                      "{latestPrediction.ai_summary}"
                    </p>
                  </div>
                </div>

              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 3. Visualizations (2 columns on lg) */}
              <div className="lg:col-span-2 space-y-8">
                {/* Asset Switcher Workspaces */}
                <div className="flex flex-wrap items-center gap-2 pb-1.5 border-b border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => handleSelectAsset('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans transition-all duration-200 border ${
                      selectedFilter === 'ALL'
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    📂 {t('allWorkspaceAssets')}
                  </button>
                  {targets.map((t) => (
                    <button
                      key={t.symbol}
                      onClick={() => handleSelectAsset(t.symbol.toUpperCase())}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans transition-all duration-200 border ${
                        selectedFilter === t.symbol.toUpperCase()
                           ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600'
                           : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      📊 {t.symbol.toUpperCase()}
                    </button>
                  ))}
                </div>

                <ChartSection history={filteredPredictions} />
                
                {/* 4. Prediction logs archive with full pagination & delete hooks */}
                <LogList 
                  predictions={filteredPredictions} 
                  onPreviewImage={openPreview}

                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  onDeletePrediction={handleDeletePrediction}
                  totalCount={totalCount}
                  language={language}
                />
              </div>

              {/* 5. Side Widget: Latest AI Summary & Target details */}
              <div className="space-y-6">
                
                {/* Live Preview Card */}
                <div className="glass-panel p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Radio className="h-4 w-4 text-slate-500" /> {t('targetChartScreenshot')}
                  </h3>
                  
                  {latestPrediction ? (
                    <div className="space-y-4">
                      {/* Premium zoomable lens wrapper */}
                      <div 
                        className="relative group rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-950 aspect-video border border-slate-200 dark:border-slate-700 cursor-pointer"
                        onClick={() => openPreview(latestPrediction.image_url)}
                      >
                        <img 
                          src={latestPrediction.image_url} 
                          alt="Latest captured graph" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="px-3 py-1.5 bg-black/80 rounded-lg text-xs font-bold text-white border border-slate-700 tracking-wide uppercase">
                            🔬 {t('zoomPreview')}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 font-mono">
                        <p><span className="font-semibold text-slate-700 dark:text-slate-300">{t('indexSymbol')}:</span> <span className="text-cyan-600 dark:text-cyan-400 font-bold">{latestPrediction.stock_symbol}</span></p>
                        <p><span className="font-semibold text-slate-700 dark:text-slate-300">{t('capturedAt')}:</span> {new Date(latestPrediction.captured_at).toLocaleString()}</p>
                        <p className="truncate"><span className="font-semibold text-slate-700 dark:text-slate-300">{t('imagePath')}:</span> {latestPrediction.image_path}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-xs text-slate-450 dark:text-slate-500">
                      {t('noChartsYet')}
                    </div>
                  )}
                </div>

                {/* Automation Specifications Info */}
                <div className="glass-panel p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-slate-550" /> {t('systemConfigurations')}
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                      <span className="text-slate-500 dark:text-slate-400">{t('targetSelector')}:</span>
                      <span className="font-mono text-cyan-600 dark:text-cyan-400 font-semibold">body / canvas</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                      <span className="text-slate-500 dark:text-slate-400">{t('databaseEngine')}:</span>
                      <span className="font-semibold uppercase">PostgreSQL / SQLAlchemy</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                      <span className="text-slate-500 dark:text-slate-400">{t('captureEngine')}:</span>
                      <span className="flex items-center gap-1 font-semibold"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Playwright Python</span>
                    </div>
                    <div className="flex justify-between py-1.5 text-slate-700 dark:text-slate-300">
                      <span className="text-slate-500 dark:text-slate-400">{t('cognitiveAiModel')}:</span>
                      <span className="font-bold text-cyan-600 dark:text-cyan-400">GPT-4o Vision API</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </>
        )}

      </main>

      {/* Floating Chatbot Widget (User request: "chebot add and user chet the ai") */}
      <ChatBot 
        activePredictionId={latestPrediction?.id} 
        stockSymbol={latestPrediction?.stock_symbol} 
        language={language}
      />

      {/* Lightbox modal portal */}
      <ImagePreviewModal 
        isOpen={previewOpen}
        imageUrl={previewUrl}
        onClose={() => setPreviewOpen(false)}
      />

    </div>
  );
}

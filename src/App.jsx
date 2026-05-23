import React, { useState, useEffect } from 'react';
import { Play, RefreshCw, Layers, Globe, Radio, ShieldCheck, AlertCircle, TrendingUp, TrendingDown, Clock, Activity, Zap, Sun, Moon, Sparkles } from 'lucide-react';
import { getPredictions, triggerAnalysis, deletePrediction } from './services/api';
import MetricCard from './components/MetricCard';
import ChartSection from './components/ChartSection';
import LogList from './components/LogList';
import ImagePreviewModal from './components/ImagePreviewModal';
import ChatBot from './components/ChatBot';

export default function App() {
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);
  const [error, setError] = useState(null);
  const [wsStatus, setWsStatus] = useState('CONNECTING'); // CONNECTING, CONNECTED, DISCONNECTED
  
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

  // Apply theme class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Primary data fetcher
  const loadData = async (showQuietly = false, page = currentPage) => {
    if (!showQuietly) setIsLoading(true);
    try {
      const result = await getPredictions(page, pageSize);
      if (result.success) {
        const mappedData = result.data.map(item => ({
          ...item,
          image_url: item.image_url || `/screenshots/${item.image_path}`
        }));
        setPredictions(mappedData);
        setTotalPages(Math.ceil(result.total / pageSize) || 1);
        setTotalCount(result.total || 0);
        setError(null);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed connecting to predictions server.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on page change
  useEffect(() => {
    loadData(false, currentPage);
  }, [currentPage]);

  // WebSocket connection management for instant real-time broadcasts
  useEffect(() => {
    let socket = null;
    let reconnectTimeout = null;

    const connectWS = () => {
      setWsStatus('CONNECTING');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname === 'localhost' ? 'localhost:5000' : window.location.host;
      const wsUrl = `${protocol}//${host}/api/ws`;

      console.log('🔌 Connecting to FastAPI WebSocket server:', wsUrl);
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('✔️ WebSocket connected.');
        setWsStatus('CONNECTED');
        setError(null);
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'NEW_PREDICTION' && payload.data) {
            console.log('📡 Real-time broadcast received:', payload.data);
            // Refresh first page to load latest item and synchronize pagination offsets
            loadData(true, 1);
            setCurrentPage(1);
          }
        } catch (err) {
          console.error('Error parsing WebSocket data:', err);
        }
      };

      socket.onclose = () => {
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
      if (wsStatus !== 'CONNECTED') {
        loadData(true, currentPage);
      }
    }, 15000);

    return () => {
      if (socket) socket.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      clearInterval(interval);
    };
  }, [currentPage, wsStatus]);

  // Handle manual, on-demand capture trigger
  const handleTriggerScan = async () => {
    if (isTriggering) return;
    setIsTriggering(true);
    setError(null);
    try {
      const response = await triggerAnalysis();
      if (response.success && response.data) {
        // Sync lists by loading page 1
        loadData(false, 1);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error(err);
      setError(`Manual trigger workflow failed: ${err.message}`);
    } finally {
      setIsTriggering(false);
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
        
        loadData(false, targetPage);
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

  const latestPrediction = predictions[0] || null;

  // Multi-timeline Forecast configuration helper
  const getPredictionIntervals = () => {
    if (!latestPrediction || !latestPrediction.prediction_json) return null;
    const details = latestPrediction.prediction_json.predictions;
    if (!details) return null;

    return [
      { label: 'Next 15 Mins', data: details['15_minutes'] },
      { label: 'Next 1 Hour', data: details['1_hour'] },
      { label: 'Next 4 Hours', data: details['4_hours'] },
      { label: 'Next 24 Hours', data: details['24_hours'] }
    ];
  };

  const intervals = getPredictionIntervals();

  return (
    <div className="min-h-screen relative pb-16 px-4 sm:px-6 lg:px-8 z-10 font-sans transition-colors duration-350 text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-[#070b13] overflow-x-hidden">
      
      {/* Visual background atmospheric mesh glows */}
      <div className="glow-orb-cyan top-[-100px] left-[5%]" />
      <div className="glow-orb-purple top-[300px] right-[5%]" />

      {/* Navigation Header */}
      <header className="max-w-7xl mx-auto py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 dark:border-white/5 gap-4 relative z-20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-cyanAccent to-purpleAccent rounded-xl shadow-cyan-glow animate-pulse">
            <Layers className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight font-sans">AETHER ANALYTICS</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide">Asynchronous AI Stock Graph Analysis Platform</p>
          </div>
        </div>

        {/* Global Pipeline Indicators & Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          
          {/* Theme Toggle Switch */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-900/60 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-300 border border-slate-350 dark:border-white/5 transition-all flex items-center justify-center shrink-0 shadow-sm"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun className="h-4.5 w-4.5 text-amber-400" /> : <Moon className="h-4.5 w-4.5 text-indigo-600" />}
          </button>

          {/* WebSocket status pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-200/60 dark:bg-slate-900/60 border border-slate-350 dark:border-white/5 text-xs text-slate-650 dark:text-slate-350">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                wsStatus === 'CONNECTED' ? 'bg-emerald-400' : wsStatus === 'CONNECTING' ? 'bg-amber-400' : 'bg-rose-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                wsStatus === 'CONNECTED' ? 'bg-emerald-500' : wsStatus === 'CONNECTING' ? 'bg-amber-500' : 'bg-rose-500'
              }`}></span>
            </span>
            <span className="font-semibold">
              WS Sync: {wsStatus}
            </span>
          </div>

          {/* Cron frequency indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-200/60 dark:bg-slate-900/60 border border-slate-350 dark:border-white/5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <Clock className="h-3.5 w-3.5" />
            <span>APScheduler: Active (5m)</span>
          </div>

          {/* Trigger Scan Button */}
          <button
            onClick={handleTriggerScan}
            disabled={isTriggering || isLoading}
            className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyanAccent to-blue-600 hover:from-cyanAccent/90 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-cyan-glow hover:scale-[1.02] disabled:opacity-50 disabled:pointer-events-none`}
          >
            {isTriggering ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Scanning browser + Vision AI...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Instant Pipeline Trigger</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto mt-8 space-y-8 relative z-20">
        
        {/* Error notification block */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-450 text-xs sm:text-sm shadow-lg">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Pipeline Alert</p>
              <p className="text-slate-600 dark:text-slate-300 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Loading skeleton wrapper */}
        {isLoading && predictions.length === 0 ? (
          <div className="space-y-8 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 bg-slate-200/50 dark:bg-slate-900/60 rounded-2xl border border-slate-300 dark:border-white/5" />
              ))}
            </div>
            <div className="h-80 bg-slate-200/50 dark:bg-slate-900/60 rounded-2xl border border-slate-300 dark:border-white/5" />
            <div className="h-96 bg-slate-200/50 dark:bg-slate-900/60 rounded-2xl border border-slate-300 dark:border-white/5" />
          </div>
        ) : (
          <>
            {/* 1. Metric Cards Grid */}
            <MetricCard prediction={latestPrediction} />

            {/* 2. Detailed Predictions & Timeline Analytics Panel (User request: "more ditels of pridiction") */}
            {latestPrediction && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Timeline Panel */}
                <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-250 dark:border-white/5 shadow-glass relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-36 h-36 bg-purpleAccent/5 rounded-full filter blur-2xl pointer-events-none"></div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-purpleAccent animate-bounce" /> Dynamic Projections Timeline
                    </h3>
                    
                    {intervals ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {intervals.map((item, index) => {
                          const direction = item.data?.direction || 'SIDEWAYS';
                          const confidence = item.data?.confidence || 50;
                          
                          const isUp = direction === 'UP';
                          const isDown = direction === 'DOWN';
                          
                          return (
                            <div key={index} className="p-4 rounded-xl bg-slate-100/55 dark:bg-slate-950/40 border border-slate-200 dark:border-white/5 flex flex-col justify-between h-28">
                              <div className="flex justify-between items-start">
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{item.label}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  isUp ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : isDown ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-slate-250 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                }`}>
                                  {direction}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2">
                                  {isUp && <TrendingUp className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />}
                                  {isDown && <TrendingDown className="h-6 w-6 text-rose-500 dark:text-rose-400" />}
                                  {!isUp && !isDown && <Activity className="h-6 w-6 text-slate-400 dark:text-slate-500" />}
                                  <span className="text-xl font-bold font-mono text-slate-800 dark:text-white">
                                    {direction === 'UP' ? '⬆ UP' : direction === 'DOWN' ? '⬇ DOWN' : '➡️ SIDEWAYS'}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-bold">Accuracy</span>
                                  <span className="text-xs font-bold font-mono text-purpleAccent">{confidence}%</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-48 text-slate-400">
                        Projections parsing...
                      </div>
                    )}
                  </div>
                </div>

                {/* Cognitive Report details */}
                <div className="glass-panel p-6 rounded-2xl border border-slate-250 dark:border-white/5 shadow-glass flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-36 h-36 bg-cyanAccent/5 rounded-full filter blur-2xl pointer-events-none"></div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-cyanAccent animate-pulse" /> AI Prediction Breakdown
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Sentiment bar */}
                      <div className="p-3.5 rounded-xl bg-slate-100/55 dark:bg-slate-950/40 border border-slate-200 dark:border-white/5 space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 dark:text-slate-400 font-semibold">Market Sentiment:</span>
                          <span className={`font-extrabold uppercase tracking-wide text-xs ${
                            latestPrediction.prediction_json?.market_sentiment === 'POSITIVE' ? 'text-emerald-500 dark:text-emerald-400' :
                            latestPrediction.prediction_json?.market_sentiment === 'NEGATIVE' ? 'text-rose-500 dark:text-rose-400' : 'text-amber-500 dark:text-amber-400'
                          }`}>{latestPrediction.prediction_json?.market_sentiment || 'NEUTRAL'}</span>
                        </div>
                        <div className="flex h-2 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 gap-0.5">
                          <div className={`h-full ${latestPrediction.prediction_json?.market_sentiment === 'NEGATIVE' ? 'w-full bg-rose-500' : 'w-1/3 bg-rose-500/20'}`} />
                          <div className={`h-full ${latestPrediction.prediction_json?.market_sentiment === 'NEUTRAL' ? 'w-full bg-amber-500' : 'w-1/3 bg-amber-500/20'}`} />
                          <div className={`h-full ${latestPrediction.prediction_json?.market_sentiment === 'POSITIVE' ? 'w-full bg-emerald-500' : 'w-1/3 bg-emerald-500/20'}`} />
                        </div>
                      </div>

                      {/* Technical values */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-slate-100/55 dark:bg-slate-950/40 border border-slate-200 dark:border-white/5">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-bold">RSI Momentum</span>
                          <span className="text-sm font-bold font-mono text-slate-800 dark:text-white">
                            {latestPrediction.prediction_json?.indicators?.rsi || latestPrediction.extracted_metrics?.indicators?.rsi || 'N/A'}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-100/55 dark:bg-slate-950/40 border border-slate-200 dark:border-white/5">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-bold">MACD Trend</span>
                          <span className="text-xs font-bold text-purpleAccent truncate block leading-5">
                            {latestPrediction.prediction_json?.indicators?.macd_trend || latestPrediction.extracted_metrics?.indicators?.macd_trend || 'Neutral'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Block */}
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/5">
                    <p className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500 mb-1">Executive Summary Report</p>
                    <p className="text-xs text-slate-600 dark:text-slate-350 italic leading-relaxed line-clamp-3">
                      "{latestPrediction.ai_summary}"
                    </p>
                  </div>
                </div>

              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 3. Visualizations (2 columns on lg) */}
              <div className="lg:col-span-2 space-y-8">
                <ChartSection history={predictions} />
                
                {/* 4. Prediction logs archive with full pagination & delete hooks */}
                <LogList 
                  predictions={predictions} 
                  onPreviewImage={openPreview}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  onDeletePrediction={handleDeletePrediction}
                  totalCount={totalCount}
                />
              </div>

              {/* 5. Side Widget: Latest AI Summary & Target details */}
              <div className="space-y-6">
                
                {/* Live Preview Card */}
                <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Radio className="h-4 w-4 text-cyanAccent animate-pulse" /> Target Chart Screenshot
                  </h3>
                  
                  {latestPrediction ? (
                    <div className="space-y-4">
                      {/* Premium zoomable lens wrapper */}
                      <div 
                        className="relative group rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-950 aspect-video border border-slate-300 dark:border-white/10 cursor-pointer"
                        onClick={() => openPreview(latestPrediction.image_url)}
                      >
                        <img 
                          src={latestPrediction.image_url} 
                          alt="Latest captured graph" 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <span className="px-3 py-1.5 bg-black/80 rounded-lg text-xs font-bold text-white border border-white/10 shadow-2xl tracking-wide uppercase">
                            🔬 Zoom Preview
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 font-mono">
                        <p><span className="font-semibold text-slate-700 dark:text-slate-300">Index Symbol:</span> <span className="text-cyanAccent font-bold">{latestPrediction.stock_symbol}</span></p>
                        <p><span className="font-semibold text-slate-700 dark:text-slate-300">Captured At:</span> {new Date(latestPrediction.captured_at).toLocaleString()}</p>
                        <p className="truncate"><span className="font-semibold text-slate-700 dark:text-slate-300">Image Path:</span> {latestPrediction.image_path}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video bg-slate-100/50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-white/5 flex items-center justify-center text-xs text-slate-450 dark:text-slate-500">
                      No charts captured yet. Click the trigger button above.
                    </div>
                  )}
                </div>

                {/* Automation Specifications Info */}
                <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-purpleAccent" /> System Configurations
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300">
                      <span className="text-slate-500 dark:text-slate-400">Target Selector:</span>
                      <span className="font-mono text-cyanAccent font-semibold">body / canvas</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300">
                      <span className="text-slate-500 dark:text-slate-400">Database Engine:</span>
                      <span className="font-semibold uppercase">PostgreSQL / SQLAlchemy</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300">
                      <span className="text-slate-500 dark:text-slate-400">Capture Engine:</span>
                      <span className="flex items-center gap-1 font-semibold"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Playwright Python</span>
                    </div>
                    <div className="flex justify-between py-1.5 text-slate-700 dark:text-slate-300">
                      <span className="text-slate-500 dark:text-slate-400">Cognitive AI Model:</span>
                      <span className="font-bold text-purpleAccent">GPT-4o Vision API</span>
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

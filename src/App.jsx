import React, { useState, useEffect } from 'react';
import { Play, RefreshCw, Layers, Globe, Radio, ShieldCheck, AlertCircle } from 'lucide-react';
import { getPredictions, triggerAnalysis } from './services/api';
import MetricCard from './components/MetricCard';
import ChartSection from './components/ChartSection';
import LogList from './components/LogList';
import ImagePreviewModal from './components/ImagePreviewModal';

export default function App() {
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);
  const [error, setError] = useState(null);
  
  // Lightbox preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  // Primary data fetcher
  const loadData = async (showQuietly = false) => {
    if (!showQuietly) setIsLoading(true);
    try {
      const result = await getPredictions(50);
      if (result.success) {
        setPredictions(result.data);
        setError(null);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed connecting to predictions server.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load and periodic polling (every 10 seconds for real-time sync)
  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData(true);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Handle manual, on-demand capture trigger
  const handleTriggerScan = async () => {
    if (isTriggering) return;
    setIsTriggering(true);
    setError(null);
    try {
      const response = await triggerAnalysis();
      if (response.success) {
        // Prepend new record to state immediately
        const newRecord = {
          ...response.data,
          image_url: response.data.image_url || `/screenshots/${response.data.image_path}`
        };
        setPredictions(prev => [newRecord, ...prev]);
      }
    } catch (err) {
      console.error(err);
      setError(`Manual trigger workflow failed: ${err.message}`);
    } finally {
      setIsTriggering(false);
    }
  };

  const openPreview = (url) => {
    setPreviewUrl(url);
    setPreviewOpen(true);
  };

  const latestPrediction = predictions[0] || null;

  return (
    <div className="min-h-screen relative pb-16 px-4 sm:px-6 lg:px-8 z-10">
      
      {/* Visual background atmospheric mesh glows */}
      <div className="glow-orb-cyan top-[-100px] left-[5%]" />
      <div className="glow-orb-purple top-[300px] right-[5%]" />

      {/* Navigation Header */}
      <header className="max-w-7xl mx-auto py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 gap-4 relative z-20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-cyanAccent to-purpleAccent rounded-xl shadow-cyan-glow">
            <Layers className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight font-sans">AETHER ANALYTICS</h1>
            <p className="text-xs text-slate-400 font-medium tracking-wide">AI-Powered Graph Analysis Pipeline</p>
          </div>
        </div>

        {/* Global Pipeline Indicators & Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Active status pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-white/5 text-xs text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-300">Cron Daemon: ACTIVE (5m)</span>
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
                <span>Running browser + Vision AI...</span>
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
          <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs sm:text-sm shadow-lg">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Pipeline Alert</p>
              <p className="text-slate-300 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Loading skeleton wrapper */}
        {isLoading && predictions.length === 0 ? (
          <div className="space-y-8 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 bg-slate-900/60 rounded-2xl border border-white/5" />
              ))}
            </div>
            <div className="h-80 bg-slate-900/60 rounded-2xl border border-white/5" />
            <div className="h-96 bg-slate-900/60 rounded-2xl border border-white/5" />
          </div>
        ) : (
          <>
            {/* 1. Metric Cards Grid */}
            <MetricCard prediction={latestPrediction} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 2. Visualizations (2 columns on lg) */}
              <div className="lg:col-span-2 space-y-8">
                <ChartSection history={predictions} />
                
                {/* 3. Prediction logs table/archive */}
                <LogList predictions={predictions} onPreviewImage={openPreview} />
              </div>

              {/* 4. Side Widget: Latest AI Summary & Target details */}
              <div className="space-y-6">
                
                {/* Live Preview Card */}
                <div className="glass-panel p-5 rounded-2xl border border-white/5">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Radio className="h-4 w-4 text-cyanAccent animate-pulse" /> Latest Chart Screen
                  </h3>
                  
                  {latestPrediction ? (
                    <div className="space-y-4">
                      <div 
                        className="relative group rounded-xl overflow-hidden bg-slate-950 aspect-video border border-white/10 cursor-pointer"
                        onClick={() => openPreview(latestPrediction.image_url)}
                      >
                        <img 
                          src={latestPrediction.image_url} 
                          alt="Latest captured graph" 
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="px-3 py-1.5 bg-black/80 rounded-lg text-xs font-bold text-white border border-white/10">
                            Expand Image
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 space-y-1">
                        <p><span className="font-semibold text-slate-300">Captured At:</span> {new Date(latestPrediction.captured_at).toLocaleString()}</p>
                        <p className="truncate"><span className="font-semibold text-slate-300">File Path:</span> {latestPrediction.image_path}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video bg-slate-900/60 rounded-xl border border-white/5 flex items-center justify-center text-xs text-slate-500">
                      No charts captured yet. Click the trigger button above.
                    </div>
                  )}
                </div>

                {/* Automation Specifications Info */}
                <div className="glass-panel p-5 rounded-2xl border border-white/5">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-purpleAccent" /> Target Specifications
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-white/5 text-slate-300">
                      <span className="text-slate-400">Target Selector:</span>
                      <span className="font-mono text-cyanAccent font-semibold">body</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-white/5 text-slate-300">
                      <span className="text-slate-400">Scan Frequency:</span>
                      <span>Every 5 mins</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-white/5 text-slate-300">
                      <span className="text-slate-400">Engine Type:</span>
                      <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Playwright Headless</span>
                    </div>
                    <div className="flex justify-between py-1.5 text-slate-300">
                      <span className="text-slate-400">Model Engine:</span>
                      <span className="font-semibold">GPT-4o Vision API</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </>
        )}

      </main>

      {/* Lightbox modal portal */}
      <ImagePreviewModal 
        isOpen={previewOpen}
        imageUrl={previewUrl}
        onClose={() => setPreviewOpen(false)}
      />

    </div>
  );
}

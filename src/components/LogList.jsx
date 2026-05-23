import React, { useState } from 'react';
import { Eye, Calendar, Clock, ChevronDown, ChevronUp, Info, TrendingUp, TrendingDown, Activity, Zap, Trash2, Check, X } from 'lucide-react';

export default function LogList({ 
  predictions = [], 
  onPreviewImage,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  onDeletePrediction,
  totalCount = 0
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleDeleteClick = async (id) => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      if (onDeletePrediction) {
        await onDeletePrediction(id);
      }
      setConfirmDeleteId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!predictions || predictions.length === 0) {
    return (
      <div className="glass-panel p-12 rounded-2xl flex flex-col justify-center items-center text-slate-400 border border-slate-200/50 dark:border-white/5 shadow-glass font-sans">
        <Info className="h-10 w-10 text-slate-500 mb-3 animate-pulse" />
        <h4 className="text-base font-bold text-slate-800 dark:text-white">No scans archived yet</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs text-center font-sans">
          The cron scheduler runs every 5 minutes, or you can trigger an on-demand scan using the action button above.
        </p>
      </div>
    );
  }

  // Trend formatting configs
  const trendBadges = {
    BULLISH: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    BEARISH: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    SIDEWAYS: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
  };

  const signalBadges = {
    BUY: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold',
    SELL: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 font-bold',
    HOLD: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 border-slate-200/50 dark:border-white/10'
  };

  const activeTotal = totalCount || predictions.length;

  return (
    <div className="space-y-4 font-sans">
      <div className="flex justify-between items-center px-2">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">System Scan Archive</h3>
        <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-200/55 dark:bg-slate-900/60 px-3 py-1 rounded-full border border-slate-200/60 dark:border-white/5 font-mono">
          Total Logs: {activeTotal}
        </span>
      </div>

      <div className="space-y-3">
        {predictions.map((item) => {
          const isExpanded = expandedId === item.id;
          
          const formattedDate = new Date(item.captured_at).toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
          const formattedTime = new Date(item.captured_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });

          // support both new model columns and legacy fallback mapping
          const trend = item.trend_direction || item.forecast_results?.forecast_trend || 'SIDEWAYS';
          const confidence = item.confidence_score || item.forecast_results?.confidence_score || 80;
          
          const supportLevels = item.support_levels || (item.extracted_metrics?.support_level ? [item.extracted_metrics.support_level] : []);
          const resistanceLevels = item.resistance_levels || (item.extracted_metrics?.resistance_level ? [item.extracted_metrics.resistance_level] : []);
          
          const predictionJson = item.prediction_json || {};
          const currentPrice = predictionJson.current_value || item.extracted_metrics?.current_value || 0;
          const signal = predictionJson.signal || 'HOLD';
          const sentiment = predictionJson.market_sentiment || 'NEUTRAL';
          
          const indicators = predictionJson.indicators || {};
          const rsi = indicators.rsi || item.extracted_metrics?.indicators?.rsi || 'N/A';
          const macd = indicators.macd_trend || item.extracted_metrics?.indicators?.macd_trend || 'Neutral';
          
          const forecastTimeline = predictionJson.predictions || null;

          return (
            <div 
              key={item.id}
              className={`glass-panel rounded-xl overflow-hidden border transition-all duration-300 ${
                isExpanded ? 'border-cyanAccent/40 shadow-[0_0_20px_rgba(6,182,212,0.08)]' : 'border-slate-200/50 dark:border-white/5'
              }`}
            >
              {/* Row Summary header */}
              <div 
                className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-slate-100/30 dark:hover:bg-white/[0.01] transition-colors"
                onClick={() => toggleExpand(item.id)}
              >
                {/* Captured time */}
                <div className="flex items-center gap-3.5 w-full sm:w-auto">
                  <div className="relative group w-16 h-10 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-900 border border-slate-200 dark:border-white/10 shrink-0">
                    <img 
                      src={item.image_url} 
                      alt="Graph screenshot" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div 
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPreviewImage(item.image_url);
                      }}
                    >
                      <Eye className="h-4 w-4 text-white" />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800 dark:text-white font-mono shrink-0">Scan #{item.id}</span>
                      <span className={`text-[9px] uppercase tracking-wide font-extrabold px-1.5 py-0.5 rounded border shrink-0 ${trendBadges[trend.toUpperCase()] || trendBadges.SIDEWAYS}`}>
                        {trend}
                      </span>
                      <span className={`text-[9px] uppercase tracking-wide font-extrabold px-1.5 py-0.5 rounded border shrink-0 ${signalBadges[signal] || signalBadges.HOLD}`}>
                        {signal}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-xs mt-1 font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {formattedDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {formattedTime}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Key parameters */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                  <div className="flex items-center gap-6 font-mono text-xs sm:text-sm">
                    <div className="text-right">
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Symbol</p>
                      <p className="text-cyanAccent font-bold">{item.stock_symbol}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Price</p>
                      <p className="text-slate-800 dark:text-white font-bold">₹{parseFloat(currentPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Confidence</p>
                      <p className="text-purpleAccent font-bold">{confidence}%</p>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Delete action with safety confirmation */}
                    {confirmDeleteId === item.id ? (
                      <div 
                        className="flex items-center gap-1 shrink-0 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-white/10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button 
                          onClick={() => handleDeleteClick(item.id)}
                          className="p-1 rounded-md bg-rose-500 hover:bg-rose-600 text-white transition-colors"
                          title="Confirm Delete"
                          disabled={isDeleting}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => setConfirmDeleteId(null)}
                          className="p-1 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-350 hover:bg-slate-300 dark:hover:bg-slate-650 transition-colors"
                          title="Cancel"
                          disabled={isDeleting}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(item.id);
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                        title="Delete log entry"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}

                    <button 
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(item.id);
                      }}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expandable details panel */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0f1d]/40 text-xs sm:text-sm space-y-6">
                  {/* Grid Layout containing advanced technical details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Column 1: Image details */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] uppercase text-cyanAccent font-extrabold tracking-wider flex items-center gap-1">
                        <Zap className="h-3 w-3" /> Screenshot Info
                      </h4>
                      <div className="space-y-1.5 text-slate-600 dark:text-slate-350 text-xs font-mono">
                        <p className="truncate"><span className="text-slate-400 dark:text-slate-500">File:</span> {item.image_path}</p>
                        <p className="truncate"><span className="text-slate-400 dark:text-slate-500">Sentiment:</span> <span className="text-purpleAccent font-bold">{sentiment}</span></p>
                        <button 
                          className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-cyanAccent/10 hover:bg-cyanAccent/20 text-cyanAccent rounded-lg transition-colors border border-cyanAccent/20 text-xs font-bold font-sans"
                          onClick={() => onPreviewImage(item.image_url)}
                        >
                          <Eye className="h-3.5 w-3.5" /> Open Full Screenshot
                        </button>
                      </div>
                    </div>

                    {/* Column 2: Extracted variables */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] uppercase text-purpleAccent font-extrabold tracking-wider">Technical Indicators</h4>
                      <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs font-mono text-slate-600 dark:text-slate-300">
                        <div>
                          <p className="text-[9px] text-slate-450 dark:text-slate-500 uppercase font-bold">Support floors</p>
                          {supportLevels.map((val, idx) => (
                            <p key={idx} className="text-emerald-500 font-bold leading-tight">₹{parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                          ))}
                          {supportLevels.length === 0 && <p className="text-emerald-500 font-bold">₹{(currentPrice * 0.985).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>}
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-450 dark:text-slate-500 uppercase font-bold">Resistance ceilings</p>
                          {resistanceLevels.map((val, idx) => (
                            <p key={idx} className="text-rose-500 font-bold leading-tight">₹{parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                          ))}
                          {resistanceLevels.length === 0 && <p className="text-rose-500 font-bold">₹{(currentPrice * 1.015).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>}
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-450 dark:text-slate-500 uppercase font-bold">RSI Momentum</p>
                          <p className="text-slate-800 dark:text-white font-bold">{rsi}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-450 dark:text-slate-500 uppercase font-bold">MACD Crossover</p>
                          <p className="text-slate-800 dark:text-white font-bold truncate uppercase">{macd}</p>
                        </div>
                      </div>
                    </div>

                    {/* Column 3: AI Reasoning */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">AI Reasoning Summary</h4>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs font-sans">
                        {item.ai_summary}
                      </p>
                    </div>
                  </div>

                  {/* Dynamic Projections Sub-panel (Only if forecast data exists) */}
                  {forecastTimeline && (
                    <div className="pt-4 border-t border-slate-200/50 dark:border-white/5 space-y-2">
                      <h4 className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Interval Forecast Breakdown</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {Object.entries(forecastTimeline).map(([interval, details], idx) => {
                          const dir = details.direction || 'SIDEWAYS';
                          const conf = details.confidence || 50;
                          
                          const isUp = dir === 'UP';
                          const isDown = dir === 'DOWN';
                          
                          return (
                            <div key={idx} className="p-3 bg-slate-100/50 dark:bg-slate-950/50 rounded-xl border border-slate-200/40 dark:border-white/5 flex items-center justify-between">
                              <div>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block uppercase leading-none">{interval.replace('_', ' ')}</span>
                                <span className="text-xs font-mono font-bold mt-1.5 block text-slate-850 dark:text-slate-200">{dir === 'UP' ? '⬆ UP' : dir === 'DOWN' ? '⬇ DOWN' : '➡️ SIDEWAYS'}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[9px] text-slate-400 dark:text-slate-600 block uppercase font-bold">Confidence</span>
                                <span className="text-xs font-mono text-purpleAccent font-bold">{conf}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200/50 dark:border-white/5 text-xs">
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Showing Page <span className="font-bold text-slate-700 dark:text-white">{currentPage}</span> of <span className="font-bold text-slate-700 dark:text-white">{totalPages}</span>
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg bg-slate-200/60 dark:bg-slate-800 text-slate-650 dark:text-slate-350 hover:bg-slate-350/50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors font-bold"
            >
              Previous
            </button>
            
            {/* Direct Page Selectors */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              if (totalPages > 6 && Math.abs(currentPage - p) > 1 && p !== 1 && p !== totalPages) {
                if (p === 2 || p === totalPages - 1) {
                  return <span key={p} className="px-1 text-slate-400 dark:text-slate-500 select-none">...</span>;
                }
                return null;
              }
              
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`px-2.5 py-1.5 rounded-lg font-bold font-mono transition-all ${
                    currentPage === p
                      ? 'bg-cyanAccent text-white shadow-cyan-glow'
                      : 'bg-slate-200/60 dark:bg-slate-800 text-slate-650 dark:text-slate-350 hover:bg-slate-350/50 dark:hover:bg-slate-700'
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg bg-slate-200/60 dark:bg-slate-800 text-slate-650 dark:text-slate-350 hover:bg-slate-350/50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors font-bold"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

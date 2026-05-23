import React, { useState } from 'react';
import { Eye, Calendar, Clock, ChevronDown, ChevronUp, EyeOff, Info } from 'lucide-react';

export default function LogList({ predictions, onPreviewImage }) {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (!predictions || predictions.length === 0) {
    return (
      <div className="glass-panel p-12 rounded-2xl flex flex-col justify-center items-center text-slate-400 border border-white/5">
        <Info className="h-10 w-10 text-slate-500 mb-3 animate-pulse" />
        <h4 className="text-base font-bold text-white">No scans archived yet</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-xs text-center">
          The cron scheduler runs every 5 minutes, or you can trigger an on-demand scan using the action button above.
        </p>
      </div>
    );
  }

  // Trend formatting configs
  const trendBadges = {
    up: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    down: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    sideways: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-2">
        <h3 className="text-lg font-bold text-white tracking-tight">System Scan Archive</h3>
        <span className="text-xs text-slate-400 bg-slate-800/60 px-3 py-1 rounded-full border border-white/5">
          Total Logs: {predictions.length}
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

          const metrics = item.extracted_metrics;
          const forecast = item.forecast_results;

          return (
            <div 
              key={item.id}
              className={`glass-panel rounded-xl overflow-hidden border transition-all duration-300 ${
                isExpanded ? 'border-cyanAccent/30 shadow-[0_0_20px_rgba(6,182,212,0.06)]' : 'border-white/5'
              }`}
            >
              {/* Row Summary header */}
              <div 
                className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-white/[0.01] transition-colors"
                onClick={() => toggleExpand(item.id)}
              >
                {/* Captured time */}
                <div className="flex items-center gap-3.5">
                  <div className="relative group w-16 h-10 rounded-lg overflow-hidden bg-slate-900 border border-white/10 shrink-0">
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

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white font-mono">Scan #{item.id}</span>
                      <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded border ${trendBadges[forecast.forecast_trend]}`}>
                        {forecast.forecast_trend}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400 text-xs mt-1">
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
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Value</p>
                      <p className="text-white font-bold">${metrics.current_value.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Confidence</p>
                      <p className="text-purpleAccent font-bold">{forecast.confidence_score}%</p>
                    </div>
                  </div>

                  <button className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Expandable details panel */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-white/5 bg-slate-950/20 text-xs sm:text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Column 1: Image details */}
                    <div>
                      <h4 className="text-xs uppercase text-cyanAccent font-bold tracking-wider mb-2">Screenshot Info</h4>
                      <div className="space-y-1.5 text-slate-300 text-xs">
                        <p className="truncate"><span className="text-slate-500">File:</span> {item.image_path}</p>
                        <p><span className="text-slate-500">Path:</span> `/screenshots/{item.image_path}`</p>
                        <button 
                          className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-cyanAccent/10 hover:bg-cyanAccent/20 text-cyanAccent rounded-lg transition-colors border border-cyanAccent/20 text-xs font-semibold"
                          onClick={() => onPreviewImage(item.image_url)}
                        >
                          <Eye className="h-3.5 w-3.5" /> Open Full Screenshot
                        </button>
                      </div>
                    </div>

                    {/* Column 2: Extracted variables */}
                    <div>
                      <h4 className="text-xs uppercase text-purpleAccent font-bold tracking-wider mb-2">Extracted Data</h4>
                      <div className="grid grid-cols-2 gap-y-2 text-xs font-mono text-slate-300">
                        <div>
                          <p className="text-[10px] text-slate-500">Support Floor</p>
                          <p className="text-emerald-400 font-bold">${metrics.support_level.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500">Resistance Ceiling</p>
                          <p className="text-rose-400 font-bold">${metrics.resistance_level.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500">RSI Indicator</p>
                          <p className="text-white">{metrics.indicators?.rsi || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500">MACD Indicator</p>
                          <p className="text-white uppercase font-bold">{metrics.indicators?.macd_trend || 'Neutral'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Column 3: AI Reasoning */}
                    <div>
                      <h4 className="text-xs uppercase text-slate-400 font-bold tracking-wider mb-2">AI Reasoning Summary</h4>
                      <p className="text-slate-300 leading-relaxed text-xs">
                        {forecast.prediction_summary}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

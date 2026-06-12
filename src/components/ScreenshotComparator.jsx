import React from 'react';
import { Sparkles, RefreshCw, AlertCircle, Image as ImageIcon } from 'lucide-react';

export default function ScreenshotComparator({ 
  activePrediction, viewMode, setViewMode, targetUrl, 
  onTriggerScan, isTriggering, monitoringStatus, predictionsError, theme 
}) {
  return (
    <div className={`glass-panel p-6 rounded-2xl border relative overflow-hidden ${
      theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-850 pb-4 mb-5 gap-3">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-cyan-500" /> Screenshot Comparator & AI Prediction
          </h3>
          <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Visually detect changes and analyze trend lines automatically</p>
        </div>

        {/* Actions trigger */}
        {targetUrl && (
          <button
            onClick={onTriggerScan}
            disabled={isTriggering || monitoringStatus !== 'active'}
            title={monitoringStatus !== 'active' ? "Start monitoring to enable scans" : "Force an on-demand monitoring cycle"}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 disabled:pointer-events-none text-white font-extrabold text-[11px] uppercase transition-all flex items-center gap-1.5 shadow cursor-pointer"
          >
            {isTriggering ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            <span>Scan Now (On-Demand)</span>
          </button>
        )}
      </div>

      {predictionsError && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-450 text-xs mb-4">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span className="font-semibold">{predictionsError}</span>
        </div>
      )}

      {activePrediction ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-in">
          
          {/* Visual Viewport Pane (Col Span 7) */}
          <div className="md:col-span-7 space-y-4">
            
            {/* Comparator Toggle Switch */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 max-w-[280px]">
              <button
                onClick={() => setViewMode('original')}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  viewMode === 'original' ? 'bg-slate-900 text-cyan-400 border border-slate-805' : 'text-slate-400'
                }`}
              >
                Original view
              </button>
              <button
                onClick={() => setViewMode('highlighted')}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  viewMode === 'highlighted' ? 'bg-slate-900 text-rose-400 border border-slate-805' : 'text-slate-400'
                }`}
              >
                Highlights diff
              </button>
            </div>

            {/* Image Display */}
            <div className={`relative rounded-xl overflow-hidden border aspect-video flex items-center justify-center ${
              theme === 'dark' ? 'bg-slate-950 border-slate-850' : 'bg-slate-100 border-slate-250'
            }`}>
              {viewMode === 'original' ? (
                <img 
                  src={activePrediction.image_url} 
                  alt="Target Screenshot" 
                  className="w-full h-full object-cover"
                />
              ) : (
                activePrediction.highlighted_image_url ? (
                  <img 
                    src={activePrediction.highlighted_image_url} 
                    alt="Changed Sections Highlighted" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="p-6 text-center space-y-2 text-slate-500">
                    <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-450">No Changes Highlighted</p>
                    <p className="text-[10px] font-medium leading-relaxed max-w-xs mx-auto">This screenshot did not contain significant visual differences compared to the previous capture.</p>
                  </div>
                )
              )}
            </div>

            <div className="text-[10px] text-slate-500 font-mono flex flex-col sm:flex-row justify-between gap-1">
              <span>Captured At: {new Date(activePrediction.captured_at).toLocaleString()}</span>
              <span className="truncate">File: {activePrediction.image_path}</span>
            </div>

          </div>

          {/* AI Reasoning Details (Col Span 5) */}
          <div className="md:col-span-5 flex flex-col justify-between">
            <div className="space-y-4">
              
              {/* Sentiment and score metrics */}
              <div className={`p-4 rounded-xl border space-y-3 ${
                theme === 'dark' ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">AI Sentiment:</span>
                  <span className={`font-black uppercase text-xs tracking-wider ${
                    activePrediction.prediction_json?.market_sentiment === 'POSITIVE' ? 'text-emerald-500' :
                    activePrediction.prediction_json?.market_sentiment === 'NEGATIVE' ? 'text-rose-500' : 'text-amber-500'
                  }`}>
                    {activePrediction.prediction_json?.market_sentiment || 'NEUTRAL'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">AI Confidence:</span>
                  <span className="font-mono text-cyan-400 font-extrabold">{activePrediction.confidence_score}%</span>
                </div>

                {/* Direction Trend indicator */}
                <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-900">
                  <span className="text-slate-500 font-semibold">Visual Trend:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[10px] border uppercase ${
                    activePrediction.trend_direction === 'BULLISH' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                    activePrediction.trend_direction === 'BEARISH' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}>
                    {activePrediction.trend_direction}
                  </span>
                </div>
              </div>

              {/* Support / Resistance Technical levels */}
              {activePrediction.support_levels && activePrediction.support_levels.length > 0 && (
                <div className={`p-4 rounded-xl border space-y-2.5 ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="text-[9px] uppercase tracking-wider block font-bold text-slate-500">Identified Pivot Levels</span>
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono font-bold">
                    <div className="p-2 rounded bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-center">
                      <span className="text-[8px] uppercase block text-slate-500 font-bold mb-0.5">Supports</span>
                      {activePrediction.support_levels.slice(0, 2).map((s, idx) => (
                        <div key={idx}>${parseFloat(s).toFixed(2)}</div>
                      ))}
                    </div>
                    <div className="p-2 rounded bg-rose-500/5 border border-rose-500/10 text-rose-400 text-center">
                      <span className="text-[8px] uppercase block text-slate-500 font-bold mb-0.5">Resistances</span>
                      {activePrediction.resistance_levels.slice(0, 2).map((r, idx) => (
                        <div key={idx}>${parseFloat(r).toFixed(2)}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Prediction Summary */}
            <div className="mt-4 pt-4 border-t border-slate-850">
              <span className="text-[8px] uppercase tracking-widest block font-bold text-slate-500 mb-1">AI Auditor Summary</span>
              <p className="text-[11px] text-slate-400 leading-relaxed italic">
                "{activePrediction.ai_summary || "No visual changes summary recorded for this session."}"
              </p>
            </div>

          </div>

        </div>
      ) : (
        <div className={`p-12 text-center border rounded-2xl flex flex-col items-center justify-center ${
          theme === 'dark' ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-50 border-slate-250'
        }`}>
          <ImageIcon className="h-10 w-10 text-slate-500 mb-3" />
          <p className="text-xs font-bold uppercase tracking-wide">No screenshot predictions yet</p>
          <p className="text-[10px] text-slate-550 leading-relaxed max-w-sm mt-1">Configure your URL and start monitoring, or trigger an on-demand scan. Screenshots are captured every 1 minute.</p>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { 
  Sparkles, RefreshCw, AlertCircle, Image as ImageIcon,
  TrendingUp, TrendingDown, Minus, Activity, Target, 
  BarChart2, Clock, ArrowUp, ArrowDown, ChevronsLeftRight
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────

function DirectionBadge({ direction, size = 'sm' }) {
  const iconClass = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  if (direction === 'UP' || direction === 'BULLISH') {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-400 font-black uppercase tracking-wide">
        <ArrowUp className={iconClass} /> {direction}
      </span>
    );
  }
  if (direction === 'DOWN' || direction === 'BEARISH') {
    return (
      <span className="inline-flex items-center gap-1 text-rose-400 font-black uppercase tracking-wide">
        <ArrowDown className={iconClass} /> {direction}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-amber-400 font-black uppercase tracking-wide">
      <ChevronsLeftRight className={iconClass} /> {direction || 'SIDEWAYS'}
    </span>
  );
}

function ConfidenceBar({ value, theme }) {
  const pct = Math.min(100, Math.max(0, value || 0));
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className={`w-full h-1.5 rounded-full ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'} overflow-hidden`}>
      <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ScreenshotComparator({ 
  activePrediction, viewMode, setViewMode, targetUrl, 
  onTriggerScan, isTriggering, monitoringStatus, predictionsError, theme 
}) {
  const pj = activePrediction?.prediction_json || {};
  const predictions = pj.predictions || {};
  const indicators = pj.indicators || {};
  const tradeSetup = pj.trade_setup || {};
  const techAnalysis = pj.technical_analysis || {};
  const signal = pj.signal;
  const currentValue = pj.current_value;
  const isMock = pj.is_mock;

  const signalColor = signal === 'BUY' 
    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
    : signal === 'SELL'
    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
    : 'bg-amber-500/10 border-amber-500/30 text-amber-400';

  const darkCard = theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200';
  const labelCls = 'text-[9px] uppercase tracking-widest font-bold text-slate-500';
  const valueCls = `text-xs font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`;

  const predEntries = [
    { key: '15_minutes', label: '15 Min' },
    { key: '1_hour',     label: '1 Hour' },
    { key: '4_hours',    label: '4 Hours' },
    { key: '24_hours',   label: '24 Hours' },
  ];

  return (
    <div className={`glass-panel p-6 rounded-2xl border relative overflow-hidden ${
      theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800/40 pb-4 mb-5 gap-3">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-500" />
            Screenshot Comparator &amp; AI Prediction
          </h3>
          <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
            Visually detect changes and analyze trend lines automatically
            {isMock && (
              <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[8px] font-black uppercase">
                Mock Mode
              </span>
            )}
          </p>
        </div>

        {targetUrl && (
          <button
            onClick={onTriggerScan}
            disabled={isTriggering || monitoringStatus !== 'active'}
            title={monitoringStatus !== 'active' ? 'Start monitoring to enable scans' : 'Force an on-demand monitoring cycle'}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 disabled:pointer-events-none text-white font-extrabold text-[11px] uppercase transition-all flex items-center gap-1.5 shadow cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isTriggering ? 'animate-spin' : ''}`} />
            <span>Scan Now (On-Demand)</span>
          </button>
        )}
      </div>

      {predictionsError && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs mb-4">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="font-semibold">{predictionsError}</span>
        </div>
      )}

      {activePrediction ? (
        <div className="space-y-5 animate-fade-in">

          {/* ── Row 1: Image + Core Metrics ── */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">

            {/* Screenshot Panel */}
            <div className="md:col-span-7 space-y-3">
              {/* Toggle */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 max-w-[280px]">
                <button
                  onClick={() => setViewMode('original')}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    viewMode === 'original' ? 'bg-slate-800 text-cyan-400 border border-slate-700' : 'text-slate-400'
                  }`}
                >
                  Original view
                </button>
                <button
                  onClick={() => setViewMode('highlighted')}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    viewMode === 'highlighted' ? 'bg-slate-800 text-rose-400 border border-slate-700' : 'text-slate-400'
                  }`}
                >
                  Highlights diff
                </button>
              </div>

              {/* Image */}
              <div className={`relative rounded-xl overflow-hidden border aspect-video flex items-center justify-center ${
                theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
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
                      <p className="text-[10px] font-medium leading-relaxed max-w-xs mx-auto">
                        This screenshot did not contain significant visual differences compared to the previous capture.
                      </p>
                    </div>
                  )
                )}
              </div>

              <div className="text-[10px] text-slate-500 font-mono flex flex-col sm:flex-row justify-between gap-1">
                <span>Captured At: {new Date(activePrediction.captured_at).toLocaleString()}</span>
                <span className="truncate">File: {activePrediction.image_path}</span>
              </div>
            </div>

            {/* Core Metrics */}
            <div className="md:col-span-5 flex flex-col gap-3">

              {/* Current Price + Signal */}
              <div className={`p-4 rounded-xl border ${darkCard} flex items-center justify-between gap-3`}>
                <div>
                  <span className={labelCls}>Current Value</span>
                  <div className="text-lg font-black text-cyan-400 mt-0.5 font-mono">
                    {currentValue ? `₹${parseFloat(currentValue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                  </div>
                </div>
                {signal && (
                  <div className={`px-3 py-2 rounded-xl border text-center ${signalColor}`}>
                    <span className={labelCls + ' block mb-0.5'}>Signal</span>
                    <span className="text-sm font-black uppercase">{signal}</span>
                  </div>
                )}
              </div>

              {/* Sentiment, Confidence, Trend */}
              <div className={`p-4 rounded-xl border space-y-3 ${darkCard}`}>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">AI Sentiment:</span>
                  <span className={`font-black uppercase text-xs tracking-wider ${
                    pj.market_sentiment === 'POSITIVE' ? 'text-emerald-500' :
                    pj.market_sentiment === 'NEGATIVE' ? 'text-rose-500' : 'text-amber-500'
                  }`}>
                    {pj.market_sentiment || activePrediction.prediction_json?.market_sentiment || 'NEUTRAL'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">AI Confidence:</span>
                  <span className="font-mono text-cyan-400 font-extrabold">{activePrediction.confidence_score}%</span>
                </div>
                <ConfidenceBar value={activePrediction.confidence_score} theme={theme} />
                <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800/40">
                  <span className="text-slate-500 font-semibold">Visual Trend:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[10px] border uppercase ${
                    activePrediction.trend_direction === 'BULLISH' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                    activePrediction.trend_direction === 'BEARISH' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}>
                    {activePrediction.trend_direction}
                  </span>
                </div>
              </div>

              {/* Indicators */}
              {(indicators.rsi !== undefined || indicators.macd_trend) && (
                <div className={`p-4 rounded-xl border ${darkCard} space-y-2`}>
                  <span className={labelCls + ' flex items-center gap-1.5'}><Activity className="h-3 w-3 text-purple-400" />Indicators</span>
                  {indicators.rsi !== undefined && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-semibold">RSI:</span>
                      <span className={`font-mono font-bold ${
                        indicators.rsi > 70 ? 'text-rose-400' : indicators.rsi < 30 ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {indicators.rsi}
                        <span className="text-slate-500 font-normal ml-1">
                          {indicators.rsi > 70 ? '(Overbought)' : indicators.rsi < 30 ? '(Oversold)' : '(Neutral)'}
                        </span>
                      </span>
                    </div>
                  )}
                  {indicators.macd_trend && (
                    <div className="flex justify-between items-start text-xs gap-2">
                      <span className="text-slate-500 font-semibold shrink-0">MACD:</span>
                      <span className="font-semibold text-cyan-400 text-right">{indicators.macd_trend}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Row 2: Time-Based Predictions ── */}
          {Object.keys(predictions).length > 0 && (
            <div className={`p-4 rounded-xl border ${darkCard}`}>
              <span className={labelCls + ' flex items-center gap-1.5 mb-3'}><Clock className="h-3 w-3 text-cyan-400" />Time-Based Predictions</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {predEntries.map(({ key, label }) => {
                  const p = predictions[key];
                  if (!p) return null;
                  return (
                    <div
                      key={key}
                      className={`p-3 rounded-xl border text-center space-y-1.5 ${
                        theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      <span className={labelCls + ' block'}>{label}</span>
                      <DirectionBadge direction={p.direction} />
                      <ConfidenceBar value={p.confidence} theme={theme} />
                      <span className="text-[10px] text-slate-500 font-mono">{p.confidence}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Row 3: Support/Resistance + Trade Setup ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Support / Resistance */}
            {activePrediction.support_levels?.length > 0 && (
              <div className={`p-4 rounded-xl border space-y-2.5 ${darkCard}`}>
                <span className={labelCls + ' flex items-center gap-1.5'}><BarChart2 className="h-3 w-3 text-cyan-400" />Identified Pivot Levels</span>
                <div className="grid grid-cols-2 gap-3 text-xs font-mono font-bold">
                  <div className="p-2 rounded bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-center">
                    <span className="text-[8px] uppercase block text-slate-500 font-bold mb-1">Supports</span>
                    {activePrediction.support_levels.slice(0, 2).map((s, idx) => (
                      <div key={idx}>₹{parseFloat(s).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    ))}
                  </div>
                  <div className="p-2 rounded bg-rose-500/5 border border-rose-500/10 text-rose-400 text-center">
                    <span className="text-[8px] uppercase block text-slate-500 font-bold mb-1">Resistances</span>
                    {activePrediction.resistance_levels?.slice(0, 2).map((r, idx) => (
                      <div key={idx}>₹{parseFloat(r).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Trade Setup */}
            {(tradeSetup.entry_price || tradeSetup.stop_loss || tradeSetup.target_price) && (
              <div className={`p-4 rounded-xl border space-y-2.5 ${darkCard}`}>
                <span className={labelCls + ' flex items-center gap-1.5'}><Target className="h-3 w-3 text-emerald-400" />Trade Setup</span>
                <div className="space-y-2">
                  {[
                    { label: 'Entry', value: tradeSetup.entry_price, color: 'text-cyan-400' },
                    { label: 'Stop Loss', value: tradeSetup.stop_loss, color: 'text-rose-400' },
                    { label: 'Target', value: tradeSetup.target_price, color: 'text-emerald-400' },
                  ].map(({ label, value, color }) => value ? (
                    <div key={label} className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-semibold">{label}:</span>
                      <span className={`font-mono font-bold ${color}`}>
                        ₹{parseFloat(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ) : null)}
                  {tradeSetup.entry_price && tradeSetup.stop_loss && tradeSetup.target_price && (
                    <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-800/40">
                      <span className="text-slate-500 font-semibold">Risk:Reward:</span>
                      <span className="font-mono font-bold text-amber-400">
                        {Math.abs(
                          (tradeSetup.target_price - tradeSetup.entry_price) /
                          (tradeSetup.entry_price - tradeSetup.stop_loss)
                        ).toFixed(2)}x
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Row 4: Technical Analysis ── */}
          {Object.values(techAnalysis).some(Boolean) && (
            <div className={`p-4 rounded-xl border ${darkCard} space-y-3`}>
              <span className={labelCls + ' flex items-center gap-1.5'}><TrendingUp className="h-3 w-3 text-cyan-400" />Technical Analysis</span>
              {[
                { key: 'price_action_observations', label: 'Price Action' },
                { key: 'support_resistance_rationale', label: 'Support & Resistance' },
                { key: 'indicators_rationale', label: 'Indicators Rationale' },
              ].map(({ key, label }) => techAnalysis[key] ? (
                <div key={key} className="space-y-1">
                  <span className={labelCls}>{label}</span>
                  <p className={`text-[11px] leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    {techAnalysis[key]}
                  </p>
                </div>
              ) : null)}
            </div>
          )}

          {/* ── Row 5: AI Summary ── */}
          <div className={`pt-4 border-t border-slate-800/30`}>
            <span className={labelCls + ' flex items-center gap-1.5 mb-1.5'}><Sparkles className="h-3 w-3 text-cyan-400" />AI Auditor Summary</span>
            <p className="text-[11px] text-slate-400 leading-relaxed italic">
              "{activePrediction.ai_summary || 'No visual changes summary recorded for this session.'}"
            </p>
          </div>

        </div>
      ) : (
        <div className={`p-12 text-center border rounded-2xl flex flex-col items-center justify-center ${
          theme === 'dark' ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <ImageIcon className="h-10 w-10 text-slate-500 mb-3" />
          <p className="text-xs font-bold uppercase tracking-wide">No screenshot predictions yet</p>
          <p className="text-[10px] text-slate-500 leading-relaxed max-w-sm mt-1">
            Configure your URL and start monitoring, or trigger an on-demand scan. Screenshots are captured every 1 minute.
          </p>
        </div>
      )}
    </div>
  );
}

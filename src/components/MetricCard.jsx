import React from 'react';
import { TrendingUp, TrendingDown, HelpCircle, Shield, Award, Target } from 'lucide-react';

export default function MetricCard({ prediction }) {
  if (!prediction) {
    return (
      <div className="glass-panel p-6 rounded-2xl flex flex-col justify-center items-center h-48 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyanAccent mb-3"></div>
        <p className="text-sm">Awaiting first automated capture...</p>
      </div>
    );
  }

  const { extracted_metrics: metrics, forecast_results: forecast, captured_at } = prediction;
  const trend = forecast.forecast_trend;

  // Configuration map for dynamic trends
  const trendConfig = {
    up: {
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      glowClass: 'shadow-[0_0_15px_rgba(52,211,153,0.15)]',
      icon: <TrendingUp className="h-6 w-6 text-emerald-400" />,
      label: 'Bullish Continuation'
    },
    down: {
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/30',
      glowClass: 'shadow-[0_0_15px_rgba(244,63,94,0.15)]',
      icon: <TrendingDown className="h-6 w-6 text-rose-400" />,
      label: 'Bearish Correction'
    },
    sideways: {
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      glowClass: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]',
      icon: <HelpCircle className="h-6 w-6 text-amber-400" />,
      label: 'Sideways Consolidation'
    }
  };

  const currentTrend = trendConfig[trend] || trendConfig.sideways;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      
      {/* Dynamic Trend Card */}
      <div className={`glass-panel p-6 rounded-2xl border transition-all duration-300 ${currentTrend.borderColor} ${currentTrend.glowClass}`}>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Forecast Trend</p>
            <h3 className={`text-2xl font-bold mt-2 ${currentTrend.color}`}>
              {trend.toUpperCase()}
            </h3>
            <p className="text-xs text-slate-300 mt-1">{currentTrend.label}</p>
          </div>
          <div className={`p-3 rounded-xl ${currentTrend.bgColor}`}>
            {currentTrend.icon}
          </div>
        </div>
      </div>

      {/* Extracted Asset Value */}
      <div className="glass-panel p-6 rounded-2xl glass-panel-hover border border-white/5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Extracted Value</p>
            <h3 className="text-2xl font-bold mt-2 text-white font-mono">
              {metrics.current_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Read by AI Vision</p>
          </div>
          <div className="p-3 rounded-xl bg-cyanAccent/10">
            <Target className="h-6 w-6 text-cyanAccent" />
          </div>
        </div>
      </div>

      {/* Confidence Score Gauge */}
      <div className="glass-panel p-6 rounded-2xl glass-panel-hover border border-white/5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">AI Confidence</p>
            <div className="flex items-baseline mt-2 gap-2">
              <h3 className="text-2xl font-bold text-white font-mono">
                {forecast.confidence_score}%
              </h3>
              <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purpleAccent to-cyanAccent rounded-full" 
                  style={{ width: `${forecast.confidence_score}%` }}
                ></div>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1">Reasoning probability</p>
          </div>
          <div className="p-3 rounded-xl bg-purpleAccent/10">
            <Award className="h-6 w-6 text-purpleAccent" />
          </div>
        </div>
      </div>

      {/* Key Support/Resistance Levels */}
      <div className="glass-panel p-6 rounded-2xl glass-panel-hover border border-white/5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Support / Resistance</p>
            <div className="flex flex-col mt-1 gap-0.5">
              <span className="text-sm font-semibold text-emerald-400 font-mono">
                S: {metrics.support_level.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-sm font-semibold text-rose-400 font-mono">
                R: {metrics.resistance_level.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800">
            <Shield className="h-6 w-6 text-slate-300" />
          </div>
        </div>
      </div>

    </div>
  );
}

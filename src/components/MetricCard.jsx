import React from 'react';
import { TrendingUp, TrendingDown, HelpCircle, Shield, Award, Target, Zap, ShieldAlert } from 'lucide-react';

export default function MetricCard({ prediction }) {
  if (!prediction) {
    return (
      <div className="glass-panel p-6 rounded-2xl flex flex-col justify-center items-center h-48 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyanAccent mb-3"></div>
        <p className="text-sm">Awaiting first automated capture...</p>
      </div>
    );
  }

  // Extract variables, supporting both new schema and legacy fallback structures
  const trend = prediction.trend_direction || prediction.forecast_results?.forecast_trend || 'SIDEWAYS';
  const confidence = prediction.confidence_score || prediction.forecast_results?.confidence_score || 80;
  
  const supportLevels = prediction.support_levels || [];
  const resistanceLevels = prediction.resistance_levels || [];
  
  const predictionJson = prediction.prediction_json || {};
  const currentPrice = predictionJson.current_value || prediction.extracted_metrics?.current_value || 0;
  const sentiment = predictionJson.market_sentiment || 'NEUTRAL';
  const signal = predictionJson.signal || 'HOLD';
  const indicators = predictionJson.indicators || {};
  
  const rsi = indicators.rsi || prediction.extracted_metrics?.indicators?.rsi || 'N/A';
  const macd = indicators.macd_trend || prediction.extracted_metrics?.indicators?.macd_trend || 'Neutral';

  // Configuration map for dynamic trends
  const trendConfig = {
    BULLISH: {
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      glowClass: 'shadow-[0_0_20px_rgba(52,211,153,0.15)]',
      icon: <TrendingUp className="h-6 w-6 text-emerald-400" />,
      label: 'Bullish Continuation'
    },
    BEARISH: {
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/30',
      glowClass: 'shadow-[0_0_20px_rgba(244,63,94,0.15)]',
      icon: <TrendingDown className="h-6 w-6 text-rose-400" />,
      label: 'Bearish Correction'
    },
    SIDEWAYS: {
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      glowClass: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]',
      icon: <HelpCircle className="h-6 w-6 text-amber-400" />,
      label: 'Sideways Consolidation'
    }
  };

  const currentTrend = trendConfig[trend.toUpperCase()] || trendConfig.SIDEWAYS;

  // Signal badges color config
  const signalColors = {
    BUY: 'bg-emerald-500 text-white font-bold shadow-emerald-glow',
    SELL: 'bg-rose-500 text-white font-bold shadow-rose-glow',
    HOLD: 'bg-slate-700 text-slate-200'
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      
      {/* 1. Dynamic Trend & Trading Signal Card */}
      <div className={`glass-panel p-6 rounded-2xl border transition-all duration-300 ${currentTrend.borderColor} ${currentTrend.glowClass}`}>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">Trading Signal</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2.5 py-0.5 rounded-lg text-xs tracking-wider font-extrabold uppercase ${signalColors[signal] || signalColors.HOLD}`}>
                {signal}
              </span>
              <h3 className={`text-xl font-extrabold tracking-tight ${currentTrend.color}`}>
                {trend}
              </h3>
            </div>
            <p className="text-xs text-slate-300">{currentTrend.label}</p>
          </div>
          <div className={`p-3 rounded-xl ${currentTrend.bgColor}`}>
            {currentTrend.icon}
          </div>
        </div>
      </div>

      {/* 2. Current Extracted Price */}
      <div className="glass-panel p-6 rounded-2xl glass-panel-hover border border-slate-200/50 dark:border-white/5 shadow-glass">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider font-bold">Extracted Index Price</p>
            <h3 className="text-2xl font-bold mt-2 text-slate-900 dark:text-white font-mono tracking-tight">
              ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <Zap className="h-3 w-3 text-cyanAccent animate-pulse" /> Analyzed Live Value
            </p>
          </div>
          <div className="p-3 rounded-xl bg-cyanAccent/10">
            <Target className="h-6 w-6 text-cyanAccent" />
          </div>
        </div>
      </div>

      {/* 3. AI Confidence & Sentiment Gauge */}
      <div className="glass-panel p-6 rounded-2xl glass-panel-hover border border-slate-200/50 dark:border-white/5 shadow-glass">
        <div className="flex justify-between items-start">
          <div className="w-full">
            <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider font-bold">AI Sentiment & Confidence</p>
            <div className="flex items-baseline mt-2 gap-2 w-full justify-between">
              <div className="flex flex-col">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-mono leading-none">
                  {confidence}%
                </h3>
                <span className="text-[9px] uppercase font-semibold text-purpleAccent mt-1">{sentiment} SENTIMENT</span>
              </div>
              <div className="w-20 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shrink-0">
                <div 
                  className="h-full bg-gradient-to-r from-purpleAccent to-cyanAccent rounded-full" 
                  style={{ width: `${confidence}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-purpleAccent/10 shrink-0">
            <Award className="h-6 w-6 text-purpleAccent" />
          </div>
        </div>
      </div>

      {/* 4. Technical Levels: Multi S/R Zones & indicators */}
      <div className="glass-panel p-6 rounded-2xl glass-panel-hover border border-slate-200/50 dark:border-white/5 shadow-glass">
        <div className="flex justify-between items-start">
          <div className="w-full">
            <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider font-bold">Support & Resistance Levels</p>
            <div className="grid grid-cols-2 mt-2 gap-x-2 gap-y-1 text-xs font-mono">
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold">Support floors</span>
                {supportLevels.map((val, idx) => (
                  <span key={idx} className="text-emerald-500 font-bold">${val.toLocaleString()}</span>
                ))}
                {supportLevels.length === 0 && <span className="text-emerald-500 font-bold">${currentPrice * 0.98}</span>}
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold">Resistance ceilings</span>
                {resistanceLevels.map((val, idx) => (
                  <span key={idx} className="text-rose-500 font-bold">${val.toLocaleString()}</span>
                ))}
                {resistanceLevels.length === 0 && <span className="text-rose-500 font-bold">${currentPrice * 1.02}</span>}
              </div>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
            <Shield className="h-5 w-5 text-slate-600 dark:text-slate-350" />
          </div>
        </div>
      </div>

    </div>
  );
}

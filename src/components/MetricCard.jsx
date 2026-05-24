import React from 'react';
import { TrendingUp, TrendingDown, HelpCircle, Shield, Award, Target, Zap } from 'lucide-react';
import { translations, translateDynamic } from '../services/translations';

export default function MetricCard({ prediction, language = 'en' }) {
  const t = (key) => translations[language]?.[key] || translations['en']?.[key] || key;

  if (!prediction) {
    return (
      <div className="glass-panel p-6 rounded-lg flex flex-col justify-center items-center h-48 text-slate-400 border border-slate-200 dark:border-slate-800">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-slate-400 dark:border-slate-500 mb-3"></div>
        <p className="text-sm">{t('awaitingCapture')}</p>
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

  // Configuration map for dynamic trends (using flat borders and clear dashboard colors)
  const trendConfig = {
    BULLISH: {
      color: 'text-emerald-600 dark:text-emerald-450',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
      borderColor: 'border-emerald-200 dark:border-emerald-900/50',
      icon: <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
      label: t('bullishContinuation')
    },
    BEARISH: {
      color: 'text-rose-600 dark:text-rose-450',
      bgColor: 'bg-rose-50 dark:bg-rose-950/30',
      borderColor: 'border-rose-200 dark:border-rose-900/50',
      icon: <TrendingDown className="h-5 w-5 text-rose-600 dark:text-rose-400" />,
      label: t('bearishCorrection')
    },
    SIDEWAYS: {
      color: 'text-amber-600 dark:text-amber-450',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      borderColor: 'border-amber-200 dark:border-amber-900/50',
      icon: <HelpCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
      label: t('sidewaysConsolidation')
    }
  };

  const currentTrend = trendConfig[trend.toUpperCase()] || trendConfig.SIDEWAYS;

  // Signal badges color config (flat solid primary colors)
  const signalColors = {
    BUY: 'bg-emerald-600 text-white font-bold',
    SELL: 'bg-rose-600 text-white font-bold',
    HOLD: 'bg-slate-650 text-slate-100 dark:bg-slate-700 dark:text-slate-200'
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      
      {/* 1. Dynamic Trend & Trading Signal Card */}
      <div className={`glass-panel p-5 rounded-lg border ${currentTrend.borderColor}`}>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-slate-450 dark:text-slate-400 text-[10px] uppercase tracking-wider font-bold">{t('tradingSignal')}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded text-[10px] tracking-wider font-bold uppercase ${signalColors[signal] || signalColors.HOLD}`}>
                {translateDynamic(signal, language)}
              </span>
              <h3 className={`text-lg font-bold tracking-tight ${currentTrend.color}`}>
                {translateDynamic(trend, language)}
              </h3>
            </div>
            <p className="text-xs text-slate-550 dark:text-slate-400">{currentTrend.label}</p>
          </div>
          <div className={`w-10 h-10 flex items-center justify-center rounded shrink-0 ${currentTrend.bgColor}`}>
            {currentTrend.icon}
          </div>
        </div>
      </div>

      {/* 2. Current Extracted Price */}
      <div className="glass-panel p-5 rounded-lg border border-slate-300 dark:border-slate-800">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider font-bold">{t('extractedPrice')}</p>
            <h3 className="text-xl font-bold mt-2 text-slate-900 dark:text-white font-mono tracking-tight">
              ₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-slate-550 dark:text-slate-400 mt-1 flex items-center gap-1">
              <Zap className="h-3 w-3 text-slate-400 dark:text-slate-500" /> {t('analyzedLiveValue')}
            </p>
          </div>
          <div className="w-10 h-10 flex items-center justify-center rounded shrink-0 bg-slate-100 dark:bg-slate-900/50">
            <Target className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </div>
        </div>
      </div>

      {/* 3. AI Confidence & Sentiment Gauge */}
      <div className="glass-panel p-5 rounded-lg border border-slate-300 dark:border-slate-800">
        <div className="flex justify-between items-start">
          <div className="w-full">
            <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider font-bold">{t('aiSentimentConfidence')}</p>
            <div className="flex items-baseline mt-2 gap-2 w-full justify-between">
              <div className="flex flex-col">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white font-mono leading-none">
                  {confidence}%
                </h3>
                <span className="text-[9px] uppercase font-semibold text-slate-550 dark:text-slate-400 mt-1">{translateDynamic(sentiment, language)} {t('sentimentText')}</span>
              </div>
              <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden shrink-0">
                <div 
                  className="h-full bg-cyan-600 dark:bg-cyan-500 rounded-full" 
                  style={{ width: `${confidence}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div className="w-10 h-10 flex items-center justify-center rounded shrink-0 bg-slate-100 dark:bg-slate-900/50">
            <Award className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </div>
        </div>
      </div>

      {/* 4. Technical Levels: Multi S/R Zones & indicators */}
      <div className="glass-panel p-5 rounded-lg border border-slate-300 dark:border-slate-800">
        <div className="flex justify-between items-start">
          <div className="w-full">
            <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider font-bold">{t('supportResistance')}</p>
            <div className="grid grid-cols-2 mt-2 gap-x-2 gap-y-1 text-xs font-mono">
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-455 dark:text-slate-500 uppercase font-bold">{t('supportFloors')}</span>
                {supportLevels.map((val, idx) => (
                  <span key={idx} className="text-emerald-600 dark:text-emerald-450 font-bold">₹{val.toLocaleString('en-IN')}</span>
                ))}
                {supportLevels.length === 0 && <span className="text-emerald-600 dark:text-emerald-455 font-bold">₹{(currentPrice * 0.98).toLocaleString('en-IN')}</span>}
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-455 dark:text-slate-500 uppercase font-bold">{t('resistanceCeilings')}</span>
                {resistanceLevels.map((val, idx) => (
                  <span key={idx} className="text-rose-600 dark:text-rose-450 font-bold">₹{val.toLocaleString('en-IN')}</span>
                ))}
                {resistanceLevels.length === 0 && <span className="text-rose-600 dark:text-rose-455 font-bold">₹{(currentPrice * 1.02).toLocaleString('en-IN')}</span>}
              </div>
            </div>
          </div>
          <div className="w-10 h-10 flex items-center justify-center rounded shrink-0 bg-slate-100 dark:bg-slate-900/50">
            <Shield className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </div>
        </div>
      </div>

    </div>
  );
}

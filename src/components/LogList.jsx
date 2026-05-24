import React, { useState } from 'react';
import { Eye, Calendar, Clock, ChevronDown, ChevronUp, Info, TrendingUp, TrendingDown, Activity, Zap, Trash2, Check, X } from 'lucide-react';
import { translations, translateDynamic } from '../services/translations';

export default function LogList({ 
  predictions = [], 
  onPreviewImage,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  onDeletePrediction,
  totalCount = 0,
  language = 'en'
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const t = (key) => translations[language]?.[key] || translations['en']?.[key] || key;

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
      <div className="glass-panel p-10 rounded-lg flex flex-col justify-center items-center text-slate-400 border border-slate-200 dark:border-slate-800 font-sans">
        <Info className="h-8 w-8 text-slate-500 mb-3" />
        <h4 className="text-sm font-bold text-slate-800 dark:text-white">{t('noPredictionsLogged')}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs text-center font-sans">
          {t('cronApschedulerInfo')}
        </p>
      </div>
    );
  }

  // Trend formatting configs (Clean flat dashboard borders)
  const trendBadges = {
    BULLISH: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40',
    BEARISH: 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/40',
    SIDEWAYS: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/40'
  };

  const signalBadges = {
    BUY: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-250 dark:border-emerald-900/50 font-bold',
    SELL: 'bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-250 dark:border-rose-900/50 font-bold',
    HOLD: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
  };

  const activeTotal = totalCount || predictions.length;

  return (
    <div className="space-y-4 font-sans">
      <div className="flex justify-between items-center px-2">
        <h3 className="text-base font-bold text-slate-850 dark:text-white tracking-tight">{t('predictionLogsArchive')}</h3>
        <span className="text-[11px] text-slate-550 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded border border-slate-200 dark:border-slate-700 font-mono">
          {t('totalLogs')}: {activeTotal}
        </span>
      </div>

      <div className="space-y-3">
        {predictions.map((item) => {
          const isExpanded = expandedId === item.id;
          
          const localeString = language === 'gu' ? 'gu-IN' : language === 'hi' ? 'hi-IN' : 'en-US';
          const formattedDate = new Date(item.captured_at).toLocaleDateString(localeString, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
          const formattedTime = new Date(item.captured_at).toLocaleTimeString(localeString, {
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
              className={`glass-panel rounded-lg overflow-hidden border transition-colors ${
                isExpanded ? 'border-cyan-600/50 dark:border-cyan-500/50 bg-slate-50/15 dark:bg-slate-900/30' : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Row Summary header */}
              <div 
                className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                onClick={() => toggleExpand(item.id)}
              >
                {/* Captured time */}
                <div className="flex items-center gap-3.5 w-full sm:w-auto">
                  <div className="relative group w-16 h-10 rounded overflow-hidden bg-slate-200 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shrink-0">
                    <img 
                      src={item.image_url} 
                      alt="Graph screenshot" 
                      className="w-full h-full object-cover"
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
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-white font-mono shrink-0">{t('scanHash')} #{item.id}</span>
                      <span className={`text-[9px] uppercase tracking-wide font-extrabold px-1.5 py-0.5 rounded border shrink-0 ${trendBadges[trend.toUpperCase()] || trendBadges.SIDEWAYS}`}>
                        {translateDynamic(trend, language)}
                      </span>
                      <span className={`text-[9px] uppercase tracking-wide font-extrabold px-1.5 py-0.5 rounded border shrink-0 ${signalBadges[signal] || signalBadges.HOLD}`}>
                        {translateDynamic(signal, language)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-550 dark:text-slate-400 text-[11px] mt-1 font-mono">
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
                      <p className="text-[9px] text-slate-400 dark:text-slate-555 uppercase font-bold tracking-wider">{t('symbol')}</p>
                      <p className="text-cyan-600 dark:text-cyan-400 font-bold">{item.stock_symbol}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-slate-400 dark:text-slate-555 uppercase font-bold tracking-wider">{t('currentValueHeader')}</p>
                      <p className="text-slate-800 dark:text-white font-bold">₹{parseFloat(currentPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-slate-400 dark:text-slate-555 uppercase font-bold tracking-wider">{t('confidenceHeader')}</p>
                      <p className="text-purple-600 dark:text-purple-400 font-bold">{confidence}%</p>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Delete action with safety confirmation */}
                    {confirmDeleteId === item.id ? (
                      <div 
                        className="flex items-center gap-1 shrink-0 bg-slate-100 dark:bg-slate-800 p-0.5 rounded border border-slate-200 dark:border-slate-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button 
                          onClick={() => handleDeleteClick(item.id)}
                          className="p-1 rounded bg-rose-600 text-white transition-colors"
                          title="Confirm Delete"
                          disabled={isDeleting}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => setConfirmDeleteId(null)}
                          className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-650 transition-colors"
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
                        className="p-1.5 rounded bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:border hover:border-rose-250 transition-colors shrink-0"
                        title="Delete log entry"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}

                    <button 
                      className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
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
                <div className="px-5 pb-5 pt-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs sm:text-sm space-y-6">
                  {/* Grid Layout containing advanced technical details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Column 1: Image details */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] uppercase text-cyan-600 dark:text-cyan-400 font-extrabold tracking-wider flex items-center gap-1">
                        <Zap className="h-3 w-3" /> {t('screenshotInfo')}
                      </h4>
                      <div className="space-y-1.5 text-slate-600 dark:text-slate-300 text-xs font-mono">
                        <p className="truncate"><span className="text-slate-450 dark:text-slate-500">{t('fileHeader')}</span> {item.image_path}</p>
                        <p className="truncate"><span className="text-slate-450 dark:text-slate-500">{t('sentimentHeader')}:</span> <span className="text-purple-600 dark:text-purple-400 font-bold">{translateDynamic(sentiment, language)}</span></p>
                        <button 
                          className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded transition-colors border border-slate-200 dark:border-slate-750 text-xs font-bold font-sans"
                          onClick={() => onPreviewImage(item.image_url)}
                        >
                          <Eye className="h-3.5 w-3.5" /> {t('openFullScreenshot')}
                        </button>
                      </div>
                    </div>

                    {/* Column 2: Extracted variables & Trade Setup */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-[10px] uppercase text-slate-600 dark:text-slate-400 font-extrabold tracking-wider mb-2">{t('technicalIndicators')}</h4>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs font-mono text-slate-600 dark:text-slate-350">
                          <div>
                            <p className="text-[9px] text-slate-450 dark:text-slate-500 uppercase font-bold">{t('supportLevelFloor')}</p>
                            {supportLevels.map((val, idx) => (
                              <p key={idx} className="text-emerald-600 dark:text-emerald-450 font-bold leading-tight">₹{parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                            ))}
                            {supportLevels.length === 0 && <p className="text-emerald-600 dark:text-emerald-450 font-bold">₹{(currentPrice * 0.985).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>}
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-455 dark:text-slate-500 uppercase font-bold">{t('resistanceLevelCeiling')}</p>
                            {resistanceLevels.map((val, idx) => (
                              <p key={idx} className="text-rose-600 dark:text-rose-450 font-bold leading-tight">₹{parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                            ))}
                            {resistanceLevels.length === 0 && <p className="text-rose-600 dark:text-rose-450 font-bold">₹{(currentPrice * 1.015).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>}
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-455 dark:text-slate-500 uppercase font-bold">{t('rsiMomentumTitle')}</p>
                            <p className="text-slate-800 dark:text-white font-bold">{rsi}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-455 dark:text-slate-500 uppercase font-bold">{t('macdCrossoverTitle')}</p>
                            <p className="text-slate-800 dark:text-white font-bold truncate uppercase">{macd}</p>
                          </div>
                        </div>
                      </div>

                      {predictionJson.trade_setup && (predictionJson.trade_setup.entry_price || predictionJson.trade_setup.stop_loss || predictionJson.trade_setup.target_price) && (
                        <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                          <h4 className="text-[10px] uppercase text-cyan-600 dark:text-cyan-400 font-extrabold tracking-wider mb-2">{t('aiTradeSetup')}</h4>
                          <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono">
                            <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded border border-slate-200 dark:border-slate-700 text-center">
                              <span className="text-[8px] text-slate-455 dark:text-slate-500 uppercase font-bold block">{t('entryBadge')}</span>
                              <span className="text-cyan-650 dark:text-cyan-400 font-bold">₹{parseFloat(predictionJson.trade_setup.entry_price || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded border border-slate-200 dark:border-slate-700 text-center">
                              <span className="text-[8px] text-slate-455 dark:text-slate-500 uppercase font-bold block">{t('stopLossBadge')}</span>
                              <span className="text-rose-600 dark:text-rose-450 font-bold">₹{parseFloat(predictionJson.trade_setup.stop_loss || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded border border-slate-200 dark:border-slate-700 text-center">
                              <span className="text-[8px] text-slate-455 dark:text-slate-500 uppercase font-bold block">{t('targetBadge')}</span>
                              <span className="text-emerald-650 dark:text-emerald-450 font-bold">₹{parseFloat(predictionJson.trade_setup.target_price || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Column 3: AI Reasoning & Step-by-Step Visual Audit */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-extrabold tracking-wider">{t('aiReasoningVisualAudit')}</h4>
                      <div className="space-y-2.5 text-xs">
                        <p className="text-slate-655 dark:text-slate-300 leading-relaxed font-sans">
                          {item.ai_summary}
                        </p>
                        
                        {predictionJson.technical_analysis && (
                          <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 space-y-2 text-[11px] font-sans">
                            {predictionJson.technical_analysis.price_action_observations && (
                              <div>
                                <span className="text-[9px] uppercase font-bold text-cyan-600 dark:text-cyan-400 tracking-wider block">{t('priceActionAnalysis')}</span>
                                <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{predictionJson.technical_analysis.price_action_observations}</p>
                              </div>
                            )}
                            {predictionJson.technical_analysis.support_resistance_rationale && (
                              <div>
                                <span className="text-[9px] uppercase font-bold text-emerald-600 dark:text-emerald-450 tracking-wider block">{t('srZonesJustification')}</span>
                                <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{predictionJson.technical_analysis.support_resistance_rationale}</p>
                              </div>
                            )}
                            {predictionJson.technical_analysis.indicators_rationale && (
                              <div>
                                <span className="text-[9px] uppercase font-bold text-purple-600 dark:text-purple-400 tracking-wider block">{t('momentumIndicatorsRationale')}</span>
                                <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{predictionJson.technical_analysis.indicators_rationale}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Projections Sub-panel (Only if forecast data exists) */}
                  {forecastTimeline && (
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                      <h4 className="text-[10px] uppercase text-slate-550 dark:text-slate-400 font-bold tracking-wider">{t('intervalForecastBreakdown')}</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {Object.entries(forecastTimeline).map(([interval, details], idx) => {
                          const dir = details.direction || 'SIDEWAYS';
                          const conf = details.confidence || 50;
                          
                          return (
                            <div key={idx} className="p-3 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                              <div>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block uppercase leading-none">
                                  {interval === '15_minutes' ? t('next15Mins') : interval === '1_hour' ? t('next1Hour') : interval === '4_hours' ? t('next4Hours') : t('next24Hours')}
                                </span>
                                <span className="text-xs font-mono font-bold mt-1.5 block text-slate-850 dark:text-slate-200">
                                  {dir === 'UP' ? '⬆ ' + t('up') : dir === 'DOWN' ? '⬇ ' + t('down') : '➡️ ' + t('sideways')}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 block uppercase font-bold">{t('accuracy')}</span>
                                <span className="text-xs font-mono text-purple-600 dark:text-purple-400 font-bold">{conf}%</span>
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
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {t('pageOf').replace('{current}', currentPage.toString()).replace('{total}', totalPages.toString())}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors font-bold border border-slate-200 dark:border-slate-750"
            >
              {t('previous')}
            </button>
            
            {/* Direct Page Selectors */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              if (totalPages > 6 && Math.abs(currentPage - p) > 1 && p !== 1 && p !== totalPages) {
                if (p === 2 || p === totalPages - 1) {
                  return <span key={p} className="px-1 text-slate-400 dark:text-slate-550 select-none">...</span>;
                }
                return null;
              }
              
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`px-2.5 py-1.5 rounded font-bold font-mono transition-colors border ${
                    currentPage === p
                      ? 'bg-cyan-600 text-white border-cyan-600'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-350 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors font-bold border border-slate-200 dark:border-slate-750"
            >
              {t('next')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

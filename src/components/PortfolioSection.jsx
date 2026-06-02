import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { translations, translateDynamic } from '../services/translations';

export default function PortfolioSection({ prediction, language = 'en' }) {
  const t = (key) => translations[language]?.[key] || translations['en']?.[key] || key;
  
  const [holdings, setHoldings] = useState([]);
  const [buyPrice, setBuyPrice] = useState('');
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('portfolio_holdings');
    if (saved) {
      try {
        setHoldings(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse portfolio_holdings', e);
      }
    }
  }, []);

  const saveHoldings = (newHoldings) => {
    setHoldings(newHoldings);
    localStorage.setItem('portfolio_holdings', JSON.stringify(newHoldings));
  };

  if (!prediction) {
    return null;
  }

  const symbol = prediction.symbol || 'UNKNOWN';
  const predictionJson = prediction.prediction_json || {};
  let currentPriceRaw = predictionJson.current_value || prediction.extracted_metrics?.current_value || 0;
  let currentPrice = 0;
  if (typeof currentPriceRaw === 'string') {
    currentPrice = parseFloat(currentPriceRaw.replace(/[^0-9.-]+/g, "")) || 0;
  } else {
    currentPrice = parseFloat(currentPriceRaw) || 0;
  }

  const currentHoldings = holdings.filter(h => h.symbol === symbol);

  const handleAddHolding = (e) => {
    e.preventDefault();
    if (!buyPrice || !quantity || isNaN(buyPrice) || isNaN(quantity)) return;
    
    const newHolding = {
      id: Date.now().toString(),
      symbol,
      buyPrice: parseFloat(buyPrice),
      quantity: parseFloat(quantity),
      date: new Date().toISOString()
    };
    
    saveHoldings([...holdings, newHolding]);
    setBuyPrice('');
    setQuantity('');
  };

  const handleDeleteHolding = (id) => {
    saveHoldings(holdings.filter(h => h.id !== id));
  };

  const getActionSuggestion = (buy, current) => {
    const diffPercent = ((current - buy) / buy) * 100;
    if (diffPercent >= 5) return 'SELL';
    if (diffPercent <= -5) return 'BUY';
    return 'HOLD';
  };

  const getSuggestionStyle = (action) => {
    switch (action) {
      case 'SELL': return 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30';
      case 'BUY': return 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30';
      default: return 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600';
    }
  };

  const getSuggestionText = (action) => {
    switch (action) {
      case 'SELL': return t('bookProfit');
      case 'BUY': return t('averageDown');
      default: return t('holdPosition');
    }
  };

  return (
    <div className="glass-panel p-5 rounded-lg border border-slate-200 dark:border-slate-800 relative z-30 mt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-850 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-cyan-600 dark:text-cyan-400" /> {t('portfolioManager')} - {symbol}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            {t('portfolioDesc')}
          </p>
        </div>
        
        <form onSubmit={handleAddHolding} className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="number"
            step="any"
            placeholder={t('buyPriceInput')}
            value={buyPrice}
            onChange={(e) => setBuyPrice(e.target.value)}
            className="w-32 px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-cyan-600 transition-colors text-slate-800 dark:text-white"
            required
          />
          <input
            type="number"
            step="any"
            placeholder={t('quantityInput')}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-24 px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-cyan-600 transition-colors text-slate-800 dark:text-white"
            required
          />
          <button
            type="submit"
            className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('addHolding')}</span>
          </button>
        </form>
      </div>

      <div className="space-y-3">
        {currentHoldings.length === 0 ? (
          <div className="text-center py-6 text-sm text-slate-500 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
            {t('noHoldings')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-2 font-bold px-2">{t('buyAt')}</th>
                  <th className="pb-2 font-bold px-2">{t('qty')}</th>
                  <th className="pb-2 font-bold px-2">{t('livePrice')}</th>
                  <th className="pb-2 font-bold px-2">{t('totalInvestment')}</th>
                  <th className="pb-2 font-bold px-2">{t('currentValue')}</th>
                  <th className="pb-2 font-bold px-2 text-right">{t('profitOrLoss')}</th>
                  <th className="pb-2 font-bold px-2 text-center">{t('actionSuggestion')}</th>
                  <th className="pb-2 font-bold px-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {currentHoldings.map((h) => {
                  const investment = h.buyPrice * h.quantity;
                  const currentValue = currentPrice * h.quantity;
                  const pl = currentValue - investment;
                  const plPercent = ((currentPrice - h.buyPrice) / h.buyPrice) * 100;
                  const action = getActionSuggestion(h.buyPrice, currentPrice);
                  const isProfit = pl >= 0;

                  return (
                    <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-2 font-mono font-bold text-slate-700 dark:text-slate-300">₹{h.buyPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-3 px-2 font-mono text-slate-600 dark:text-slate-400">{h.quantity}</td>
                      <td className="py-3 px-2 font-mono font-bold text-cyan-600 dark:text-cyan-400">₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-3 px-2 font-mono text-slate-600 dark:text-slate-400">₹{investment.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-3 px-2 font-mono font-bold text-slate-800 dark:text-white">₹{currentValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className={`py-3 px-2 text-right font-mono font-bold flex flex-col items-end ${isProfit ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-600 dark:text-rose-450'}`}>
                        <span className="flex items-center gap-1">
                          {isProfit ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          ₹{Math.abs(pl).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] opacity-80">{isProfit ? '+' : ''}{plPercent.toFixed(2)}%</span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${getSuggestionStyle(action)}`}>
                          {getSuggestionText(action)}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button onClick={() => handleDeleteHolding(h.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded transition-colors" title="Remove">
                          <Minus className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

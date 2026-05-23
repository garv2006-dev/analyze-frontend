import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function ChartSection({ history }) {
  if (!history || history.length === 0) {
    return (
      <div className="glass-panel p-8 rounded-2xl flex flex-col justify-center items-center h-80 text-slate-400">
        <p className="text-sm">Insufficient data logs to render charts.</p>
      </div>
    );
  }

  // Check if data points span multiple calendar days
  let spanMultipleDays = false;
  if (history.length > 1) {
    const firstDate = new Date(history[0].captured_at).toDateString();
    const lastDate = new Date(history[history.length - 1].toDateString || history[history.length - 1].captured_at).toDateString();
    spanMultipleDays = firstDate !== lastDate;
  }

  // Reverse history so it flows left-to-right (chronological) in the chart
  const chartData = [...history].reverse().map(item => {
    // Graceful support for both new schema and legacy format
    const supportList = item.support_levels || [];
    const resistanceList = item.resistance_levels || [];
    
    const legacySupport = item.extracted_metrics?.support_level || 0;
    const legacyResistance = item.extracted_metrics?.resistance_level || 0;
    
    const support = supportList.length > 0 ? supportList[0] : legacySupport;
    const resistance = resistanceList.length > 0 ? resistanceList[0] : legacyResistance;
    
    const predictionJson = item.prediction_json || {};
    const price = predictionJson.current_value || item.extracted_metrics?.current_value || 0;
    const confidence = item.confidence_score || item.forecast_results?.confidence_score || 80;

    const dateObj = new Date(item.captured_at);
    const timeLabel = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateLabel = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const finalLabel = spanMultipleDays ? `${dateLabel} ${timeLabel}` : timeLabel;
    
    return {
      time: finalLabel,
      price: floatVal(price),
      confidence: intVal(confidence),
      support: floatVal(support),
      resistance: floatVal(resistance),
    };
  });

  function floatVal(val) {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0.0 : parsed;
  }

  function intVal(val) {
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? 0 : parsed;
  }

  // Calculate dynamic left Y-axis bounds based on actual visible prices
  const activePrices = chartData.map(d => d.price).filter(p => p > 0);
  const minPrice = activePrices.length ? Math.min(...activePrices) : 20000;
  const maxPrice = activePrices.length ? Math.max(...activePrices) : 25000;
  const priceRange = maxPrice - minPrice;
  const yPadding = priceRange * 0.12 || 100;
  const leftDomainMin = Math.max(0, Math.floor(minPrice - yPadding));
  const leftDomainMax = Math.ceil(maxPrice + yPadding);
  const leftDomain = [leftDomainMin, leftDomainMax];

  // Fetch the latest support/resistance levels from the most recent scan
  const latestItem = history[0];
  const activeSupports = (latestItem?.support_levels || (latestItem?.extracted_metrics?.support_level ? [latestItem.extracted_metrics.support_level] : [])).map(v => floatVal(v));
  const activeResistances = (latestItem?.resistance_levels || (latestItem?.extracted_metrics?.resistance_level ? [latestItem.extracted_metrics.resistance_level] : [])).map(v => floatVal(v));

  // Custom tooltips for premium dark-mode styling
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel p-4 rounded-xl border border-white/10 text-xs shadow-2xl font-sans">
          <p className="text-slate-400 font-semibold mb-2">{label}</p>
          <p className="text-cyanAccent font-mono mb-1">
            Index Value: <span className="font-bold text-white">₹{floatVal(payload[0].value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </p>
          <p className="text-purpleAccent font-mono">
            AI Confidence: <span className="font-bold text-white">{intVal(payload[1].value)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/5 shadow-glass relative overflow-hidden">
      {/* Decorative blur element inside the card */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-cyanAccent/5 rounded-full filter blur-3xl pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">Timeline Analytics</h3>
          <p className="text-xs text-slate-400">Chronological correlation between AI predictions and market trajectories</p>
        </div>
        
        {/* Legends / Indicators */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyanAccent shadow-cyan-glow"></span>
            <span className="text-slate-300 font-semibold">Extracted Value</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purpleAccent shadow-purple-glow"></span>
            <span className="text-slate-300 font-semibold">Confidence Score</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-emerald-400"></span>
            <span className="text-emerald-400 font-semibold">Supports (S)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-rose-400"></span>
            <span className="text-rose-400 font-semibold">Resistances (R)</span>
          </div>
        </div>
      </div>

      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: -20, bottom: 0 }}
          >
            <defs>
              {/* Cyan gradient for Value */}
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
              </linearGradient>
              {/* Purple gradient for Confidence */}
              <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" vertical={false} />
            
            <XAxis 
              dataKey="time" 
              stroke="#64748b" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            
            {/* Dual Y-Axes */}
            <YAxis 
              yAxisId="left"
              domain={leftDomain}
              stroke="#64748b" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              stroke="#64748b" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Render Horizontal Support Levels from latest scan (filtered to prevent chart squishing) */}
            {activeSupports.filter(val => val > 0 && val >= leftDomainMin && val <= leftDomainMax).map((val, idx) => (
              <ReferenceLine
                key={`support-${idx}`}
                yAxisId="left"
                y={val}
                stroke="#10b981"
                strokeWidth={1}
                strokeDasharray="4 4"
                label={{ 
                  value: `S${idx + 1}: ₹${val.toLocaleString('en-IN')}`, 
                  position: 'insideBottomRight', 
                  fill: '#10b981', 
                  fontSize: 9,
                  fontWeight: 'bold',
                }}
              />
            ))}

            {/* Render Horizontal Resistance Levels from latest scan (filtered to prevent chart squishing) */}
            {activeResistances.filter(val => val > 0 && val >= leftDomainMin && val <= leftDomainMax).map((val, idx) => (
              <ReferenceLine
                key={`resistance-${idx}`}
                yAxisId="left"
                y={val}
                stroke="#ef4444"
                strokeWidth={1}
                strokeDasharray="4 4"
                label={{ 
                  value: `R${idx + 1}: ₹${val.toLocaleString('en-IN')}`, 
                  position: 'insideTopRight', 
                  fill: '#ef4444', 
                  fontSize: 9,
                  fontWeight: 'bold',
                }}
              />
            ))}

            {/* Extracted value area chart */}
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="price" 
              stroke="#06b6d4" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorPrice)" 
            />

            {/* Confidence score area chart */}
            <Area 
              yAxisId="right"
              type="monotone" 
              dataKey="confidence" 
              stroke="#a855f7" 
              strokeWidth={2}
              strokeDasharray="4 4"
              fillOpacity={1} 
              fill="url(#colorConfidence)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

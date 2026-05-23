import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function ChartSection({ history }) {
  if (!history || history.length === 0) {
    return (
      <div className="glass-panel p-8 rounded-2xl flex flex-col justify-center items-center h-80 text-slate-400">
        <p className="text-sm">Insufficient data logs to render charts.</p>
      </div>
    );
  }

  // Reverse history so it flows left-to-right (chronological) in the chart
  const chartData = [...history].reverse().map(item => {
    const metrics = item.extracted_metrics;
    const forecast = item.forecast_results;
    const timeLabel = new Date(item.captured_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return {
      time: timeLabel,
      price: metrics.current_value,
      confidence: forecast.confidence_score,
      support: metrics.support_level,
      resistance: metrics.resistance_level,
    };
  });

  // Custom tooltips for premium dark-mode styling
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel p-4 rounded-xl border border-white/10 text-xs shadow-2xl font-sans">
          <p className="text-slate-400 font-semibold mb-2">{label}</p>
          <p className="text-cyanAccent font-mono mb-1">
            Value: <span className="font-bold text-white">${payload[0].value.toFixed(2)}</span>
          </p>
          <p className="text-purpleAccent font-mono">
            Confidence: <span className="font-bold text-white">{payload[1].value}%</span>
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
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyanAccent shadow-cyan-glow"></span>
            <span className="text-slate-300 font-semibold">Extracted Value</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purpleAccent shadow-purple-glow"></span>
            <span className="text-slate-300 font-semibold">Confidence Score</span>
          </div>
        </div>
      </div>

      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
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
              domain={['auto', 'auto']}
              stroke="#64748b" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${v.toFixed(0)}`}
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

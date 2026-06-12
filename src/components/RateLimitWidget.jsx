import React from 'react';
import { Activity, AlertCircle } from 'lucide-react';

export default function RateLimitWidget({ rateLimits, theme }) {
  return (
    <div className={`glass-panel p-6 rounded-2xl border ${
      theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
        <Activity className="h-4 w-4 text-cyan-500" /> AI Requests Rate Limits
      </h3>

      {rateLimits ? (
        <div className="space-y-4">
          {/* Minute limit */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-slate-400">Request Rate (Per Minute)</span>
              <span className="text-cyan-500 font-mono">{rateLimits.usage.minute} / {rateLimits.limits.max_per_minute}</span>
            </div>
            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-900">
              <div 
                className="h-full bg-cyan-500 transition-all duration-500" 
                style={{ width: `${Math.min(100, (rateLimits.usage.minute / rateLimits.limits.max_per_minute) * 100)}%` }}
              />
            </div>
          </div>

          {/* Hour limit */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-slate-400">Request Rate (Per Hour)</span>
              <span className="text-cyan-500 font-mono">{rateLimits.usage.hour} / {rateLimits.limits.max_per_hour}</span>
            </div>
            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-900">
              <div 
                className="h-full bg-cyan-500 transition-all duration-500" 
                style={{ width: `${Math.min(100, (rateLimits.usage.hour / rateLimits.limits.max_per_hour) * 100)}%` }}
              />
            </div>
          </div>

          {/* Day limit */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-slate-400">Request Rate (Per Day)</span>
              <span className="text-cyan-500 font-mono">{rateLimits.usage.day} / {rateLimits.limits.max_per_day}</span>
            </div>
            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-900">
              <div 
                className="h-full bg-cyan-500 transition-all duration-500" 
                style={{ width: `${Math.min(100, (rateLimits.usage.day / rateLimits.limits.max_per_day) * 100)}%` }}
              />
            </div>
          </div>

          {/* Blocked request logs if any */}
          {rateLimits.blocked_requests && rateLimits.blocked_requests.length > 0 && (
            <div className="pt-3 border-t border-slate-850 space-y-2">
              <span className="text-[9px] font-extrabold uppercase text-rose-450 tracking-wider">Blocked Attempts Audit</span>
              <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1">
                {rateLimits.blocked_requests.map((logItem) => (
                  <div key={logItem.id} className="p-2 rounded bg-rose-500/5 border border-rose-500/10 text-[9px] text-rose-300 leading-normal">
                    <div className="flex justify-between font-mono font-bold text-rose-400 mb-0.5">
                      <span>LIMIT BLOCKED</span>
                      <span>{new Date(logItem.timestamp).toLocaleTimeString()}</span>
                    </div>
                    {logItem.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <span className="text-xs text-slate-500">Retrieving statistics...</span>
      )}
    </div>
  );
}

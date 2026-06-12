import React from 'react';
import { ShieldCheck, Search, Filter, RefreshCw } from 'lucide-react';

export default function LogsPanel({ 
  auditLogs, logsLoading, logSearch, onLogSearchChange, 
  logFilter, onLogFilterChange, theme 
}) {
  return (
    <div className={`glass-panel p-6 rounded-2xl border ${
      theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-850 pb-4 mb-4 gap-3">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <ShieldCheck className="h-4.5 w-4.5 text-cyan-500" /> Real-time System Audit Logs
          </h3>
          <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Search and inspect all historical server audit records</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-550" />
            <input
              type="text"
              value={logSearch}
              onChange={(e) => onLogSearchChange(e.target.value)}
              placeholder="Search logs..."
              className={`pl-7 pr-3 py-1.5 w-full sm:w-40 rounded-lg text-[10px] placeholder-slate-650 border focus:outline-none focus:border-cyan-500 transition-colors ${
                theme === 'dark' ? 'bg-slate-950 border-slate-850 text-white' : 'bg-slate-50 border-slate-250 text-slate-900'
              }`}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-550" />
            <select
              value={logFilter}
              onChange={(e) => onLogFilterChange(e.target.value)}
              className={`pl-7 pr-4 py-1.5 rounded-lg text-[10px] border focus:outline-none focus:border-cyan-500 transition-colors appearance-none font-bold ${
                theme === 'dark' ? 'bg-slate-950 border-slate-850 text-white' : 'bg-slate-50 border-slate-250 text-slate-900'
              }`}
            >
              <option value="ALL">All Events</option>
              <option value="SCREENSHOT_CAPTURE">Captures</option>
              <option value="AI_PREDICTION">Predictions</option>
              <option value="RATE_LIMIT_BLOCKED">Rate Limits</option>
              <option value="AUTH_LOGIN">Logins</option>
              <option value="AUTH_REGISTER">Registers</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs list */}
      {logsLoading && auditLogs.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500">
          <RefreshCw className="h-6 w-6 animate-spin text-cyan-500 mx-auto mb-2" />
          Retrieving logs...
        </div>
      ) : auditLogs.length > 0 ? (
        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
          {auditLogs.map((logItem) => {
            // Determine log badge styles based on event type
            let badgeStyles = 'bg-slate-850 border-slate-700 text-slate-400';
            if (logItem.event_type.startsWith('AUTH_')) {
              badgeStyles = 'bg-blue-500/10 border-blue-500/25 text-blue-400';
            } else if (logItem.event_type.includes('BLOCKED')) {
              badgeStyles = 'bg-rose-500/10 border-rose-500/25 text-rose-455';
            } else if (logItem.event_type.includes('SUCCESS') || logItem.event_type.includes('CREATE')) {
              badgeStyles = 'bg-emerald-500/10 border-emerald-500/25 text-emerald-450';
            } else if (logItem.event_type.includes('SCREENSHOT') || logItem.event_type.includes('AI_')) {
              badgeStyles = 'bg-cyan-500/10 border-cyan-500/25 text-cyan-400';
            }
            
            return (
              <div 
                key={logItem.id} 
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row justify-between sm:items-center gap-2 ${
                  theme === 'dark' ? 'bg-slate-950/60 border-slate-850/60 hover:bg-slate-950' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border tracking-wider ${badgeStyles}`}>
                      {logItem.event_type}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono font-medium">
                      {new Date(logItem.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    {logItem.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-8 text-center text-xs text-slate-500">
          No logs found matching filter criteria.
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { Clock, AlertCircle, Play, StopCircle, RefreshCw } from 'lucide-react';

export default function SchedulerController({ 
  monitoringStatus, isWithinHours, serverTime, serverTimezone, 
  monitoringLoading, monitoringError, targetUrl, onToggleMonitoring, theme 
}) {
  return (
    <div className={`glass-panel p-6 rounded-2xl border ${
      theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
        <Clock className="h-4 w-4 text-cyan-500" /> AI Scheduler Hours Control
      </h3>

      {monitoringError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-450 text-[10px] font-semibold mb-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{monitoringError}</span>
        </div>
      )}

      <div className="space-y-4">
        <div className={`p-4 rounded-xl border text-xs space-y-2 font-semibold ${
          theme === 'dark' ? 'bg-slate-950 border-slate-850 text-slate-350' : 'bg-slate-50 border-slate-250 text-slate-700'
        }`}>
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-500">Allowed Capture Window:</span>
            <span className="font-bold text-cyan-500">09:15 AM - 03:15 PM</span>
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-500">Server Clock:</span>
            <span className="font-mono text-white bg-slate-900 px-1.5 py-0.5 rounded font-black">{serverTime || "Checking..."}</span>
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-500">Timezone Scope:</span>
            <span className="font-bold">{serverTimezone || "UTC"}</span>
          </div>
        </div>

        {/* Warnings if outside hours */}
        {!isWithinHours && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-[10px] leading-relaxed font-semibold">
            ⚠️ **System Bypassed**: Active capture schedules are paused because the clock is currently outside 09:15 AM - 03:15 PM. You can click to view past runs history below.
          </div>
        )}

        {/* Action buttons */}
        {targetUrl && (
          <div className="space-y-2">
            {monitoringStatus === 'active' ? (
              <button
                onClick={() => onToggleMonitoring('inactive')}
                disabled={monitoringLoading}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                {monitoringLoading ? <RefreshCw className="h-4.5 w-4.5 animate-spin" /> : (
                  <>
                    <StopCircle className="h-4.5 w-4.5" />
                    <span>Stop AI Monitoring</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => onToggleMonitoring('active')}
                disabled={monitoringLoading || !targetUrl}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
              >
                {monitoringLoading ? <RefreshCw className="h-4.5 w-4.5 animate-spin" /> : (
                  <>
                    <Play className="h-4.5 w-4.5 fill-current" />
                    <span>Start AI Monitoring</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Globe, RefreshCw, AlertCircle } from 'lucide-react';

export default function TargetUrlManager({ targetUrl, onSaveUrl, onDeleteUrl, urlLoading, urlError, monitoringStatus, theme }) {
  const [urlInput, setUrlInput] = useState('');
  const [intervalInput, setIntervalInput] = useState(5);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveUrl(urlInput, intervalInput);
  };

  return (
    <div className={`glass-panel p-6 rounded-2xl border ${
      theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
        <Globe className="h-4 w-4 text-cyan-500" /> Target Website URL
      </h3>
      
      {urlError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-400 text-[10px] font-semibold mb-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{urlError}</span>
        </div>
      )}

      {!targetUrl ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-[11px] text-slate-550 font-medium">
            Configure the target URL you wish to monitor. You can only keep exactly one active URL at a time.
          </p>
          
          <div>
            <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1.5">Target URL</label>
            <div className="relative">
              <input
                type="text"
                required
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/charts"
                className={`w-full px-3 py-2.5 rounded-xl text-xs placeholder-slate-650 border focus:outline-none focus:border-cyan-500 transition-colors font-mono ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-350 text-slate-900'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1.5">Capture Interval</label>
            <select
              value={intervalInput}
              onChange={(e) => setIntervalInput(parseInt(e.target.value, 10))}
              className={`w-full px-3 py-2.5 rounded-xl text-xs border focus:outline-none focus:border-cyan-500 transition-colors font-semibold ${
                theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-350 text-slate-900'
              }`}
            >
              <option value={1}>Every 1 Minute</option>
              <option value={2}>Every 2 Minutes</option>
              <option value={3}>Every 3 Minutes</option>
              <option value={5}>Every 5 Minutes</option>
              <option value={10}>Every 10 Minutes</option>
              <option value={15}>Every 15 Minutes</option>
              <option value={30}>Every 30 Minutes</option>
              <option value={60}>Every 60 Minutes (1 Hour)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={urlLoading || !urlInput.trim()}
            className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs uppercase tracking-wide transition-colors flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
          >
            {urlLoading ? <RefreshCw className="h-4.5 w-4.5 animate-spin" /> : "Save Target URL"}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className={`p-4 rounded-xl border font-mono text-xs break-all ${
            theme === 'dark' ? 'bg-slate-950 border-slate-850 text-slate-350' : 'bg-slate-50 border-slate-250 text-slate-700'
          }`}>
            <span className="text-[9px] uppercase tracking-wider block font-bold text-slate-500 mb-1">Active Target</span>
            {targetUrl.url}
          </div>
          
          <div className="flex items-center justify-between border-b border-slate-800/20 pb-2">
            <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">Interval:</span>
            <span className="text-xs font-mono font-bold text-cyan-400">
              {targetUrl.interval_minutes} {targetUrl.interval_minutes === 1 ? 'minute' : 'minutes'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">Status Badge:</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
              monitoringStatus === 'active' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
            }`}>
              {monitoringStatus === 'active' ? '● Monitoring Active' : 'Stopped'}
            </span>
          </div>

          <button
            onClick={onDeleteUrl}
            disabled={urlLoading}
            className="w-full py-2.5 rounded-xl border border-rose-500/30 hover:bg-rose-550/10 text-rose-400 font-bold text-xs uppercase tracking-wide transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {urlLoading ? <RefreshCw className="h-4.5 w-4.5 animate-spin" /> : "Delete URL Configuration"}
          </button>
        </div>
      )}
    </div>
  );
}

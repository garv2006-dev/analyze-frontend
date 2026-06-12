import React from 'react';
import { Image as ImageIcon, Search } from 'lucide-react';

export default function CaptureGallery({ predictions, activePrediction, onSelectPrediction, theme }) {
  if (predictions.length <= 1) return null;
  
  return (
    <div className={`glass-panel p-6 rounded-2xl border ${
      theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
        <ImageIcon className="h-4 w-4 text-cyan-500" /> Historical Captures Gallery
      </h3>

      <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-slate-800">
        {predictions.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectPrediction(item)}
            className={`flex-shrink-0 w-28 cursor-pointer group rounded-xl overflow-hidden border transition-all hover:scale-[1.02] ${
              activePrediction?.id === item.id 
                ? 'border-cyan-500 shadow-md shadow-cyan-500/10' 
                : 'border-slate-850 hover:border-slate-750'
            }`}
          >
            <div className="aspect-video bg-slate-950 relative overflow-hidden">
              <img 
                src={item.image_url} 
                alt="Past Capture" 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Search className="h-4.5 w-4.5 text-cyan-400" />
              </div>
            </div>
            <div className="p-1.5 bg-slate-950 text-center">
              <span className="text-[8px] font-mono font-bold text-slate-400 block">
                {new Date(item.captured_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className={`text-[7px] font-bold uppercase ${
                item.trend_direction === 'BULLISH' ? 'text-emerald-500' : item.trend_direction === 'BEARISH' ? 'text-rose-500' : 'text-slate-400'
              }`}>
                {item.trend_direction}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

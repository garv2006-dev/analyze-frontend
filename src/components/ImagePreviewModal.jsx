import React, { useEffect } from 'react';
import { X, ZoomIn } from 'lucide-react';

export default function ImagePreviewModal({ isOpen, imageUrl, onClose }) {
  // Listen for escape key press to close lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-opacity duration-300"
      onClick={onClose}
    >
      <div 
        className="relative max-w-4xl w-full bg-slate-900/90 rounded-2xl border border-white/10 overflow-hidden shadow-2xl animate-in scale-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Overlay */}
        <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center z-10">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-cyanAccent/20 border border-cyanAccent/30 text-cyanAccent text-[10px] uppercase font-bold tracking-wider">Live Screenshot</span>
            <span className="text-xs text-slate-300 truncate max-w-xs">{(imageUrl || '').replace('/screenshots/', '')}</span>
          </div>
          <button 
            className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-slate-300 hover:text-white transition-colors border border-white/10"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Screenshot Image Container */}
        <div className="w-full flex items-center justify-center bg-slate-950 p-4 pt-16 min-h-[300px]">
          <img 
            src={imageUrl} 
            alt="Graph scan high-resolution view" 
            className="max-h-[70vh] object-contain rounded-lg border border-white/5 shadow-2xl transition-all duration-300 hover:scale-[1.02]"
          />
        </div>

        {/* Footer Overlay */}
        <div className="p-4 bg-slate-950 flex justify-between items-center text-xs text-slate-400 border-t border-white/5">
          <p className="flex items-center gap-1.5"><ZoomIn className="h-3.5 w-3.5 text-cyanAccent" /> Hover image to zoom in</p>
          <button 
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold transition-colors"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

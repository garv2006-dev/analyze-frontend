import React, { useEffect } from 'react';
import { X, Eye } from 'lucide-react';

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      onClick={onClose}
    >
      <div 
        className="relative max-w-4xl w-full bg-slate-900 rounded-lg border border-slate-800 overflow-hidden shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Overlay */}
        <div className="absolute top-0 inset-x-0 p-4 bg-slate-900/90 flex justify-between items-center z-10 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] uppercase font-bold tracking-wider">Live Screenshot</span>
            <span className="text-xs text-slate-400 truncate max-w-xs">{(imageUrl || '').replace('/screenshots/', '')}</span>
          </div>
          <button 
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
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
            className="max-h-[70vh] object-contain rounded border border-slate-850 shadow-md"
          />
        </div>

        {/* Footer Overlay */}
        <div className="p-4 bg-slate-900 flex justify-between items-center text-xs text-slate-400 border-t border-slate-800">
          <p className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5 text-slate-500" /> High-Resolution Screenshot Capture</p>
          <button 
            className="px-3.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded font-semibold transition-colors border border-slate-700"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

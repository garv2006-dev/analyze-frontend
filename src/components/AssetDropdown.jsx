import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Trash2, Folder, BarChart2 } from 'lucide-react';

export default function AssetDropdown({
  value,
  onChange,
  targets,
  onDeleteTarget,
  placeholder = "Quick Select Saved Asset...",
  isConsole = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (symbol) => {
    onChange(symbol);
    setIsOpen(false);
  };

  const handleDelete = (e, symbol) => {
    e.stopPropagation(); // Prevent selecting the asset when clicking delete
    if (onDeleteTarget) {
      onDeleteTarget(symbol);
    }
  };

  return (
    <div className="relative select-none" ref={dropdownRef}>
      {/* Dropdown Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full gap-2 px-4 py-2 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer border shadow-sm outline-none ${
          isConsole 
            ? "sm:w-56 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-950 dark:hover:bg-slate-900 border-slate-350 dark:border-white/10 text-slate-850 dark:text-slate-200 focus:border-cyanAccent" 
            : "bg-slate-200/80 hover:bg-slate-350 dark:bg-slate-900/60 dark:hover:bg-slate-800 text-slate-850 dark:text-slate-200 border-slate-350 dark:border-white/5 focus:border-cyanAccent"
        }`}
      >
        <span className="flex items-center gap-1.5 truncate">
          {value === 'ALL' ? (
            <>
              <Folder className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>{isConsole ? placeholder : "ALL WORKSPACES"}</span>
            </>
          ) : (
            <>
              <BarChart2 className="h-3.5 w-3.5 text-cyanAccent shrink-0" />
              <span className="uppercase">{value}</span>
            </>
          )}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu List */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-full min-w-[220px] rounded-xl glass-panel border border-slate-250 dark:border-white/10 shadow-glass py-1.5 z-[999] overflow-hidden animate-in fade-in-50 slide-in-from-top-1 duration-150">
          {/* ALL option */}
          <div
            onClick={() => handleSelect('ALL')}
            className={`flex items-center justify-between px-3 py-2 text-xs font-bold cursor-pointer transition-all ${
              value === 'ALL'
                ? "bg-gradient-to-r from-cyanAccent/15 to-blue-500/10 text-cyanAccent dark:text-cyanAccent border-l-2 border-cyanAccent"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-250/60 dark:hover:bg-slate-800/80"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Folder className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>{isConsole ? placeholder : "ALL WORKSPACES"}</span>
            </span>
          </div>

          {/* Target items */}
          <div className="max-h-60 overflow-y-auto">
            {targets.map((t) => {
              const isSelected = value.toUpperCase() === t.symbol.toUpperCase();
              return (
                <div
                  key={t.symbol}
                  onClick={() => handleSelect(t.symbol.toUpperCase())}
                  className={`group flex items-center justify-between px-3 py-2.5 text-xs font-bold cursor-pointer transition-all ${
                    isSelected
                      ? "bg-gradient-to-r from-cyanAccent/15 to-blue-500/10 text-cyanAccent dark:text-cyanAccent border-l-2 border-cyanAccent"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-250/60 dark:hover:bg-slate-800/80"
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate mr-2">
                    <BarChart2 className="h-3.5 w-3.5 text-cyanAccent shrink-0" />
                    <span className="uppercase">{t.symbol}</span>
                  </span>
                  
                  {/* Delete Option */}
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, t.symbol)}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded-md hover:bg-rose-500/15 dark:hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-450 transition-all shrink-0"
                    title="Delete saved asset"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

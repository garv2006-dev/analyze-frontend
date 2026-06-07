import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Trash2, Folder, BarChart2, Plus, Link, Check, X, Loader } from 'lucide-react';

export default function AssetDropdown({
  value,
  onChange,
  targets,
  onDeleteTarget,
  onAddTarget,
  placeholder = "Quick Select Saved Asset...",
  isConsole = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [addError, setAddError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const dropdownRef = useRef(null);
  const symbolInputRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowAddForm(false);
        setAddError('');
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Focus symbol input when add form is shown
  useEffect(() => {
    if (showAddForm && symbolInputRef.current) {
      symbolInputRef.current.focus();
    }
  }, [showAddForm]);

  const handleSelect = (symbol) => {
    onChange(symbol);
    setIsOpen(false);
    setShowAddForm(false);
  };

  const handleDelete = (e, symbol) => {
    e.stopPropagation();
    if (onDeleteTarget) {
      onDeleteTarget(symbol);
    }
  };

  const handleOpenAddForm = (e) => {
    e.stopPropagation();
    setShowAddForm(true);
    setNewSymbol('');
    setNewUrl('');
    setAddError('');
  };

  const handleCancelAdd = (e) => {
    e && e.stopPropagation();
    setShowAddForm(false);
    setAddError('');
  };

  const handleSubmitAdd = async (e) => {
    e && e.stopPropagation();
    const sym = newSymbol.trim().toUpperCase();
    const url = newUrl.trim();
    if (!sym) { setAddError('Symbol is required'); return; }
    if (!url) { setAddError('Chart URL is required'); return; }
    if (!/^https?:\/\/.+/.test(url)) { setAddError('Enter a valid URL starting with http(s)://'); return; }
    if (targets.some(t => t.symbol.toUpperCase() === sym)) {
      setAddError(`"${sym}" already exists in your watchlist`);
      return;
    }
    setAddError('');
    setIsAdding(true);
    try {
      await onAddTarget(sym, url);
      setShowAddForm(false);
      setNewSymbol('');
      setNewUrl('');
      // Auto-select newly added asset
      onChange(sym);
      setIsOpen(false);
    } catch (err) {
      setAddError(err.message || 'Failed to save asset');
    } finally {
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmitAdd(e);
    if (e.key === 'Escape') handleCancelAdd(e);
  };

  return (
    <div className="relative select-none" ref={dropdownRef}>
      {/* Dropdown Toggle Button */}
      <button
        type="button"
        onClick={() => { setIsOpen(!isOpen); if (isOpen) setShowAddForm(false); }}
        className={`flex items-center justify-between w-full gap-2 px-3 py-2 rounded-lg text-xs font-bold font-sans transition-colors cursor-pointer border shadow-sm outline-none ${
          isConsole 
            ? "sm:w-56 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:border-cyan-600" 
            : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 focus:border-cyan-600"
        }`}
      >
        <span className="flex items-center gap-1.5 truncate">
          {value === 'ALL' ? (
            <>
              <Folder className="h-4 w-4 text-amber-500 shrink-0" />
              <span>{isConsole ? placeholder : "ALL WORKSPACES"}</span>
            </>
          ) : (
            <>
              <BarChart2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <span className="uppercase">{value}</span>
            </>
          )}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu List */}
      {isOpen && (
        <div className="absolute left-0 mt-1 w-full min-w-[260px] rounded-lg border border-slate-300 dark:border-slate-800 shadow-lg z-[999] bg-white dark:bg-slate-800 flex flex-col overflow-hidden">
          {/* ALL option */}
          <div
            onClick={() => handleSelect('ALL')}
            className={`flex items-center justify-between px-3 py-2 text-xs font-bold cursor-pointer transition-colors ${
              value === 'ALL'
                ? "bg-slate-100 dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 border-l-2 border-cyan-600"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Folder className="h-4 w-4 text-amber-500 shrink-0" />
              <span>{isConsole ? placeholder : "ALL WORKSPACES"}</span>
            </span>
          </div>

          {/* Target items */}
          <div className="max-h-56 overflow-y-auto flex flex-col">
            {targets.map((t) => {
              const isSelected = value.toUpperCase() === t.symbol.toUpperCase();
              return (
                <div
                  key={t.symbol}
                  onClick={() => handleSelect(t.symbol.toUpperCase())}
                  className={`group flex items-center justify-between px-3 py-2 text-xs font-bold cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-slate-100 dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 border-l-2 border-cyan-600"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate mr-2">
                    <BarChart2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                    <span className="uppercase">{t.symbol}</span>
                  </span>
                  
                  {/* Delete Option */}
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, t.symbol)}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded hover:bg-rose-500/10 text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-450 transition-colors shrink-0"
                    title="Delete saved asset"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200 dark:border-slate-700" />

          {/* Add New Asset Section */}
          {showAddForm ? (
            <div className="p-3 flex flex-col gap-2" onClick={e => e.stopPropagation()}>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <Plus className="h-3 w-3" /> Add New Asset
              </p>

              {/* Symbol Input */}
              <div className="relative">
                <input
                  ref={symbolInputRef}
                  type="text"
                  placeholder="Symbol (e.g. RELIANCE)"
                  value={newSymbol}
                  onChange={e => { setNewSymbol(e.target.value.toUpperCase()); setAddError(''); }}
                  onKeyDown={handleKeyDown}
                  maxLength={20}
                  className="w-full px-2.5 py-1.5 text-[11px] rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-cyan-500 text-slate-800 dark:text-white font-mono font-bold uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-400 transition-colors"
                />
              </div>

              {/* URL Input */}
              <div className="relative flex items-center">
                <Link className="absolute left-2 h-3 w-3 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Chart URL (https://...)"
                  value={newUrl}
                  onChange={e => { setNewUrl(e.target.value); setAddError(''); }}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-6 pr-2.5 py-1.5 text-[11px] rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-cyan-500 text-slate-800 dark:text-white font-mono placeholder:font-normal placeholder:text-slate-400 transition-colors"
                />
              </div>

              {/* Error message */}
              {addError && (
                <p className="text-[10px] text-rose-500 font-semibold">{addError}</p>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSubmitAdd}
                  disabled={isAdding}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white text-[11px] font-bold transition-colors"
                >
                  {isAdding ? (
                    <><Loader className="h-3 w-3 animate-spin" /><span>Saving...</span></>
                  ) : (
                    <><Check className="h-3 w-3" /><span>Save Asset</span></>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancelAdd}
                  className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-[11px] font-bold transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ) : (
            /* Add New button row */
            <button
              type="button"
              onClick={handleOpenAddForm}
              className="flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/5 dark:hover:bg-cyan-500/10 transition-colors cursor-pointer w-full text-left"
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              <span>Add New Asset...</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

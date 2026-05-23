import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Sparkles, TrendingUp, ShieldAlert, Activity, AlertCircle } from 'lucide-react';
import { chatWithAI } from '../services/api';

export default function ChatBot({ activePredictionId, stockSymbol }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I am your Aether AI Analyst. I have loaded the latest real-time chart intelligence and indicator readings. Ask me anything about supports/resistances, dynamic trends, RSI/MACD readings, or trading signal suggestions!"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Pre-configured technical quick-action prompts
  const quickPrompts = [
    { label: '🔍 Explain Trend', text: 'What is the dynamic trend direction and its confidence score?' },
    { label: '🛡️ Support/Resistance', text: 'Where are the key support floor and resistance ceiling pivot levels?' },
    { label: '⚡ Momentum Stats', text: 'Can you summarize the RSI and MACD momentum indicators for me?' },
    { label: '📈 Trading Signal', text: 'What is the primary action signal (BUY/SELL/HOLD) and key targets?' }
  ];

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputValue.trim();
    if (!text) return;

    if (!textToSend) {
      setInputValue('');
    }
    
    setError(null);
    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setIsSending(true);

    try {
      // Map frontend messages into backend format
      const apiMessages = newMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await chatWithAI(apiMessages, activePredictionId);
      if (response.success && response.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: response.reply }]);
      } else {
        throw new Error('Failed to fetch a complete reply from AI.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Network disruption while connecting to AI chatbot.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans text-xs sm:text-sm">
      
      {/* 1. Floating Circular Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-4 bg-gradient-to-tr from-cyanAccent to-purpleAccent hover:from-cyanAccent/95 hover:to-purpleAccent/95 text-white rounded-full shadow-[0_4px_25px_rgba(6,182,212,0.45)] hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center animate-bounce"
          title="Open AI Analyst Chat"
        >
          <MessageSquare className="h-6 w-6 text-white" />
        </button>
      )}

      {/* 2. Expanded Chat Panel */}
      {isOpen && (
        <div className="glass-panel w-[350px] sm:w-[400px] h-[550px] rounded-2xl flex flex-col shadow-[0_12px_40px_rgba(0,0,0,0.25)] border border-slate-200 dark:border-white/10 overflow-hidden transition-all duration-300">
          
          {/* Header */}
          <div className="p-4 bg-slate-100/90 dark:bg-slate-900/60 border-b border-slate-200 dark:border-white/5 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white font-sans text-sm tracking-tight flex items-center gap-1">
                  Aether AI Analyst <Sparkles className="h-3.5 w-3.5 text-purpleAccent" />
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">Focus: {stockSymbol || 'Active Chart'}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 dark:bg-[#070b13]/25 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800">
            {messages.map((msg, index) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div
                  key={index}
                  className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} animate-fade-in`}
                >
                  <div className={`max-w-[85%] p-3 rounded-2xl ${
                    isAssistant 
                      ? 'bg-slate-100/80 dark:bg-slate-900/70 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-200 rounded-tl-none shadow-sm' 
                      : 'bg-gradient-to-r from-cyanAccent to-blue-600 text-white rounded-tr-none shadow-cyan-glow'
                  }`}>
                    {/* Render paragraphs if response contains newlines */}
                    <div className="space-y-1.5 leading-relaxed font-sans text-xs whitespace-pre-line">
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isSending && (
              <div className="flex justify-start">
                <div className="bg-slate-100/80 dark:bg-slate-900/70 border border-slate-200 dark:border-white/5 p-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}

            {/* Error Notification */}
            {error && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-500 text-[11px] font-sans">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Panel */}
          <div className="px-4 py-2 border-t border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20 shrink-0">
            <p className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500 mb-1.5">Quick Technical Scans</p>
            <div className="flex flex-wrap gap-1.5">
              {quickPrompts.map((qp, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(qp.text)}
                  disabled={isSending}
                  className="px-2 py-1 rounded bg-slate-200/75 dark:bg-slate-900 hover:bg-slate-300 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-white/10 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  {qp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Panel */}
          <div className="p-3 bg-slate-100/90 dark:bg-slate-900/60 border-t border-slate-200 dark:border-white/5 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask AI analyst about indicators/targets..."
                disabled={isSending}
                className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-250 dark:border-white/5 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyanAccent transition-colors text-xs disabled:opacity-55"
              />
              <button
                type="submit"
                disabled={isSending || !inputValue.trim()}
                className="p-2 rounded-xl bg-gradient-to-r from-cyanAccent to-blue-600 hover:from-cyanAccent/95 hover:to-blue-500 text-white shadow-cyan-glow flex items-center justify-center transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
}

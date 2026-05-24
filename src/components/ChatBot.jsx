import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Sparkles, TrendingUp, ShieldAlert, Activity, AlertCircle } from 'lucide-react';
import { chatWithAI } from '../services/api';
import { translations } from '../services/translations';

export default function ChatBot({ activePredictionId, stockSymbol, language = 'en' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: translations[language]?.chatbotWelcome || translations.en.chatbotWelcome
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);

  const t = (key) => translations[language]?.[key] || translations['en']?.[key] || key;

  // Dynamic welcome message translation when language changes
  useEffect(() => {
    setMessages(prev => {
      if (prev.length > 0 && prev[0].role === 'assistant') {
        const welcomeTexts = [
          translations.en.chatbotWelcome,
          translations.gu.chatbotWelcome,
          translations.hi.chatbotWelcome
        ];
        if (welcomeTexts.includes(prev[0].content)) {
          const updated = [...prev];
          updated[0] = {
            ...updated[0],
            content: t('chatbotWelcome')
          };
          return updated;
        }
      }
      return prev;
    });
  }, [language]);

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
    { label: '🔍 ' + t('explainTrend'), text: t('explainTrendPrompt') },
    { label: '🛡️ ' + t('supportResistance'), text: t('supportResistancePrompt') },
    { label: '⚡ ' + t('momentumStats'), text: t('momentumStatsPrompt') },
    { label: '📈 ' + t('tradingSignal'), text: t('tradingSignalPrompt') }
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
          className="p-3 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-full shadow-md transition-colors flex items-center justify-center border border-slate-700 dark:border-slate-655"
          title={t('askAiChatbot')}
        >
          <MessageSquare className="h-5 w-5 text-white" />
        </button>
      )}

      {/* 2. Expanded Chat Panel */}
      {isOpen && (
        <div className="glass-panel w-[350px] sm:w-[400px] h-[500px] rounded-lg flex flex-col shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
          
          {/* Header */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0"></span>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white font-sans text-xs tracking-tight flex items-center gap-1">
                  {t('aiAssistant')} <Sparkles className="h-3 w-3 text-slate-500" />
                </h4>
                <p className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold uppercase">{t('aiAssistantDesc').replace('{focus}', stockSymbol || t('allAssets'))}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-750 dark:hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-slate-950 scrollbar-thin">
            {messages.map((msg, index) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div
                  key={index}
                  className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[85%] p-2.5 rounded-lg ${
                    isAssistant 
                      ? 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-none' 
                      : 'bg-cyan-600 dark:bg-cyan-700 text-white rounded-tr-none'
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
                <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg rounded-tl-none flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}

            {/* Error Notification */}
            {error && (
              <div className="flex items-center gap-2 p-2.5 rounded bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-600 text-[11px] font-sans">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Panel */}
          <div className="px-3.5 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0">
            <p className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500 mb-1.5">{t('quickTechnicalScans')}</p>
            <div className="flex flex-wrap gap-1.5">
              {quickPrompts.map((qp, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(qp.text)}
                  disabled={isSending}
                  className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 text-[10px] font-bold border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  {qp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Panel */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
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
                placeholder={t('chatPlaceholder')}
                disabled={isSending}
                className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-600 transition-colors text-xs disabled:opacity-55"
              />
              <button
                type="submit"
                disabled={isSending || !inputValue.trim()}
                className="p-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:pointer-events-none"
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

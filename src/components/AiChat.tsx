import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Copy, Check, RotateCcw, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { toast } from './Toast';

interface Message { role: 'user' | 'assistant'; content: string; }

interface Props {
  activeFileContent: string;
  t: Record<string, string>;
  settings: {
    provider: string; model: string; apiKey: string;
    systemPrompt: string; customEndpoint: string; useCustom: boolean;
  };
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="absolute top-2 right-2 p-1 rounded bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all">
      {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
    </button>
  );
}

export default function AiChat({ activeFileContent, t, settings }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    if (!prompt.trim() || loading) return;
    const userMsg = { role: 'user' as const, content: prompt };
    setMessages(prev => [...prev, userMsg]);
    setPrompt('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          context: activeFileContent ? activeFileContent.slice(0, 2000) : '',
          provider: settings.useCustom ? 'custom' : settings.provider,
          model: settings.model,
          apiKey: settings.apiKey,
          systemPrompt: settings.systemPrompt,
          customEndpoint: settings.useCustom ? settings.customEndpoint : undefined,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${data.error}` }]);
        toast('error', data.error);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response || 'No response' }]);
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${e.message}` }]);
      toast('error', 'AI request failed');
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => setMessages([]);

  const SUGGESTIONS = [
    'Explain this code', 'Find bugs in my code', 'Write a test for this',
    'Refactor for readability', 'Add TypeScript types', 'Optimize performance',
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#334155] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <Bot size={14} className="text-white" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{t.ai}</span>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button onClick={clearChat} className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white" title="Clear chat">
              <RotateCcw size={13} />
            </button>
          )}
          <button onClick={() => setShowSettings(s => !s)} className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white">
            <ChevronDown size={13} className={`transition-transform ${showSettings ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Settings toggle */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}
            className="border-b border-[#334155] bg-[#0f172a]/50 px-3 py-2 text-[11px] text-gray-400 shrink-0"
          >
            <span>Provider: <strong className="text-white">{settings.useCustom ? 'Custom' : settings.provider}</strong></span>
            <span className="mx-2">·</span>
            <span>Model: <strong className="text-white">{settings.model || 'default'}</strong></span>
            {!settings.apiKey && !settings.useCustom && (
              <p className="mt-1 text-yellow-500 text-[10px]">⚠️ No API key set. Configure in Settings → AI Config.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center">
              <Bot size={32} className="text-blue-400 opacity-60" />
            </div>
            <p className="text-gray-600 text-sm">{t.askAi}</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => { setPrompt(s); }} className="text-[10px] px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-[#334155] rounded-full text-gray-400 hover:text-white transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`relative group max-w-[95%] rounded-xl text-[13px] leading-relaxed ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white px-4 py-2.5'
                : 'bg-[#1e293b] border border-[#334155] text-gray-200 px-4 py-3'
            }`}>
              {msg.role === 'assistant' && <CopyButton text={msg.content} />}
              <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-black/40 prose-pre:rounded-lg prose-code:text-blue-300 prose-code:bg-black/30 prose-code:px-1 prose-code:rounded">
                <Markdown>{msg.content}</Markdown>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <motion.div key={i} className="w-1.5 h-1.5 bg-blue-400 rounded-full"
                  animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                />
              ))}
            </div>
            <span>Thinking...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[#334155] shrink-0">
        <div className="flex items-end gap-2 bg-[#0f172a] border border-[#334155] rounded-xl px-3 py-2 focus-within:border-blue-500 transition-colors">
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
            placeholder={t.askAi}
            className="flex-1 bg-transparent text-[13px] text-white focus:outline-none resize-none max-h-32 min-h-[20px]"
            rows={1}
            style={{ height: 'auto' }}
            onInput={e => {
              const t = e.currentTarget;
              t.style.height = 'auto';
              t.style.height = Math.min(t.scrollHeight, 128) + 'px';
            }}
          />
          <button
            onClick={send}
            disabled={!prompt.trim() || loading}
            className="p-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-lg text-white transition-all shrink-0"
          >
            <Send size={14} />
          </button>
        </div>
        <p className="text-[10px] text-gray-600 mt-1.5">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}

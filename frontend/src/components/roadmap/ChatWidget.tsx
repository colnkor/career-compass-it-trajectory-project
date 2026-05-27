import React, { useState, useRef, useEffect } from 'react';
import authFetch from '../../utils/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatWidgetProps {
  professionId: number;
  /** Если передан — чат открывается сразу с контекстом топика */
  initialTopic?: {
    title: string;
    explanation: string;
  } | null;
  onClose: () => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  professionId,
  initialTopic,
  onClose,
}) => {
  const [history, setHistory] = useState<ChatMessage[]>(() => {
    if (initialTopic) {
      return [
        { role: 'user', content: `Объясни мне тему: ${initialTopic.title}` },
        { role: 'assistant', content: initialTopic.explanation },
      ];
    }
    return [];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Сбрасываем историю при смене топика (чат уже открыт)
  useEffect(() => {
    setHistory(
      initialTopic
        ? [
            { role: 'user', content: `Объясни мне тему: ${initialTopic.title}` },
            { role: 'assistant', content: initialTopic.explanation },
          ]
        : []
    );
    setError(null);
  }, [initialTopic]);

  // Скролл вниз при новых сообщениях
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  // Фокус на инпут при открытии
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const newHistory = [...history, userMsg];

    setHistory(newHistory);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await authFetch('/api/llm/talkto', {
        method: 'POST',
        body: JSON.stringify({
          history: newHistory,
          profession_id: professionId,
        }),
      });

      if (!res.ok) throw new Error('Ошибка ответа сервера');
      const data = await res.json();

      setHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch {
      setError('Ментор временно недоступен. Попробуй ещё раз.');
      // Откатываем последнее сообщение пользователя
      setHistory(prev => prev.slice(0, -1));
      setInput(text);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col w-[420px] max-h-[600px] rounded-2xl border border-white/10 bg-[#0d0e18] shadow-2xl shadow-black/50 overflow-hidden">

      {/* Шапка */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#6366f1]/20 border border-[#6366f1]/30 flex items-center justify-center text-sm">
            ✦
          </div>
          <div>
            <p className="text-white text-sm font-semibold">ИИ-ментор</p>
            {initialTopic && (
              <p className="text-[11px] text-gray-500 truncate max-w-[220px]">
                {initialTopic.title}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 min-h-0">
        {history.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-8">
            <div className="w-12 h-12 rounded-2xl bg-[#6366f1]/10 border border-[#6366f1]/20 flex items-center justify-center text-xl">
              ✦
            </div>
            <p className="text-gray-400 text-sm">Задай любой вопрос по теме.<br />Я помогу разобраться.</p>
          </div>
        )}

        {history.map((msg, i) => (
    <div
      key={i}
      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          msg.role === 'user'
            ? 'bg-[#6366f1] text-white rounded-br-sm whitespace-pre-wrap' // Для пользователя оставляем pre-wrap
            : 'bg-white/[0.06] text-gray-200 border border-white/[0.08] rounded-bl-sm'
        }`}
      >
        {msg.role === 'user' ? (
          // Сообщение пользователя выводим как обычный текст
          msg.content
        ) : (
          // Сообщение ИИ рендерим через Markdown с кастомными стилями элементов
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
              ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="text-gray-300">{children}</li>,
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noreferrer" className="text-[#6366f1] hover:underline">
                  {children}
                </a>
              ),
              // Кастомизация кода (инлайн и блоки кода)
              code({ node, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const isInline = !match;
                return isInline ? (
                  <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs text-indigo-300 font-mono" {...props}>
                    {children}
                  </code>
                ) : (
                  <pre className="bg-black/40 border border-white/5 p-3 rounded-xl my-2 overflow-x-auto font-mono text-xs text-emerald-400">
                    <code {...props}>{children}</code>
                  </pre>
                );
              },
            }}
          >
            {msg.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  ))}


        {/* Индикатор загрузки */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/[0.06] border border-white/[0.08] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-400 text-center">{error}</p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Инпут */}
      <div className="px-4 py-3 border-t border-white/[0.08] shrink-0">
        <div className="flex items-end gap-2 bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Задай вопрос... (Enter для отправки)"
            disabled={loading}
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 resize-none focus:outline-none max-h-32 disabled:opacity-50"
            style={{ lineHeight: '1.5' }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="w-8 h-8 rounded-lg bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shrink-0 cursor-pointer"
          >
            <svg className="w-4 h-4 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-gray-600 mt-1.5 text-center">Shift+Enter — перенос строки</p>
      </div>
    </div>
  );
};
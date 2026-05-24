import React, { useState } from 'react';
import { useRouteContext } from '@tanstack/react-router';
import type { RoadmapTopic } from '../../types/roadmap';
import authFetch from '../../utils/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TopicCardProps {
  topic: RoadmapTopic;
  index: number;
  professionId: number;
  isCompleted: boolean;
  isLast: boolean;
  onToggle: (topicId: number, completed: boolean) => void;
  onAskMentor: (topic: { title: string; explanation: string }) => void;
  onRequireAuth: () => void;
}

function parseResources(raw: string): string[] {
  return raw.split(',').map((r) => r.trim()).filter(Boolean);
}

function resourceIcon(url: string): string {
  if (url.includes('mozilla') || url.includes('mdn')) return '📘';
  if (url.includes('w3school'))                        return '📗';
  if (url.includes('freecodecamp'))                    return '🏕️';
  if (url.includes('hexlet'))                          return '🎓';
  if (url.includes('javascript.info'))                 return '📙';
  if (url.includes('css-tricks'))                      return '🎨';
  if (url.includes('htmlacademy'))                     return '🏫';
  return '🔗';
}

export const TopicCard: React.FC<TopicCardProps> = ({
  topic,
  index,
  professionId,
  isCompleted,
  isLast,
  onToggle,
  onAskMentor,
  onRequireAuth,
}) => {
  const { auth } = useRouteContext({ from: '__root__' });
  const [saving, setSaving] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explainError, setExplainError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const resources = parseResources(topic.resources ?? '');

  const handleToggle = async () => {
    if (!auth.isAuthenticated) { onRequireAuth(); return; }
    const next = !isCompleted;
    onToggle(topic.id, next);
    setSaving(true);
    try {
      await authFetch('/api/roadmap/progress', {
        method: 'POST',
        body: JSON.stringify({ profession_id: professionId, topic_id: topic.id, is_completed: next }),
      });
    } catch {
      onToggle(topic.id, !next);
    } finally {
      setSaving(false);
    }
  };

  const handleExplain = async () => {
    if (!auth.isAuthenticated) { onRequireAuth(); return; }
    if (explanation) { setExpanded(prev => !prev); return; }

    setExplaining(true);
    setExplainError(null);
    try {
      const res = await authFetch(`/api/roadmap/topic/${topic.id}/explain`, {
        method: 'POST',
        body: JSON.stringify({ profession_id: professionId, source: 'topic_detail' }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setExplanation(data.explanation);
      setExpanded(true);
    } catch {
      setExplainError('Не удалось получить объяснение. Попробуй позже.');
    } finally {
      setExplaining(false);
    }
  };

  const handleAskMentor = () => {
    if (!explanation) return;
    onAskMentor({ title: topic.title, explanation });
  };

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10 transition-all duration-300 ${
          isCompleted
            ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400'
            : 'bg-[#0d0e18] border-2 border-[#6366f1]/50 text-[#818cf8]'
        }`}>
          {isCompleted ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <span className="text-xs font-bold">{index + 1}</span>
          )}
        </div>
        {!isLast && <div className="w-px flex-1 mt-1 bg-white/[0.08]" />}
      </div>

      <div className={`flex-1 mb-6 rounded-2xl border p-5 flex flex-col gap-4 transition-all duration-300 ${
        isCompleted
          ? 'bg-emerald-500/[0.04] border-emerald-500/25'
          : 'bg-[#0d0e18] border-white/[0.08]'
      }`}>
        <div className="flex flex-col gap-1">
          <h3 className="text-white font-semibold text-base">{topic.title}</h3>
          <p className="text-gray-400 text-sm leading-relaxed">{topic.description}</p>
        </div>

        {resources.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {resources.map((r) => (
              <a key={r} href={r.startsWith('http') ? r : `https://${r}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-gray-400 bg-white/[0.05] border border-white/[0.08] px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/[0.08] transition-colors">
                <span>{resourceIcon(r)}</span>
                <span>{r.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
              </a>
            ))}
          </div>
        )}

        {expanded && explanation && (
          <div className="rounded-xl bg-[#6366f1]/[0.06] border border-[#6366f1]/20 p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs text-[#818cf8] font-semibold">
              <span>✦</span><span>Объяснение ИИ-ментора</span>
            </div>
            {/* Заменяем простой <p> на ReactMarkdown с кастомными компонентами */}
            <div className="text-gray-300 text-sm leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Добавляем стили для заголовков, которые использует ментор
                  h1: ({ children }) => <h1 className="text-xl font-bold text-white mt-5 mb-3">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-lg font-bold text-white mt-4 mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-base font-bold text-white mt-3 mb-2">{children}</h3>,
                  h4: ({ children }) => <h4 className="text-sm font-semibold text-white mt-2 mb-1">{children}</h4>,
                  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                  ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="text-gray-300">{children}</li>,
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noreferrer" className="text-[#818cf8] hover:underline">
                      {children}
                    </a>
                  ),
                  // Стилизация кода с адаптацией под цвета карточки ментора
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match;
                    return isInline ? (
                      <code className="bg-[#6366f1]/10 text-[#818cf8] px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                        {children}
                      </code>
                    ) : (
                      <pre className="bg-black/40 border border-[#6366f1]/10 p-3 rounded-xl my-3 overflow-x-auto font-mono text-xs text-emerald-400">
                        <code {...props}>{children}</code>
                      </pre>
                    );
                  },
                }}
              >
                {explanation}
              </ReactMarkdown>
            </div>
            <button onClick={handleAskMentor}
              className="self-start flex items-center gap-2 text-xs text-[#818cf8] hover:text-white bg-[#6366f1]/10 hover:bg-[#6366f1]/20 border border-[#6366f1]/20 px-3 py-1.5 rounded-lg transition-all cursor-pointer">
              <span>💬</span><span>Задать вопрос ментору</span>
            </button>
          </div>
        )}

        {explainError && <p className="text-xs text-red-400">{explainError}</p>}

        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={handleExplain} disabled={explaining}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-[#6366f1]/30 bg-[#6366f1]/10 text-[#818cf8] hover:text-white hover:bg-[#6366f1]/20 transition-all duration-200 disabled:opacity-50 cursor-pointer">
            {explaining ? (
              <><span className="animate-spin">⟳</span><span>Думаю...</span></>
            ) : explanation ? (
              <><span>✦</span><span>{expanded ? 'Скрыть объяснение' : 'Показать объяснение'}</span></>
            ) : (
              <><span>✦</span><span>Объяснить</span></>
            )}
          </button>

          <button onClick={handleToggle} disabled={saving}
            className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl border transition-all duration-200 disabled:opacity-50 cursor-pointer ${
              isCompleted
                ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/5'
                : 'text-gray-400 border-white/[0.08] bg-transparent hover:text-white hover:bg-white/[0.05]'
            }`}>
            <span>{isCompleted ? '✓' : '○'}</span>
            <span>{isCompleted ? 'Выполнено' : 'Отметить выполненным'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
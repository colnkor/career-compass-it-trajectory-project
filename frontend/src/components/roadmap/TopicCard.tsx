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
      const res = await authFetch('/api/roadmap/progress', {
        method: 'POST',
        body: JSON.stringify({ profession_id: professionId, topic_id: topic.id, is_completed: next }),
      });
      if (!res.ok) throw new Error('Не удалось сохранить прогресс');
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
      {/* Левая шкала (Timeline) */}
      <div className="flex flex-col items-center">
        <div className={`timeline-node shrink-0 z-10 transition-all duration-300 ${isCompleted ? 'done text-success' : 'text-muted'}`}>
          {isCompleted ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <span className="text-xs font-bold">{index + 1}</span>
          )}
        </div>
        {!isLast && <div className="timeline-line bg-border-soft" />}
      </div>

      {/* Основная панель темы карточки */}
      <div className={`topic-panel flex-1 flex flex-col gap-4 bg-card border border-border-soft p-5 rounded-2xl transition-all duration-300 ${isCompleted ? 'done opacity-70' : ''}`}>
        <div className="flex flex-col gap-1">
          <h3 className="text-text font-bold text-base md:text-lg transition-colors">{topic.title}</h3>
          <p className="text-muted text-sm leading-relaxed">{topic.description}</p>
        </div>

        {/* Полезные ресурсы */}
        {resources.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {resources.map((r) => (
              <a key={r} href={r.startsWith('http') ? r : `https://${r}`} target="_blank" rel="noopener noreferrer"
                className="resource-pill flex items-center gap-1.5 text-xs text-muted bg-bg/50 border border-border-soft px-3 py-1.5 rounded-xl hover:text-text hover:border-accent-light/30 hover:bg-accent/5 transition-all">
                <span>{resourceIcon(r)}</span>
                <span>{r.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
              </a>
            ))}
          </div>
        )}

        {/* Развернутый блок ИИ-ментора */}
        {expanded && explanation && (
          <div className="mentor-panel rounded-xl border border-accent/20 bg-card-strong p-4 flex flex-col gap-3 shadow-inner">
            <div className="flex items-center gap-2 text-xs text-accent-light font-semibold">
              <span>✦</span><span>Объяснение ИИ-ментора</span>
            </div>
            
            <div className="text-text/90 text-sm leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => <h1 className="text-xl font-bold text-text mt-5 mb-3">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-lg font-bold text-text mt-4 mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-base font-bold text-text mt-3 mb-2">{children}</h3>,
                  h4: ({ children }) => <h4 className="text-sm font-semibold text-text mt-2 mb-1">{children}</h4>,
                  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                  ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1 text-muted">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1 text-muted">{children}</ol>,
                  li: ({ children }) => <li className="text-text/90">{children}</li>,
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noreferrer" className="text-accent-light hover:underline font-medium">
                      {children}
                    </a>
                  ),
                  // Код адаптирован под новые переменные цвета v4
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match;
                    return isInline ? (
                      <code className="bg-accent/10 text-accent-light px-1.5 py-0.5 rounded text-xs font-mono border border-accent/10" {...props}>
                        {children}
                      </code>
                    ) : (
                      <pre className="bg-black/50 border border-border p-3 rounded-xl my-3 overflow-x-auto font-mono text-xs text-success">
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
              className="self-start flex items-center gap-2 text-xs text-accent-light hover:text-white bg-accent/10 hover:bg-accent/20 border border-accent-light/20 px-3 py-1.5 rounded-xl transition-all cursor-pointer">
              <span>💬</span><span>Задать вопрос ментору</span>
            </button>
          </div>
        )}

        {explainError && <p className="text-xs text-danger font-medium">{explainError}</p>}

        {/* Кнопки управления */}
        <div className="flex items-center gap-3 flex-wrap mt-1">
          <button onClick={handleExplain} disabled={explaining}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-full border border-accent-light/30 bg-accent/10 text-accent-light hover:text-white hover:bg-accent/20 transition-all duration-200 disabled:opacity-50 cursor-pointer shadow-sm">
            {explaining ? (
              <><span className="animate-spin">⟳</span><span>Думаю...</span></>
            ) : explanation ? (
              <><span>✦</span><span>{expanded ? 'Скрыть объяснение' : 'Показать объяснение'}</span></>
            ) : (
              <><span>✦</span><span>Объяснить</span></>
            )}
          </button>

          <button onClick={handleToggle} disabled={saving}
            className={`flex items-center gap-2 text-sm px-4 py-2 rounded-full border transition-all duration-200 disabled:opacity-50 cursor-pointer shadow-sm ${
              isCompleted
                ? 'text-success border-success/30 bg-success/10 hover:bg-success/5'
                : 'text-muted border-border-soft bg-transparent hover:text-text hover:bg-white/5'
            }`}>
            <span>{isCompleted ? '✓' : '○'}</span>
            <span>{isCompleted ? 'Выполнено' : 'Отметить выполненным'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
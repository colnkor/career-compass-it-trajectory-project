import React, { useState } from 'react';
import { createFileRoute, Link, useRouteContext } from '@tanstack/react-router';
import { Header } from '../../components/Header';
import { PhaseSidebar } from '../../components/roadmap/PhaseSidebar';
import { TopicCard } from '../../components/roadmap/TopicCard';
import { ChatWidget } from '../../components/roadmap/ChatWidget';
import { AuthModal } from '../../components/AuthModal';
import type { RoadmapPhase } from '../../types/roadmap';
import authFetch from '../../utils/api';

interface LoaderData {
  professionId: number;
  professionName: string;
  phases: RoadmapPhase[];
}

export const Route = createFileRoute('/roadmap/$professionid')({
  loader: async ({ params }): Promise<LoaderData> => {
    const [roadmapRes, professionRes] = await Promise.all([
      authFetch(`/api/roadmap/${params.professionid}`),
      authFetch(`/api/professions/${params.professionid}`),
    ]);
    if (!roadmapRes.ok) throw new Error(`Не удалось загрузить роадмап (${roadmapRes.status})`);
    if (!professionRes.ok) throw new Error(`Не удалось загрузить профессию (${professionRes.status})`);
    const phases: RoadmapPhase[] = await roadmapRes.json();
    const profession = await professionRes.json();
    return {
      professionId: Number(params.professionid),
      professionName: profession.name,
      phases: phases.sort((a, b) => a.order - b.order),
    };
  },
  component: RoadmapPage,
  pendingComponent: PendingState,
  errorComponent: ErrorState,
});

function RoadmapPage() {
  const { professionId, professionName, phases } = Route.useLoaderData();
  const { auth } = useRouteContext({ from: '__root__' });

  const [completedTopics, setCompletedTopics] = useState<Set<number>>(
    () => new Set(
      phases.flatMap((p) => p.topics)
        .filter((t) => t.is_completed === true)
        .map((t) => t.id)
    )
  );
  const [activePhaseId, setActivePhaseId] = useState<number>(() => phases[0]?.id ?? 0);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatTopic, setChatTopic] = useState<{ title: string; explanation: string } | null>(null);

  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const requireAuth = () => {
    setAuthMode('login');
    setAuthOpen(true);
  };

  const handleToggle = (topicId: number, completed: boolean) => {
    setCompletedTopics((prev) => {
      const next = new Set(prev);
      completed ? next.add(topicId) : next.delete(topicId);
      return next;
    });
  };

  const handleAskMentor = (topic: { title: string; explanation: string }) => {
    setChatTopic(topic);
    setChatOpen(true);
  };

  const handleOpenChat = () => {
    if (!auth.isAuthenticated) { requireAuth(); return; }
    setChatTopic(null);
    setChatOpen(true);
  };

  const activePhase = phases.find((p) => p.id === activePhaseId);
  const sortedTopics = activePhase ? [...activePhase.topics].sort((a, b) => a.order - b.order) : [];
  const totalTopics = phases.flatMap((p) => p.topics).length;
  const doneTopics = completedTopics.size;

  return (
    <div className="min-h-screen bg-[#080910] text-white">
      <Header />

      <div className="max-w-7xl mx-auto px-6 py-12 flex gap-10">
        <PhaseSidebar
          professionName={professionName}
          phases={phases}
          activePhaseId={activePhaseId}
          completedTopics={completedTopics}
          onPhaseClick={setActivePhaseId}
        />

        <main className="flex-1 min-w-0 flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Общий прогресс</span>
              <span>{doneTopics} / {totalTopics} топиков</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#6366f1] transition-all duration-500"
                style={{ width: totalTopics ? `${(doneTopics / totalTopics) * 100}%` : '0%' }}
              />
            </div>
          </div>

          {activePhase && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold tracking-[0.15em] text-[#818cf8] uppercase">
                Фаза {phases.findIndex((p) => p.id === activePhaseId) + 1}
              </span>
              <h2 className="text-3xl font-bold tracking-tight">{activePhase.title}</h2>
              {activePhase.description && (
                <p className="text-gray-400 text-sm mt-1">{activePhase.description}</p>
              )}
            </div>
          )}

          <div className="flex flex-col">
            {sortedTopics.map((topic, i) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                index={i}
                professionId={professionId}
                isCompleted={completedTopics.has(topic.id)}
                isLast={i === sortedTopics.length - 1}
                onToggle={handleToggle}
                onAskMentor={handleAskMentor}
                onRequireAuth={requireAuth}
              />
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t border-white/[0.06]">
            {(() => {
              const idx = phases.findIndex((p) => p.id === activePhaseId);
              return (
                <>
                  <button onClick={() => idx > 0 && setActivePhaseId(phases[idx - 1].id)}
                    disabled={idx === 0}
                    className="text-sm text-gray-500 hover:text-white disabled:opacity-0 transition-colors">
                    ← {idx > 0 ? phases[idx - 1].title : ''}
                  </button>
                  <button onClick={() => idx < phases.length - 1 && setActivePhaseId(phases[idx + 1].id)}
                    disabled={idx === phases.length - 1}
                    className="text-sm text-gray-500 hover:text-white disabled:opacity-0 transition-colors">
                    {idx < phases.length - 1 ? phases[idx + 1].title : ''} →
                  </button>
                </>
              );
            })()}
          </div>
        </main>
      </div>

      {!chatOpen && (
        <button onClick={handleOpenChat}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl bg-[#6366f1] hover:bg-[#4f46e5] shadow-lg shadow-[#6366f1]/30 flex items-center justify-center text-white text-xl transition-all hover:scale-105 cursor-pointer"
          title="Спросить ИИ-ментора">
          ✦
        </button>
      )}

      {chatOpen && (
        <ChatWidget
          professionId={professionId}
          initialTopic={chatTopic}
          onClose={() => setChatOpen(false)}
        />
      )}

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        mode={authMode}
        onModeChange={setAuthMode}
        showOAuth={false}
      />
    </div>
  );
}

function PendingState() {
  return (
    <div className="min-h-screen bg-[#080910] flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-2 h-2 rounded-full bg-[#6366f1] animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </div>
        <p className="text-gray-400 text-sm">Загружаем дорожную карту…</p>
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: Error }) {
  return (
    <div className="min-h-screen bg-[#080910] flex items-center justify-center px-6">
      <div className="flex flex-col items-center gap-5 max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-xl">✦</div>
        <div className="flex flex-col gap-2">
          <h2 className="text-white font-semibold text-lg">Не удалось загрузить роадмап</h2>
          <p className="text-gray-500 text-sm">Попробуй обновить страницу или вернуться к профессиям.</p>
        </div>
        {import.meta.env.DEV && (
          <pre className="w-full text-xs text-red-400/70 bg-white/5 border border-white/[0.06] p-4 rounded-xl text-left overflow-x-auto">
            {error.message}
          </pre>
        )}
        <div className="flex gap-3">
          <button onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white transition-colors">
            Обновить
          </button>
          <Link to="/professions"
            className="px-4 py-2 text-sm rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            К профессиям
          </Link>
        </div>
      </div>
    </div>
  );
}
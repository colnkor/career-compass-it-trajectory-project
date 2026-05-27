import React, { useState } from 'react';
import { createFileRoute, Link, useRouteContext } from '@tanstack/react-router';
import { Header } from '../../components/Header';
import { PhaseSidebar } from '../../components/roadmap/PhaseSidebar';
import { TopicCard } from '../../components/roadmap/TopicCard';
import { ChatWidget } from '../../components/roadmap/ChatWidget';
import { AuthModal } from '../../components/AuthModal';
import { Button } from '../../components/ui/Button';
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

// ─── Page ─────────────────────────────────────────────────────────────────────

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTopic, setChatTopic] = useState<{ title: string; explanation: string } | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const requireAuth = () => { setAuthMode('login'); setAuthOpen(true); };

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
  const phaseIdx = phases.findIndex((p) => p.id === activePhaseId);

  return (
    <div className="relative min-h-screen bg-bg text-text font-body">
      <div className="aurora-bg" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />

        <div className="w-[min(1400px,100%)] mx-auto px-7 py-10 flex gap-10">
          {/* Sidebar */}
          <PhaseSidebar
            professionName={professionName}
            phases={phases}
            activePhaseId={activePhaseId}
            completedTopics={completedTopics}
            onPhaseClick={setActivePhaseId}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          {/* Main */}
          <main className="flex-1 min-w-0 flex flex-col gap-8">
            {/* Mobile top bar */}
            <div className="flex items-center gap-3 lg:hidden">
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border-soft bg-card text-muted hover:text-text hover:border-accent-light/30 transition-all text-sm"
              >
                {/* Hamburger icon */}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span>Фазы</span>
              </button>
              {/* Active phase name on mobile */}
              {activePhase && (
                <span className="text-sm text-muted truncate">
                  Фаза {phaseIdx + 1} · {activePhase.title}
                </span>
              )}
            </div>
            {/* Progress bar */}
            <div className="flex flex-col gap-2 p-5 rounded-[18px] border border-border-soft bg-card backdrop-blur-sm">
              <div className="flex justify-between text-xs text-muted">
                <span>Общий прогресс</span>
                <span className="tabular-nums">{doneTopics} / {totalTopics} топиков</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-accent-light transition-all duration-500"
                  style={{ width: totalTopics ? `${(doneTopics / totalTopics) * 100}%` : '0%' }}
                />
              </div>
            </div>

            {/* Phase header */}
            {activePhase && (
              <div className="flex flex-col gap-1">
                <span className="text-[0.7rem] font-semibold tracking-[0.15em] uppercase text-accent-light">
                  Фаза {phaseIdx + 1}
                </span>
                <h2 className="font-display font-extrabold text-text tracking-[-0.055em] text-[clamp(1.65rem,3vw,2.15rem)]">
                  {activePhase.title}
                </h2>
                {activePhase.description && (
                  <p className="text-muted text-sm mt-1">{activePhase.description}</p>
                )}
              </div>
            )}

            {/* Timeline */}
            <div className="mt-[29px] flex flex-col gap-8">
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

            {/* Phase navigation */}
            <div className="flex justify-between pt-5 border-t border-white/[0.06]">
              <Button
                variant="outline"
                onClick={() => phaseIdx > 0 && setActivePhaseId(phases[phaseIdx - 1].id)}
                disabled={phaseIdx === 0}
                className="text-sm disabled:opacity-0"
              >
                ← {phaseIdx > 0 ? phases[phaseIdx - 1].title : ''}
              </Button>
              <Button
                variant="outline"
                onClick={() => phaseIdx < phases.length - 1 && setActivePhaseId(phases[phaseIdx + 1].id)}
                disabled={phaseIdx === phases.length - 1}
                className="text-sm disabled:opacity-0"
              >
                {phaseIdx < phases.length - 1 ? phases[phaseIdx + 1].title : ''} →
              </Button>
            </div>
          </main>
        </div>
      </div>

      {/* AI Mentor FAB */}
      {!chatOpen && (
        <button
          onClick={handleOpenChat}
          className="fixed bottom-[26px] right-[26px] z-40 w-[58px] h-[58px] rounded-[19px] text-white text-xl bg-gradient-to-br from-accent to-accent-light shadow-[0_14px_35px_rgba(83,74,183,0.45)] transition-transform duration-200 hover:scale-105 cursor-pointer flex items-center justify-center"
          title="Спросить ИИ-ментора"
        >
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

// ─── Pending ──────────────────────────────────────────────────────────────────

function PendingState() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-accent-light animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
        <p className="text-muted text-sm">Загружаем дорожную карту…</p>
      </div>
    </div>
  );
}

// ─── Error ────────────────────────────────────────────────────────────────────

function ErrorState({ error }: { error: Error }) {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="flex flex-col items-center gap-5 max-w-md text-center p-8 rounded-[22px] border border-border-soft bg-card backdrop-blur-xl shadow-glass">
        <div className="w-12 h-12 rounded-2xl bg-danger/10 border border-danger/20 flex items-center justify-center text-xl">
          ✦
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-text font-semibold text-lg">Не удалось загрузить роадмап</h2>
          <p className="text-muted text-sm leading-relaxed">
            Попробуй обновить страницу или вернуться к профессиям.
          </p>
        </div>
        {import.meta.env.DEV && (
          <pre className="w-full text-xs text-danger/70 bg-white/5 border border-white/[0.06] p-4 rounded-xl text-left overflow-x-auto">
            {error.message}
          </pre>
        )}
        <div className="flex gap-3">
          <Button variant="primary" onClick={() => window.location.reload()}>
            Обновить
          </Button>
          <Link to="/professions">
            <Button variant="outline">К профессиям</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
import { createFileRoute } from '@tanstack/react-router';
import { Header } from '../../components/Header';
import { ProfessionCard } from '../../components/recres/ProfessionCard';
import authFetch from '../../utils/api';
import type { Profession } from '../../types/profession';
import type { ProgressResponse } from '../../types/user';
import type { RoadmapPhase } from '../../types/roadmap';

interface LoaderData {
  professions: Profession[];
  progress: ProgressResponse[];
  counts: Record<number, number>;
}

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/professions/')({
  loader: async ({ context }): Promise<LoaderData> => {
    const profResponse = await fetch('/api/professions/');
    if (!profResponse.ok) throw new Error(`Не удалось загрузить профессии (${profResponse.status})`);
    const data: { professions: Profession[] } = await profResponse.json();

    let progress: ProgressResponse[] = [];
    let professionTopicCounts: Record<number, number> = {};

    if (context.auth?.isAuthenticated) {
      try {
        const progResponse = await authFetch('/api/roadmap/progress');
        if (progResponse.ok) progress = await progResponse.json();

        // Уникальные profession_id из прогресса
        const professionIdsWithProgress = [...new Set(progress.map((p) => p.profession_id))];

        // Загружаем роадмапы параллельно только для профессий с прогрессом
        const roadmapResults = await Promise.all(
          professionIdsWithProgress.map(async (id) => {
            const res = await authFetch(`/api/roadmap/${id}`);
            if (!res.ok) return { id, total: 0 };
            const phases: RoadmapPhase[] = await res.json();
            const total = phases.flatMap((p) => p.topics).length;
            return { id, total };
          })
        );

        professionTopicCounts = Object.fromEntries(
          roadmapResults.map(({ id, total }) => [id, total])
        );
        console.log(professionTopicCounts)
      } catch { /* прогресс необязателен */ }
    }

    return { professions: data.professions, progress, counts: professionTopicCounts };
  },

  component: ProfessionsPage,
  pendingComponent: PendingState,
  errorComponent: ErrorState,
});

// ─── Page ─────────────────────────────────────────────────────────────────────

function ProfessionsPage() {
  const { professions, progress, counts } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-[#080910] text-white">
      <div className="aurora-bg" />
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-14 flex flex-col gap-10">
      
        {/* Heading */}
        <div className="z-2 flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight">Все профессии</h1>
          <p className="text-gray-400 text-base">
            <span className="text-[#818cf8] font-medium">{professions.length}</span>{' '}
            {getProfessionsLabel(professions.length)} — выбери направление и начни учиться
          </p>
        </div>

        {/* Grid */}
{professions.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {professions.map((profession) => {
              const total = counts[profession.id] ?? 0;
              const entries = progress.filter((p) => p.profession_id === profession.id);
              const prog = entries.length > 0 && total > 0
                ? {
                    done: entries.filter((p) => p.is_completed).length,
                    total,
                    percent: Math.round((entries.filter((p) => p.is_completed).length / total) * 100),
                  }
                : null;
 
              return (
                <ProfessionCard
                  key={profession.id}
                  profession={profession}
                  progress={prog}
                />
              );
            })}
          </div>
        )}


      </main>
    </div>
  );
}

// ─── Empty ────────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/[0.08] flex items-center justify-center text-xl">
        🗂️
      </div>
      <p className="text-white font-medium">Профессии пока не добавлены</p>
      <p className="text-gray-500 text-sm">Загляни позже — каталог скоро пополнится</p>
    </div>
  );
}

// ─── Pending ──────────────────────────────────────────────────────────────────

function PendingState() {
  return (
    <div className="min-h-screen bg-[#080910] flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-[#6366f1] animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
        <p className="text-gray-400 text-sm">Загружаем профессии…</p>
      </div>
    </div>
  );
}

// ─── Error ────────────────────────────────────────────────────────────────────

function ErrorState({ error }: { error: Error }) {
  return (
    <div className="min-h-screen bg-[#080910] flex items-center justify-center px-6">
      <div className="flex flex-col items-center gap-5 max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-xl">
          ✦
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-white font-semibold text-lg">Не удалось загрузить профессии</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Попробуй обновить страницу. Если ошибка повторяется — зайди позже.
          </p>
        </div>
        {import.meta.env.DEV && (
          <pre className="w-full text-xs text-red-400/70 bg-white/5 border border-white/[0.06] p-4 rounded-xl text-left overflow-x-auto">
            {error.message}
          </pre>
        )}
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-sm rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white transition-colors"
        >
          Обновить страницу
        </button>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getProfessionsLabel(count: number): string {
  if (count % 100 >= 11 && count % 100 <= 19) return 'профессий';
  switch (count % 10) {
    case 1: return 'профессия';
    case 2:
    case 3:
    case 4: return 'профессии';
    default: return 'профессий';
  }
}
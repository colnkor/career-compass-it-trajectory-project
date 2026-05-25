import { createFileRoute, Link } from '@tanstack/react-router';
import { Header } from '../components/Header';
import { ProfessionsResult } from '../components/recres/ProfessionResult';
import type { RecommendResponse } from '../types/recommendation';
import type { Profession, ProfessionResult } from '../types/profession';

// ─── Constants ────────────────────────────────────────────────────────────────

const RECOMMEND_STORAGE_KEY = 'recommend_result';

// ─── Custom errors ────────────────────────────────────────────────────────────

class RejectedError extends Error {
  public reason: string | null;

  constructor(reason: string | null) {
    super('rejected');
    this.reason = reason;
  }
}

class NoResultError extends Error {
  constructor() {
    super('no_result');
  }
}

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/recommendations')({
  loader: async (): Promise<ProfessionResult[]> => {
    // 1. Читаем результат рекомендации из sessionStorage
    const raw = sessionStorage.getItem(RECOMMEND_STORAGE_KEY);
    if (!raw) throw new NoResultError();

    const recommendResult: RecommendResponse = JSON.parse(raw);

    // 2. Если ML отклонил — показываем причину
    if (recommendResult.status === 'rejected') {
      throw new RejectedError(recommendResult.reason);
    }

    // 3. Получаем полные данные профессий из БД
    const response = await fetch('/api/professions/');
    if (!response.ok) {
      throw new Error(`Не удалось загрузить данные профессий (${response.status})`);
    }

    const { professions }: { professions: Profession[] } = await response.json();

    // 4. Джойним по name, сохраняем порядок из рекомендации
    const professionMap = new Map(professions.map((p) => [p.name, p]));

    const results: ProfessionResult[] = recommendResult.professions
      .map(({ name, confidence }) => {
        const profession = professionMap.get(name);
        if (!profession) return null;
        return { profession, confidence };
      })
      .filter((r): r is ProfessionResult => r !== null);

    return results;
  },

  component: RecommendationsPage,
  pendingComponent: PendingState,
  errorComponent: ErrorState,
});

// ─── Page ─────────────────────────────────────────────────────────────────────

function RecommendationsPage() {
  const results = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-[#080910] text-white">
      <div className="aurora-bg" />
      <Header />
      <ProfessionsResult results={results} />
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
        <p className="text-gray-400 text-sm tracking-wide">
          Подбираем профессии под твой профиль…
        </p>
      </div>
    </div>
  );
}

// ─── Error ────────────────────────────────────────────────────────────────────

function ErrorState({ error }: { error: Error }) {
  const isRejected = error instanceof RejectedError;
  const isNoResult = error instanceof NoResultError;

  return (
    <div className="min-h-screen bg-[#080910] flex items-center justify-center px-6">
      <div className="flex flex-col items-center gap-5 max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#6366f1]/10 border border-[#6366f1]/20 flex items-center justify-center text-xl">
          {isRejected ? '🤔' : '✦'}
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-white font-semibold text-lg">
            {isRejected
              ? 'Опросник пройден некорректно'
              : isNoResult
                ? 'Результат не найден'
                : 'Что-то пошло не так'}
          </h2>

          <p className="text-gray-500 text-sm leading-relaxed">
            {isRejected
              ? (error as RejectedError).reason ??
                'Похоже, ответы не дали нам достаточно информации. Попробуй пройти опросник ещё раз — чем подробнее ответы, тем точнее результат.'
              : isNoResult
                ? 'Пожалуйста, сначала пройди опросник — без него мы не можем подобрать профессии.'
                : 'Не удалось загрузить рекомендации. Попробуй обновить страницу.'}
          </p>
        </div>

        {/* Детали ошибки только в dev */}
        {import.meta.env.DEV && !isRejected && !isNoResult && (
          <pre className="w-full text-xs text-red-400/70 bg-white/5 border border-white/[0.06] p-4 rounded-xl text-left overflow-x-auto">
            {error.message}
          </pre>
        )}

        <div className="flex gap-3">
          {!isNoResult && (
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white transition-colors"
            >
              Попробовать снова
            </button>
          )}
       <Link
          to="/questionnaire"
          className="px-4 py-2 text-sm rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
        >
          {/* Меняем текст динамически: если произошла ошибка, у человека остался черновик */}
          {isNoResult ? 'Перейти к опроснику' : 'Исправить ответы'}
        </Link>
        </div>
      </div>
    </div>
  );
}
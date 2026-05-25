import { useState } from 'react';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { Header } from '../components/Header';
import { ProfileHero } from '../components/profile/ProfileHero';
import { FavoriteProfessions } from '../components/profile/FavoriteProfessions';
import type { ProfessionWithProgress } from '../components/profile/FavoriteProfessions';
import { ActivityBlock } from '../components/profile/ActivityBlock';
import { SettingsBlock } from '../components/profile/SettingsBlock';
import type { User, ProgressResponse } from '../types/user';
import type { Profession } from '../types/profession';
import authFetch from '../utils/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoaderData {
  user: User;
  progress: ProgressResponse[];
  professionItems: ProfessionWithProgress[];
}

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/profile')({
  loader: async (): Promise<LoaderData> => {
    // Сначала проверяем авторизацию
    const userRes = await authFetch('/api/users/me');
    if (userRes.status === 401) throw redirect({ to: '/' });
    if (!userRes.ok) throw new Error(`Ошибка загрузки профиля (${userRes.status})`);
    const user: User = await userRes.json();

    // Параллельно грузим прогресс и профессии
    const [progressRes, professionsRes] = await Promise.all([
      authFetch('/api/roadmap/progress'),
      authFetch('/api/professions/'),
    ]);

    const progress: ProgressResponse[] = progressRes.ok ? await progressRes.json() : [];
    const { professions }: { professions: Profession[] } = professionsRes.ok
      ? await professionsRes.json()
      : { professions: [] };

    // Считаем завершённые темы по каждой профессии
    const countByProfession = progress
      .filter((p) => p.is_completed)
      .reduce<Record<number, number>>((acc, p) => {
        acc[p.profession_id] = (acc[p.profession_id] ?? 0) + 1;
        return acc;
      }, {});

    // Только профессии где есть прогресс, сортируем по кол-ву завершённых тем
    const professionItems: ProfessionWithProgress[] = professions
      .filter((p) => (countByProfession[p.id] ?? 0) > 0)
      .map((p) => ({ profession: p, completedCount: countByProfession[p.id] ?? 0 }))
      .sort((a, b) => b.completedCount - a.completedCount);

    return { user, progress, professionItems };
  },

  component: ProfilePage,
  pendingComponent: PendingState,
  errorComponent: ErrorState,
});

// ─── Page ─────────────────────────────────────────────────────────────────────

function ProfilePage() {
  const { user: initialUser, progress, professionItems } = Route.useLoaderData();
  const [user, setUser] = useState(initialUser);

  const completedCount = progress.filter((p) => p.is_completed).length;
  const daysInIT = Math.floor(
    (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-[#080910] text-white">
      <div className="aurora-bg" />
      <Header />

      <main className="max-w-5xl mx-auto px-6 py-12 flex flex-col gap-6">
        {/* Hero */}
        <ProfileHero user={user} completedCount={completedCount} daysInIT={daysInIT} />

        {/* Two-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 z-1">
          {/* Left column */}
          <div className="flex flex-col gap-6">
            <FavoriteProfessions items={professionItems} />
            <ActivityBlock progress={progress} createdAt={user.created_at} />
          </div>

          {/* Right column */}
          <div>
            <SettingsBlock
              user={user}
              onUserUpdate={(updated) => setUser((prev) => ({ ...prev, ...updated }))}
            />
          </div>
        </div>
      </main>
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
        <p className="text-gray-400 text-sm">Загружаем профиль…</p>
      </div>
    </div>
  );
}

// ─── Error ────────────────────────────────────────────────────────────────────

function ErrorState({ error }: { error: Error }) {
  return (
    <div className="min-h-screen bg-[#080910] flex items-center justify-center px-6">
      <div className="flex flex-col items-center gap-4 max-w-sm text-center">
        <p className="text-white font-semibold">Не удалось загрузить профиль</p>
        <p className="text-gray-500 text-sm">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-sm rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white transition-colors"
        >
          Обновить
        </button>
      </div>
    </div>
  );
}
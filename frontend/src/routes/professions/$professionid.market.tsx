import { createFileRoute, Link } from '@tanstack/react-router';
import { Header } from '../../components/Header';
import { SalaryRange } from '../../components/market/SalaryRange';
import { VacanciesList } from '../../components/market/VacanciesList';
import type { ProfessionMarket } from '../../types/market';

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/professions/$professionid/market')({
  loader: async ({ params }): Promise<ProfessionMarket> => {
    const response = await fetch(`/api/professions/${params.professionid}/market`);

    if (!response.ok) {
      throw new Error(`Не удалось загрузить данные рынка (${response.status})`);
    }

    return response.json();
  },

  component: MarketPage,
  pendingComponent: PendingState,
  errorComponent: ErrorState,
});

// ─── Page ─────────────────────────────────────────────────────────────────────

function MarketPage() {
  const data = Route.useLoaderData();
  const skills = data.top_skills
    ? data.top_skills.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="min-h-screen text-white">
      <div className="aurora-bg" />
      <Header />

      <main className="max-w-5xl mx-auto px-6 py-12 flex flex-col gap-8">

        {/* Breadcrumb + title */}
        <div className="flex flex-col gap-3 z-1">
          <Link
            to="/professions"
            params={{ professionid: String(data.id) }}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors w-fit"
          >
            ← {data.name}
          </Link>

          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight">Рынок профессии</h1>
            <p className="text-gray-400">{data.name}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 z-1">
          <StatCard
            label="Вакансий на рынке"
            value={new Intl.NumberFormat('ru-RU').format(data.vacancies_count)}
          />
          <StatCard
            label="Медиана зарплат"
            value={
              data.median_salary
                ? new Intl.NumberFormat('ru-RU').format(data.median_salary) + ' ₽'
                : 'Нет данных'
            }
          />
          <a
            href={data.hh_query}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col justify-between rounded-2xl border border-[#6366f1]/25 bg-[#6366f1]/5 hover:bg-[#6366f1]/10 transition-colors p-5 col-span-2 md:col-span-1"
          >
            <span className="text-[10px] font-semibold tracking-[0.15em] text-[#818cf8] uppercase">
              Поиск работы
            </span>
            <span className="text-white text-sm font-medium mt-3">
              Открыть на hh.ru →
            </span>
          </a>
        </div>

        {/* Salary range */}
        {data.median_salary && (
          <SalaryRange medianSalary={data.median_salary} />
        )}

        {/* Top skills */}
        {skills.length > 0 && (
          <div className="rounded-2xl border border-white/[0.08] bg-[#0d0e18] p-6 flex flex-col gap-5 z-1">
            <h2 className="text-[10px] font-semibold tracking-[0.15em] text-gray-500 uppercase">
              Топ навыков в вакансиях
            </h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, i) => (
                <span
                  key={skill}
                  className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                    i < 3
                      ? 'bg-[#6366f1]/10 border-[#6366f1]/25 text-[#818cf8]'
                      : 'bg-white/[0.03] border-white/[0.08] text-gray-400'
                  }`}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Vacancies */}
        <VacanciesList
          vacancies={data.vacancies}
          totalCount={data.vacancies_count}
          hhUrl={data.hh_query}
        />

      </main>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-white/[0.08] bg-[#0d0e18] p-5">
      <span className="text-[10px] font-semibold tracking-[0.15em] text-gray-500 uppercase">
        {label}
      </span>
      <span className="text-2xl font-bold text-white mt-2">{value}</span>
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
        <p className="text-gray-400 text-sm">Загружаем данные рынка…</p>
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
          <h2 className="text-white font-semibold text-lg">Не удалось загрузить данные</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Попробуй обновить страницу или вернуться к профессии.
          </p>
        </div>
        {import.meta.env.DEV && (
          <pre className="w-full text-xs text-red-400/70 bg-white/5 border border-white/[0.06] p-4 rounded-xl text-left overflow-x-auto">
            {error.message}
          </pre>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white transition-colors"
          >
            Обновить
          </button>
          <Link
            to="/professions"
            className="px-4 py-2 text-sm rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            К профессиям
          </Link>
        </div>
      </div>
    </div>
  );
}
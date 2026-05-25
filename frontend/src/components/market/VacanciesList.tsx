import React from 'react';
import type { Vacancy } from '../../types/market';

// Инициалы из title как заглушка логотипа
function VacancyAvatar({ title }: { title: string }) {
  const initials = title
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/[0.08] flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
      {initials}
    </div>
  );
}

interface VacanciesListProps {
  vacancies: Vacancy[];
  totalCount: number;
  hhUrl: string;
}

export const VacanciesList: React.FC<VacanciesListProps> = ({
  vacancies,
  totalCount,
  hhUrl,
}) => (
  <div className="rounded-2xl border border-white/[0.08] bg-[#0d0e18] p-6 flex flex-col gap-5 z-1">
    {/* Header */}
    <div className="flex items-center justify-between">
      <h2 className="text-[10px] font-semibold tracking-[0.15em] text-gray-500 uppercase">
        Вакансии
      </h2>
      <a
        href={hhUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-[#818cf8] hover:text-white transition-colors"
      >
        Все {new Intl.NumberFormat('ru-RU').format(totalCount)} на hh.ru →
      </a>
    </div>

    {/* List */}
    {vacancies.length === 0 ? (
      <EmptyVacancies hhUrl={hhUrl} totalCount={totalCount} />
    ) : (
      <div className="flex flex-col gap-3">
        {vacancies.map((v, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
          >
            <VacancyAvatar title={v.title} />

            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{v.title}</p>
              <p className="text-gray-500 text-xs truncate">{v.desc}</p>
            </div>

            {v.salary_range && (
              <span className="shrink-0 text-xs font-semibold text-[#818cf8] bg-[#6366f1]/10 border border-[#6366f1]/20 px-3 py-1.5 rounded-lg whitespace-nowrap">
                {v.salary_range}
              </span>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);

function EmptyVacancies({ hhUrl, totalCount }: { hhUrl: string; totalCount: number }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <p className="text-gray-500 text-sm">
        Список вакансий загружается напрямую с hh.ru
      </p>
      <a
        href={hhUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 text-sm rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white transition-colors"
      >
        Смотреть {new Intl.NumberFormat('ru-RU').format(totalCount)} вакансий →
      </a>
    </div>
  );
}
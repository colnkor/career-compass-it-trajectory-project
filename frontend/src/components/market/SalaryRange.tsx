import React from 'react';

interface SalaryRangeProps {
  medianSalary: number;
}

// Считаем диапазоны от медианы
function calcRange(median: number) {
  const junior     = Math.round(median * 0.35 / 1000) * 1000;
  const midStart   = Math.round(median * 0.72 / 1000) * 1000;
  const seniorEnd  = Math.round(median * 1.6  / 1000) * 1000;
  const senior     = Math.round(median * 2.0  / 1000) * 1000;
  return { junior, midStart, seniorEnd, senior };
}

// Позиция на треке в процентах
function pct(value: number, min: number, max: number) {
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}

const fmt = (n: number) =>
  new Intl.NumberFormat('ru-RU').format(n) + ' ₽';

export const SalaryRange: React.FC<SalaryRangeProps> = ({ medianSalary }) => {
  const { junior, midStart, seniorEnd, senior } = calcRange(medianSalary);
  const medianPct  = pct(medianSalary, junior, senior);
  const midStartPct = pct(midStart, junior, senior);
  const seniorEndPct = pct(seniorEnd, junior, senior);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0d0e18] p-6 flex flex-col gap-6">
      <h2 className="text-[10px] font-semibold tracking-[0.15em] text-gray-500 uppercase">
        Зарплатная вилка
      </h2>

      {/* Median badge */}
      <div className="relative flex flex-col gap-3">
        {/* Floating badge */}
        <div
          className="absolute -top-1 flex flex-col items-center"
          style={{ left: `${medianPct}%`, transform: 'translateX(-50%)' }}
        >
          <div className="bg-[#3d3f6e] border border-[#6366f1]/40 text-white text-sm font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
            {fmt(medianSalary)}
          </div>
          {/* Pin line */}
          <div className="w-px h-3 bg-gray-500" />
        </div>

        {/* Labels row */}
        <div className="flex justify-between text-xs text-gray-400 pt-10">
          <span>Junior · {fmt(junior)}</span>
          <span>Senior · {fmt(senior)}</span>
        </div>

        {/* Track */}
        <div className="relative h-2 rounded-full bg-white/[0.06] overflow-visible">
          {/* Middle-Senior range highlight */}
          <div
            className="absolute top-0 h-full rounded-full bg-[#6366f1]/50"
            style={{
              left:  `${midStartPct}%`,
              width: `${seniorEndPct - midStartPct}%`,
            }}
          />
          {/* Median line */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-px h-5 bg-gray-400"
            style={{ left: `${medianPct}%` }}
          />
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 pt-1">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-6 h-2 rounded-full bg-[#6366f1]/50" />
            Диапазон Middle–Senior
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-px h-4 bg-gray-400" />
            Медиана рынка
          </div>
        </div>
      </div>
    </div>
  );
};
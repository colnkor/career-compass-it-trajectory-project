import React from 'react';
import type { ProgressResponse } from '../../types/user';

interface ActivityBlockProps {
  progress: ProgressResponse[];
  createdAt: string;
}

export const ActivityBlock: React.FC<ActivityBlockProps> = ({ progress, createdAt }) => {
  const completed = progress.filter((p) => p.is_completed);

  // Последняя активность
  const lastActivity = completed.length > 0
    ? completed.reduce((latest, p) =>
        new Date(p.updated_at) > new Date(latest.updated_at) ? p : latest
      ).updated_at
    : null;

  // Дата регистрации
  const registeredDate = new Date(createdAt).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const lastActivityDate = lastActivity
    ? new Date(lastActivity).toLocaleDateString('ru-RU', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0d0e18] p-6 flex flex-col gap-5">
      <h2 className="text-white font-semibold flex items-center gap-2">
        <span className="text-[#818cf8]">◎</span> Активность
      </h2>

      <div className="flex flex-col gap-3">
        <ActivityRow label="Дата регистрации" value={registeredDate} />
        <ActivityRow
          label="Последняя активность"
          value={lastActivityDate ?? 'Ещё не начинал'}
        />
        <ActivityRow
          label="Всего тем завершено"
          value={String(completed.length)}
          highlight={completed.length > 0}
        />
      </div>
    </div>
  );
};

function ActivityRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className={`text-sm font-medium ${highlight ? 'text-[#818cf8]' : 'text-gray-300'}`}>
        {value}
      </span>
    </div>
  );
}
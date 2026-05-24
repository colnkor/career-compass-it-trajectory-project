import React from 'react';
import { Link } from '@tanstack/react-router';
import type { Profession } from '../../types/profession';

export interface ProfessionWithProgress {
  profession: Profession;
  completedCount: number;
}

interface FavoriteProfessionsProps {
  items: ProfessionWithProgress[];
}

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export const FavoriteProfessions: React.FC<FavoriteProfessionsProps> = ({ items }) => (
  <div className="rounded-2xl border border-white/[0.08] bg-[#0d0e18] p-6 flex flex-col gap-5">
    <h2 className="text-white font-semibold flex items-center gap-2">
      <span className="text-[#818cf8]">☆</span> Избранные профессии
    </h2>

    {items.length === 0 ? (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-gray-500 text-sm">Ты ещё не начал изучение ни одной профессии</p>
        <Link
          to="/professions"
          className="text-sm text-[#818cf8] hover:text-white transition-colors"
        >
          Выбрать профессию →
        </Link>
      </div>
    ) : (
      <div className="flex flex-col gap-2">
        {items.map(({ profession, completedCount }) => (
          <Link
            key={profession.id}
            to="/roadmap/$professionid"
            params={{ professionid: String(profession.id) }}
            className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10 transition-all duration-200"
          >
            {/* Avatar */}
            <div className="w-10 h-10 rounded-xl bg-[#6366f1]/15 border border-[#6366f1]/25 flex items-center justify-center text-xs font-bold text-[#818cf8] shrink-0">
              {getInitials(profession.name)}
            </div>

            {/* Name + progress */}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{profession.name}</p>
              <p className="text-gray-500 text-xs">{completedCount} тем завершено</p>
            </div>

            <span className="text-gray-600 text-xs">→</span>
          </Link>
        ))}
      </div>
    )}
  </div>
);
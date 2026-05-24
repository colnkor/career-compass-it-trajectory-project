import React from 'react';
import type { User } from '../../types/user';

interface ProfileHeroProps {
  user: User;
  completedCount: number;
  daysInIT: number;
}

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export const ProfileHero: React.FC<ProfileHeroProps> = ({ user, completedCount, daysInIT }) => (
  <div className="rounded-2xl border border-white/[0.08] bg-[#0d0e18] p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
    {/* Avatar */}
    <div className="w-20 h-20 rounded-full bg-[#6366f1]/20 border-2 border-[#6366f1]/40 flex items-center justify-center shrink-0">
      <span className="text-2xl font-bold text-[#818cf8]">{getInitials(user.full_name)}</span>
    </div>

    {/* Info */}
    <div className="flex flex-col gap-1 flex-1">
      <h1 className="text-2xl font-bold text-white">{user.full_name}</h1>
      <p className="text-gray-400 text-sm">{user.email}</p>
    </div>

    {/* Stats */}
    <div className="flex gap-4 shrink-0">
      <StatPill value={completedCount} label="тем завершено" />
      <StatPill value={daysInIT} label="дней в IT" />
    </div>
  </div>
);

function StatPill({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-5 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03]">
      <span className="text-2xl font-bold text-[#818cf8]">{value}</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}
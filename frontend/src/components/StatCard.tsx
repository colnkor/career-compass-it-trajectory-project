import React from 'react';

interface StatCardProps {
  value: string;
  label: string;
}

export const StatCard: React.FC<StatCardProps> = ({ value, label }) => {
  return (
    <div className="flex flex-col items-center justify-center p-4 border-r border-white/5 last:border-none text-center">
      <span className="text-3xl font-extrabold tracking-tight text-white mb-1 font-mono">{value}</span>
      <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
    </div>
  );
};
import React from 'react';

interface StatCardProps {
  value: string;
  label: string;
}

export const StatCard: React.FC<StatCardProps> = ({ value, label }) => (
  <div className="min-h-[112px] px-4 py-[21px] flex flex-col items-center justify-center gap-[7px] text-center border-r border-white/[0.07] last:border-r-0">
    <span className="font-display font-bold text-text tracking-[-0.04em] text-[clamp(1.55rem,2.3vw,1.9rem)]">
      {value}
    </span>
    <span className="text-muted text-[0.7rem] tracking-[0.12em] uppercase">
      {label}
    </span>
  </div>
);
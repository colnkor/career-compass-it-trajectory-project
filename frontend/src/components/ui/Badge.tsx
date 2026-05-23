import React from 'react';

export const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#11121a] border border-gray-850 text-xs text-gray-400 font-medium tracking-wide">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      {children}
    </span>
  );
};
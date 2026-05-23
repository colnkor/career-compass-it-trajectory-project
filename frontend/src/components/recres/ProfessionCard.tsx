import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '../ui/Button';
import type { ProfessionResult } from '../../types/profession';


// ─── Style maps ───────────────────────────────────────────────────────────────

type Rank = 'first' | 'second' | 'third';

const rankStyles: Record<Rank, { label: string; badge: string; bar: string; text: string }> = {
  first: {
    label: 'Идеальный выбор',
    badge: 'bg-[#6366f1]/15 text-[#818cf8] border border-[#6366f1]/30',
    bar:   'bg-[#6366f1]',
    text:  'text-[#818cf8]',
  },
  second: {
    label: 'Отличный вариант',
    badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/25',
    bar:   'bg-amber-400',
    text:  'text-amber-400',
  },
  third: {
    label: 'Тоже интересно',
    badge: 'bg-white/5 text-gray-400 border border-white/10',
    bar:   'bg-gray-500',
    text:  'text-gray-400',
  },
};

const getRank = (index: number): Rank => {
  if (index === 0) return 'first';
  if (index === 1) return 'second';
  return 'third';
};

const parseTags = (raw: string): string[] =>
  raw.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 4);

// ─── Component ────────────────────────────────────────────────────────────────

interface ProfessionCardProps {
  result: ProfessionResult;
  index: number;
}

export const ProfessionCard: React.FC<ProfessionCardProps> = ({ result, index }) => {
  const [hovered, setHovered] = useState(false);
  const { profession, confidence } = result;
  const styles = rankStyles[getRank(index)];
  const tags = parseTags(profession.tags);
  const matchPercent = Math.round(confidence * 100);

  return (
    <div
      className="relative flex flex-col rounded-2xl border border-white/[0.08] bg-[#0d0e18] p-6 gap-5 transition-all duration-300"
      style={{
        boxShadow: hovered
          ? '0 0 0 1px rgba(99,102,241,0.4), 0 20px 60px rgba(0,0,0,0.5)'
          : '0 4px 24px rgba(0,0,0,0.3)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Badge */}
      <span className={`self-start text-xs font-medium px-3 py-1 rounded-full ${styles.badge}`}>
        {styles.label}
      </span>

      {/* Title */}
      <h3 className="text-white font-bold text-2xl leading-tight tracking-tight">
        {profession.name}
      </h3>

      {/* Description */}
      <p className="text-gray-400 text-sm leading-relaxed flex-1">
        {profession.description}
      </p>

      {/* Skill tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-xs text-gray-400 bg-white/5 border border-white/[0.08] px-3 py-1 rounded-lg"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Match bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${styles.bar}`}
            style={{ width: `${matchPercent}%` }}
          />
        </div>
        <span className={`text-sm font-semibold tabular-nums ${styles.text}`}>
          {matchPercent}%
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-1">
        <Link
          to="/roadmap/$professionId"
          params={{ professionId: String(profession.id) }}
          className="flex-1"
        >
          <Button variant="primary" className="w-full px-3 py-2 text-xs">
            Начать обучение
          </Button>
        </Link>
        <Link
          to="professions/$professionId/market"
          params={{ professionId: String(profession.id) }}
          className="flex-1"
        >
          <Button variant="secondary" className="w-full px-3 py-2 text-xs">
            Рынок профессии
          </Button>
        </Link>
      </div>
    </div>
  );
};
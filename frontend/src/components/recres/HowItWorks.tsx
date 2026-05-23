import React from 'react';

const HOW_IT_WORKS_STEPS = [
  {
    n: 1,
    text: 'Каждый ответ формирует твой уникальный профиль — алгоритм взвешивает интересы, темп обучения и жизненный контекст одновременно.',
  },
  {
    n: 2,
    text: 'Опросник устроен так, что нейтральные на первый взгляд ответы несут столько же смысла, сколько очевидные — система улавливает паттерны, которые не заметны интуитивно.',
  },
  {
    n: 3,
    text: 'Чем честнее и подробнее ты отвечал, тем точнее совпадение: наш алгоритм умеет читать между строк и превращает нюансы в конкретные рекомендации.',
  },
  {
    n: 4,
    text: 'Результат — не случайная выборка, а персональный рейтинг направлений, где процент совпадения отражает реальную вероятность твоего успеха и удовлетворённости.',
  },
];

export const HowItWorks: React.FC = () => (
  <div className="rounded-2xl border border-white/[0.08] bg-[#0d0e18] p-8 flex flex-col gap-6">
    {/* Header */}
    <div>
      <h2 className="text-xl font-bold text-white">Как это работает? Рекомендации</h2>
      <p className="text-gray-500 text-sm mt-1">
        Почему твои ответы стали основой точного результата
      </p>
    </div>

    {/* Steps */}
    <div className="flex flex-col gap-4">
      {HOW_IT_WORKS_STEPS.map((step) => (
        <div key={step.n} className="flex gap-4 items-start">
          {/* Accent line + number */}
          <div className="flex items-stretch gap-3 shrink-0">
            <div className="w-0.5 rounded-full bg-[#6366f1]/40 self-stretch" />
            <div className="w-6 h-6 rounded-full bg-[#6366f1]/15 border border-[#6366f1]/30 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[10px] font-bold text-[#818cf8]">{step.n}</span>
            </div>
          </div>

          <p className="text-gray-300 text-sm leading-relaxed">{step.text}</p>
        </div>
      ))}
    </div>
  </div>
);
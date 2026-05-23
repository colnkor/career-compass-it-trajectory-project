import React, { useState, useMemo } from 'react';
import { Route } from '../routes/questionnaire';
import { Link, useNavigate } from '@tanstack/react-router';
import { Button } from './ui/Button';
import { InputField } from './ui/InputField';
import { RadioField } from './ui/RadioField';
import { CheckboxField } from './ui/CheckboxField';
import { QuestionnaireSidebar } from './QuestionnaireSidebar';
import { StepProgressDots } from './StepProgressDots';
import type { QuestionnaireAnswers, Question } from '../types/questionnaire';
import type { RecommendResponse } from '../types/recommendation';

// ─── Constants ────────────────────────────────────────────────────────────────

const SECTION_ICONS = [
  '🎯',
  '🛠️',
  '🏆',
  '⏰',
  '💼',
  '📚',
  '🚀',
  '💡',
  '📈',
  '🤝',
  '🧠',
  '📝'
];
const RECOMMEND_STORAGE_KEY = 'recommend_result';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isAnswered = (question: Question, answers: QuestionnaireAnswers): boolean => {
  const answer = answers[question.id];
  if (answer === undefined || answer === null) return false;
  if (typeof answer === 'string') return answer.trim().length > 0;
  if (Array.isArray(answer)) return answer.length > 0;
  return true;
};

// Собирает тело запроса из ответов опросника
const buildRecommendRequest = (
  questions: Question[],
  answers: QuestionnaireAnswers,
) => {
  // Объединяем все free_text ответы в одну строку для top-level поля
  const freeTextAnswer = questions
    .filter((q) => q.type === 'free_text')
    .map((q) => (answers[q.id] as string | undefined)?.trim() ?? '')
    .filter(Boolean)
    .join(' ');

  const mappedAnswers = questions.map((q) => {
    const answer = answers[q.id];
    if (q.type === 'free_text') {
      return { question_id: q.id, option_ids: [], free_text: answer as string };
    }
    if (q.type === 'single') {
      return { question_id: q.id, option_ids: [answer as number], free_text: null };
    }
    // multi
    return { question_id: q.id, option_ids: answer as number[], free_text: null };
  });

  return { free_text: freeTextAnswer, answers: mappedAnswers };
};

// ─── Component ────────────────────────────────────────────────────────────────

export const Questionnaire: React.FC = () => {
  const questions: Question[] = Route.useLoaderData();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const answeredIndices = useMemo(() => {
    const set = new Set<number>();
    questions.forEach((q, idx) => {
      if (isAnswered(q, answers)) set.add(idx);
    });
    return set;
  }, [answers, questions]);

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0b10] flex items-center justify-center">
        <div className="text-gray-400 text-sm">Доступные вопросы не найдены.</div>
      </div>
    );
  }

  const activeQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;

  const handleSingleSelect = (optionId: number) => {
    setAnswers((prev) => ({ ...prev, [activeQuestion.id]: optionId }));
    setValidationError(null);
  };

  const handleMultiSelect = (optionId: number) => {
    const currentAnswers = (answers[activeQuestion.id] as number[]) || [];
    const updated = currentAnswers.includes(optionId)
      ? currentAnswers.filter((id) => id !== optionId)
      : [...currentAnswers, optionId];
    setAnswers((prev) => ({ ...prev, [activeQuestion.id]: updated }));
    setValidationError(null);
  };

  const handleTextChange = (value: string) => {
    setAnswers((prev) => ({ ...prev, [activeQuestion.id]: value }));
    setValidationError(null);
  };

  const handleSubmit = async () => {
    // Проверяем все вопросы перед отправкой
    const unansweredIdx = questions.findIndex((q) => !isAnswered(q, answers));
    if (unansweredIdx !== -1) {
      setCurrentStep(unansweredIdx);
      setValidationError('Пожалуйста, ответьте на этот вопрос.');
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    try {
      const body = buildRecommendRequest(questions, answers);
      const response = await fetch('/api/recommend/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.detail ?? `Ошибка сервера (${response.status})`);
      }

      const result: RecommendResponse = await response.json();

      // Передаём результат на страницу рекомендаций через sessionStorage
      sessionStorage.setItem(RECOMMEND_STORAGE_KEY, JSON.stringify(result));
      navigate({ to: '/recommendations' });
    } catch (err) {
      setValidationError(
        err instanceof Error ? err.message : 'Не удалось отправить ответы. Попробуйте ещё раз.',
      );
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      handleSubmit();
    } else {
      setCurrentStep((prev) => prev + 1);
      setValidationError(null);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setValidationError(null);
    } else {
      window.history.back();
    }
  };

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
    setValidationError(null);
  };

  const sidebarSteps = questions.map((q, idx) => ({
    label: q.text.length > 24 ? q.text.slice(0, 24) + '…' : q.text,
    icon: SECTION_ICONS[idx] ?? '📌',
  }));

  return (
    <div className="min-h-screen bg-[#0a0b10] text-gray-300 font-sans antialiased selection:bg-[#6366f1]/30">
      {/* Шапка */}
      <div className="w-full max-w-7xl mx-auto px-6 pt-4 flex items-center justify-between border-b border-white/5 pb-3">
        <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg tracking-tight">
          <span className="text-[#6366f1]">✦</span> Карьерный компас
        </Link>

        <StepProgressDots
          totalSteps={questions.length}
          currentStepIndex={currentStep}
          answeredIndices={answeredIndices}
        />

        <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={handleBack}>
          ← Назад
        </Button>
      </div>

      {/* Основная сетка */}
      <div className="w-full max-w-7xl mx-auto px-6 py-10 flex gap-8">
        <QuestionnaireSidebar
          steps={sidebarSteps}
          currentStepIndex={currentStep}
          answeredIndices={answeredIndices}
          onStepClick={handleStepClick}
        />

        <main className="flex-1 max-w-2xl flex flex-col gap-6">
          <span className="text-xs font-semibold text-gray-500">
            Шаг {currentStep + 1} из {questions.length}
          </span>

          <h1 className="text-3xl font-bold text-white tracking-tight">
            {activeQuestion.text}
          </h1>

          <div className="flex flex-col gap-3 mt-4">
            {activeQuestion.type === 'free_text' && (
              <InputField
                placeholder="Введите ваш ответ..."
                value={(answers[activeQuestion.id] as string) || ''}
                onChange={(e) => handleTextChange(e.target.value)}
              />
            )}

            {activeQuestion.type === 'single' &&
              activeQuestion.options.map((option) => (
                <RadioField
                  key={option.id}
                  id={option.id}
                  name={`question-${activeQuestion.id}`}
                  text={option.text}
                  checked={answers[activeQuestion.id] === option.id}
                  onChange={() => handleSingleSelect(option.id)}
                />
              ))}

            {activeQuestion.type === 'multi' &&
              activeQuestion.options.map((option) => {
                const currentSelected = (answers[activeQuestion.id] as number[]) || [];
                return (
                  <CheckboxField
                    key={option.id}
                    id={option.id}
                    text={option.text}
                    checked={currentSelected.includes(option.id)}
                    onChange={() => handleMultiSelect(option.id)}
                  />
                );
              })}
          </div>

          {validationError && (
            <p className="text-sm text-red-400 -mt-2">{validationError}</p>
          )}

          <div className="flex items-center gap-4 mt-8 pt-6 border-t border-white/5">
            <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
              ← Назад
            </Button>
            <Button
              variant="primary"
              className="px-8"
              onClick={handleNext}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Отправляем…'
                : isLastStep
                  ? 'Завершить'
                  : 'Далее →'}
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
};
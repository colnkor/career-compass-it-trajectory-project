import React, { useState, useMemo } from 'react';
import { Route } from '../../routes/questionnaire';
import { Link, useNavigate } from '@tanstack/react-router';
import { Button } from '../ui/Button';
import { InputField } from '../ui/InputField';
import { RadioField } from '../ui/RadioField';
import { CheckboxField } from '../ui/CheckboxField';
import { QuestionnaireSidebar } from './QuestionnaireSidebar';
import { StepProgressDots } from './StepProgressDots';
import type { QuestionnaireAnswers, Question } from '../../types/questionnaire';
import type { RecommendResponse } from '../../types/recommendation';

const SECTION_ICONS = ['🎯','🛠️','🏆','⏰','💼','📚','🚀','💡','📈','🤝','🧠','📝'];
const RECOMMEND_STORAGE_KEY = 'recommend_result';

const isAnswered = (question: Question, answers: QuestionnaireAnswers): boolean => {
  const answer = answers[question.id];
  if (answer === undefined || answer === null) return false;
  if (typeof answer === 'string') return answer.trim().length > 0;
  if (Array.isArray(answer)) return answer.length > 0;
  return true;
};

const buildRecommendRequest = (questions: Question[], answers: QuestionnaireAnswers) => {
  const freeTextAnswer = questions
    .filter((q) => q.type === 'free_text')
    .map((q) => (answers[q.id] as string | undefined)?.trim() ?? '')
    .filter(Boolean)
    .join(' ');

  const mappedAnswers = questions.map((q) => {
    const answer = answers[q.id];
    if (q.type === 'free_text') return { question_id: q.id, option_ids: [], free_text: answer as string };
    if (q.type === 'single') return { question_id: q.id, option_ids: [answer as number], free_text: null };
    return { question_id: q.id, option_ids: answer as number[], free_text: null };
  });

  return { free_text: freeTextAnswer, answers: mappedAnswers };
};

export const Questionnaire: React.FC = () => {
  const questions: Question[] = Route.useLoaderData();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const answeredIndices = useMemo(() => {
    const set = new Set<number>();
    questions.forEach((q, idx) => { if (isAnswered(q, answers)) set.add(idx); });
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
  const isFirstStep = currentStep === 0;

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
      sessionStorage.setItem(RECOMMEND_STORAGE_KEY, JSON.stringify(result));
      navigate({ to: '/recommendations' });
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Не удалось отправить ответы. Попробуйте ещё раз.');
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
    }
  };

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
    setValidationError(null);
    setSidebarOpen(false); // закрываем мобильный сайдбар после выбора
  };

  const sidebarSteps = questions.map((q, idx) => ({
    label: q.text,
    icon: SECTION_ICONS[idx] ?? '📌',
  }));

  return (
    <div className="min-h-screen bg-[#0a0b10] text-gray-300 font-sans antialiased selection:bg-[#6366f1]/30">

      {/* Мобильный оверлей сайдбара */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Мобильный сайдбар — выезжает слева */}
      <div className={`fixed top-0 left-0 h-full z-50 w-72 bg-[#0d0e18] border-r border-white/10 flex flex-col gap-6 p-6 transition-transform duration-300 lg:hidden ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">Разделы</span>
          <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-white text-lg cursor-pointer">✕</button>
        </div>
        <QuestionnaireSidebar
          steps={sidebarSteps}
          currentStepIndex={currentStep}
          answeredIndices={answeredIndices}
          onStepClick={handleStepClick}
          mobile={true}
        />
      </div>

      {/* Шапка */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4 flex items-center justify-between border-b border-white/5 pb-3 gap-4">
        {/* Левая часть: лого + гамбургер */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Гамбургер — только на мобиле */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden flex flex-col gap-1 p-1.5 rounded-lg hover:bg-white/5 transition cursor-pointer"
          >
            <span className="w-4 h-0.5 bg-gray-400 rounded" />
            <span className="w-4 h-0.5 bg-gray-400 rounded" />
            <span className="w-4 h-0.5 bg-gray-400 rounded" />
          </button>
          <Link to="/" className="flex items-center gap-2 text-white font-bold text-base sm:text-lg tracking-tight">
            <span className="text-[#6366f1]">✦</span>
            <span className="hidden sm:inline">Карьерный компас</span>
          </Link>
        </div>

        {/* Центр: прогресс — скрываем точки если не влезают, показываем счётчик */}
        <div className="flex-1 flex justify-center overflow-hidden">
          {/* На широких экранах — точки */}
          <div className="hidden md:flex">
            <StepProgressDots
              totalSteps={questions.length}
              currentStepIndex={currentStep}
              answeredIndices={answeredIndices}
            />
          </div>
          {/* На узких — текстовый счётчик */}
          <div className="flex md:hidden items-center gap-2 text-xs text-gray-400">
            <span className="text-[#6366f1] font-bold">{currentStep + 1}</span>
            <span>/</span>
            <span>{questions.length}</span>
            <span className="text-gray-600">вопросов</span>
          </div>
        </div>

        {/* Правая часть: кнопка назад — скрыта на первом шаге */}
        <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={() => window.history.back()}>
          ← Назад
        </Button>
      </div>

      {/* Основная сетка */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-10 flex gap-8">
        {/* Десктопный сайдбар */}
        <div className="hidden lg:block">
          <QuestionnaireSidebar
            steps={sidebarSteps}
            currentStepIndex={currentStep}
            answeredIndices={answeredIndices}
            onStepClick={handleStepClick}
          />
        </div>

        <main className="flex-1 max-w-2xl flex flex-col gap-6">
          <span className="text-xs font-semibold text-gray-500">
            Шаг {currentStep + 1} из {questions.length}
          </span>

          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
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
                  id={option.id ?? -1}
                  name={`question-${activeQuestion.id}`}
                  text={option.text}
                  checked={answers[activeQuestion.id] === option.id}
                  onChange={() => handleSingleSelect(option.id ?? -1)}
                />
              ))}

            {activeQuestion.type === 'multi' &&
              activeQuestion.options.map((option) => {
                const currentSelected = (answers[activeQuestion.id] as number[]) || [];
                return (
                  <CheckboxField
                    key={option.id}
                    id={option.id ?? -1}
                    text={option.text}
                    checked={currentSelected.includes(option.id ?? -1)}
                    onChange={() => handleMultiSelect(option.id ?? -1)}
                  />
                );
              })}
          </div>

          {validationError && (
            <p className="text-sm text-red-400 -mt-2">{validationError}</p>
          )}

          <div className="flex items-center gap-4 mt-8 pt-6 border-t border-white/5">
            {!isFirstStep && (
              <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
                ← Назад
              </Button>
            )}
            <Button
              variant="primary"
              className="px-8"
              onClick={handleNext}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Отправляем…' : isLastStep ? 'Завершить' : 'Далее →'}
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
};
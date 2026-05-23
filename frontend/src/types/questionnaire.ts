export type QuestionType = 'single' | 'multi' | 'free_text';

export interface QuestionOption {
  id: number;
  question_id: number;
  text: string;
  trait: string | null;
  order: number;
}

export interface Question {
  id: number;
  text: string;
  type: QuestionType;
  order: number;
  is_active: boolean;
  options: QuestionOption[];
}

export type QuestionnaireAnswers = Record<number, number | number[] | string>;
export interface Vacancy {
  title: string;        // "Junior Frontend Developer"
  desc: string;         // "Яндекс · Remote"
  salary_range: string; // "от 120 000 ₽" — готовая строка с бэка
}

export interface ProfessionMarket {
  id: number;
  name: string;
  vacancies_count: number;
  median_salary: number | null;
  top_skills: string | null;
  hh_query: string;
  vacancies: Vacancy[];
}
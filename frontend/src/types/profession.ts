export interface Profession {
  id: number
  name: string
  tags: string
  description: string
  hh_query: string
  median_salary: number | null
  vacancies_count: number | null
  top_skills: string | null
}

export interface ProfessionResult {
  profession: Profession;
  confidence: number;
}
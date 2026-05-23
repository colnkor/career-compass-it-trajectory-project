export interface ProfessionMatch {
  name: string
  confidence: number
}

export interface RecommendResponse {
  status: string
  reason: string | null
  professions: ProfessionMatch[]
}
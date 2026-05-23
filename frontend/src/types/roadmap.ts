export interface Profession {
  id: number
  name: string
}

export interface RoadmapPhase {
  id: number
  profession_id: number
  title: string
  description: string | null
  order: number
}

export interface RoadmapTopic {
  id: number
  phase_id: number
  title: string
  description: string | null
  resources: string | null
  order: number
}
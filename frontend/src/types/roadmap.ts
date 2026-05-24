export interface Profession {
  id: number
  name: string
}

export interface RoadmapTopic {
  id: number;
  phase_id: number;
  title: string;
  description: string | null;
  resources: string; // "site1.com, site2.com"
  order: number;
  is_completed: boolean | null;
  completed_at: string | null;
}

export interface RoadmapPhase {
  id: number;
  profession_id: number;
  title: string;
  description: string | null;
  order: number;
  topics: RoadmapTopic[];
}
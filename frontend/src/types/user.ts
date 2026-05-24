export interface User {
  id: number;
  full_name: string;
  email: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface ProgressResponse {
  id: number;
  profession_id: number;
  topic_id: number;
  is_completed: boolean;
  completed_at: string | null;
  updated_at: string;
}
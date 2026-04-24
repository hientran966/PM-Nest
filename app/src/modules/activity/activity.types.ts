// ===== ACTIVITY LOG =====
export interface IActivityLog {
  id: number;
  task_id?: number;
  actor_id?: number;
  detail: string;
  created_at?: string;
  deleted_at?: string | null;
  user?: {
    id: number;
    name: string;
  };
}

// ===== ACTIVITY QUERY =====
export interface IActivityQuery {
  task_id?: number;
  detail?: string;
}

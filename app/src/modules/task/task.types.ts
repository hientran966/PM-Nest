// ===== BASE TASK =====
export interface ITask {
  id: number;
  project_id: number;
  title: string;
  description?: string;
  status?: "todo" | "in_progress" | "review" | "done";
  priority?: "low" | "medium" | "high";
  start_date?: string;
  due_date?: string;
  created_by?: number;
  latest_progress?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

// ===== TASK DETAIL =====
export interface ITaskDetail extends ITask {
  assignees?: number[];
}

// ===== TASK QUERY =====
export interface ITaskQuery {
  project_id?: number;
  status?: string;
  title?: string;
  priority?: string;
}

// ===== TASK ROLE =====
export interface ITaskRole {
  isCreator: boolean;
  isAssigned: boolean;
}

// ===== PROGRESS LOG =====
export interface IProgressLog {
  task_id: number;
  progress: number;
}

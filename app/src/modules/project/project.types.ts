// ===== BASE PROJECT =====
export interface IProject {
  id: number;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  created_by: number;
  deleted_at?: string | null;
}

// ===== TASK =====
export interface ITask {
  id: number;
  project_id: number;
  name?: string;
  status?: string;
  priority?: string;
  progress?: number;
  created_at?: string;
}

// ===== PROJECT DETAIL =====
export interface IProjectDetail extends IProject {
  tasks: ITask[];
}

// ===== QUERY =====
export interface IProjectQuery {
  name?: string;
  status?: string;
  created_by?: number;
}

// ===== ROLE =====
export interface IProjectRole {
  role: string; // owner | member | manager
}

// ===== REPORT =====

// task stats
export interface ITaskStats {
  total_tasks: number;
  done_tasks?: number;
  completion_rate: number;
}

// status
export interface ITaskStatus {
  status: string;
  count: number;
}

// priority
export interface ITaskPriority {
  priority: string;
  count: number;
}

// member
export interface IMemberStats {
  member_count: number;
}

// workload
export interface IWorkload {
  name: string;
  assigned_tasks: number;
  workload_percent: number;
}

// progress trend
export interface IProgressTrend {
  date: string;
  progress: number;
}

// FINAL REPORT
export interface IProjectReport {
  project: {
    id: number;
    name: string;
    start_date?: string;
    end_date?: string;
  };
  total_tasks: number;
  completion_rate: number;
  member_count: number;
  task_status: ITaskStatus[];
  priority: ITaskPriority[];
  workload: IWorkload[];
  progress_trend: IProgressTrend[];
}
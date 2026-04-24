// ===== TASK ASSIGNEE =====
export interface IAssign {
  id: number;
  task_id: number;
  user_id: number;
  deleted_at?: string | null;
}

// ===== ASSIGN QUERY =====
export interface IAssignQuery {
  task_id?: number;
  user_id?: number;
}

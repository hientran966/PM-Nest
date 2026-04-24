// ===== NOTIFICATION =====
export interface INotification {
  id: number;
  recipient_id: number;
  actor_id: number;
  type: string;
  reference_type?: "project" | "task" | "file" | "file_version" | "comment" | "chat_message" | "chat_channel";
  reference_id?: number;
  message?: string;
  status?: "new" | "unread" | "read";
  project_id?: number;
  created_at?: string;
  deleted_at?: string | null;
}

// ===== NOTIFICATION QUERY =====
export interface INotificationQuery {
  recipient_id?: number;
  status?: string;
}

// ===== NOTIFICATION COUNT =====
export interface INotificationCount {
  count: number;
}

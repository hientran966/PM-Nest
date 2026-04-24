// ===== FILE =====
export interface IFile {
  id: number;
  project_id?: number;
  task_id?: number;
  created_by?: number;
  file_name: string;
  category?: "project" | "task" | "user_avatar" | "other";
  created_at?: string;
  deleted_at?: string | null;
}

// ===== FILE VERSION =====
export interface IFileVersion {
  id: number;
  file_id: number;
  version_number: number;
  file_url: string;
  file_type?: string;
  created_at?: string;
  deleted_at?: string | null;
}

// ===== FILE DETAIL =====
export interface IFileDetail extends IFile {
  versions?: IFileVersion[];
}

// ===== FILE QUERY =====
export interface IFileQuery {
  project_id?: number;
  task_id?: number;
  file_name?: string;
}

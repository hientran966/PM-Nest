// ===== PROJECT MEMBER =====
export interface IMember {
  id: number;
  project_id: number;
  user_id: number;
  role?: "owner" | "manager" | "member" | "client" | "viewer";
  status?: "invited" | "accepted" | "declined";
  invited_by?: number;
  created_at?: string;
  joined_at?: string;
  deleted_at?: string | null;
}

// ===== MEMBER INVITE =====
export interface IMemberInvite extends IMember {
  user_name?: string;
  project_name?: string;
}

// ===== MEMBER QUERY =====
export interface IMemberQuery {
  project_id?: number;
  user_id?: number;
  role?: string;
  status?: string;
}

export interface IAccount {
  id: number;
  name: string;
  email: string;
  role?: string;
  delete_at?: string;
}

export interface IQuery {
  page?: number;
  limit?: number;
  keyword?: string;
}

export interface ILoginPayload {
  email: string;
  password: string;
}

export interface IChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}
import api from "@/services/api";
import {
  IAccount,
  IQuery,
  ILoginPayload,
  IChangePasswordPayload,
} from "./account.types";

// CREATE
export const createAccount = async (data: Partial<IAccount>) => {
  const res = await api.post("/accounts", data);
  return res.data;
};

// GET ALL
export const getAccounts = async (query?: IQuery) => {
  const res = await api.get("/accounts", { params: query });
  return res.data;
};

// GET ONE
export const getAccountById = async (id: number) => {
  const res = await api.get(`/accounts/${id}`);
  return res.data;
};

// UPDATE
export const updateAccount = async (
  id: number,
  data: Partial<IAccount>
) => {
  const res = await api.put(`/accounts/${id}`, data);
  return res.data;
};

// DELETE
export const deleteAccount = async (id: number) => {
  const res = await api.delete(`/accounts/${id}`);
  return res.data;
};

// LOGIN
export const login = async (data: ILoginPayload) => {
  console.log("BASE URL:", process.env.NEXT_PUBLIC_API_URL);
  const res = await api.post("/accounts/login", data);
  return res.data;
};

// GET DEACTIVE
export const getDeactiveAccounts = async (query?: IQuery) => {
  const res = await api.get("/accounts/deactive", { params: query });
  return res.data;
};

// RESTORE
export const restoreAccount = async (id: number) => {
  const res = await api.put(`/accounts/deactive/${id}`);
  return res.data;
};

// CHANGE PASSWORD
export const changePassword = async (
  id: number,
  data: IChangePasswordPayload
) => {
  const res = await api.put(`/accounts/${id}/password`, data);
  return res.data;
};

// GET STATS
export const getAccountStats = async (
  id: number,
  projectId?: number
) => {
  const res = await api.get(`/accounts/${id}/stats`, {
    params: { projectId },
  });
  return res.data;
};
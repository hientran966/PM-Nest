import api from "@/services/api";
import { IAssign, IAssignQuery } from "./assign.types";

// CREATE ASSIGN
export const createAssign = async (data: Partial<IAssign>) => {
  const res = await api.post("/assigns", data);
  return res.data;
};

// GET ALL ASSIGNS
export const getAssigns = async (query?: IAssignQuery): Promise<IAssign[]> => {
  const res = await api.get("/assigns", { params: query });
  return res.data;
};

// GET ASSIGN BY ID
export const getAssignById = async (id: number): Promise<IAssign> => {
  const res = await api.get(`/assigns/${id}`);
  return res.data;
};

// UPDATE ASSIGN
export const updateAssign = async (
  id: number,
  data: Partial<IAssign>
) => {
  const res = await api.put(`/assigns/${id}`, data);
  return res.data;
};

// DELETE ASSIGN
export const deleteAssign = async (id: number) => {
  const res = await api.delete(`/assigns/${id}`);
  return res.data;
};

// GET DEACTIVE ASSIGNS
export const getDeactiveAssigns = async (query?: IAssignQuery) => {
  const res = await api.get("/assigns/deactive", { params: query });
  return res.data;
};

// RESTORE ASSIGN
export const restoreAssign = async (id: number) => {
  const res = await api.put(`/assigns/deactive/${id}`);
  return res.data;
};

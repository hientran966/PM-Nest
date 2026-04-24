import api from "@/services/api";
import {
  ITask,
  ITaskDetail,
  ITaskQuery,
  ITaskRole,
  IProgressLog,
} from "./task.types";

// CREATE
export const createTask = async (data: Partial<ITask>) => {
  const res = await api.post("/tasks", data);
  return res.data;
};

// GET ALL
export const getTasks = async (query?: ITaskQuery): Promise<ITask[]> => {
  const res = await api.get("/tasks", { params: query });
  return res.data;
};

// GET ONE
export const getTaskById = async (id: number): Promise<ITaskDetail> => {
  const res = await api.get(`/tasks/${id}`);
  return res.data;
};

// UPDATE
export const updateTask = async (
  id: number,
  data: Partial<ITask>
) => {
  const res = await api.put(`/tasks/${id}`, data);
  return res.data;
};

// DELETE
export const deleteTask = async (id: number) => {
  const res = await api.delete(`/tasks/${id}`);
  return res.data;
};

// LOG PROGRESS
export const logTaskProgress = async (
  id: number,
  progress: number
): Promise<IProgressLog> => {
  const res = await api.post(`/tasks/${id}/progress`, { progress });
  return res.data;
};

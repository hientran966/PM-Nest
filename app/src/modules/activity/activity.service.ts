import api from "@/services/api";
import { IActivityLog, IActivityQuery } from "./activity.types";

// CREATE ACTIVITY LOG
export const createActivityLog = async (data: Partial<IActivityLog>) => {
  const res = await api.post("/activities", data);
  return res.data;
};

// GET ALL ACTIVITIES
export const getActivities = async (
  query?: IActivityQuery
): Promise<IActivityLog[]> => {
  const res = await api.get("/activities", { params: query });
  return res.data;
};

// GET ACTIVITY BY ID
export const getActivityById = async (id: number): Promise<IActivityLog> => {
  const res = await api.get(`/activities/${id}`);
  return res.data;
};

// UPDATE ACTIVITY
export const updateActivity = async (
  id: number,
  data: Partial<IActivityLog>
) => {
  const res = await api.put(`/activities/${id}`, data);
  return res.data;
};

// DELETE ACTIVITY
export const deleteActivity = async (id: number) => {
  const res = await api.delete(`/activities/${id}`);
  return res.data;
};

// RESTORE ACTIVITY
export const restoreActivity = async (id: number) => {
  const res = await api.put(`/activities/restore/${id}`);
  return res.data;
};

// GET ACTIVITIES BY TASK
export const getActivitiesByTask = async (taskId: number): Promise<IActivityLog[]> => {
  const res = await api.get(`/activities/task/${taskId}`);
  return res.data;
};

import api from "@/services/api";
import {
  IProject,
  IProjectDetail,
  IProjectQuery,
  IProjectReport,
  IProjectRole,
} from "./project.types";

// CREATE
export const createProject = async (data: Partial<IProject>) => {
  const res = await api.post("/projects", data);
  return res.data;
};

// GET ALL
export const getProjects = async (
  query?: IProjectQuery
): Promise<IProject[]> => {
  const res = await api.get("/projects", { params: query });
  return res.data;
};

// GET ONE
export const getProjectById = async (
  id: number
): Promise<IProjectDetail> => {
  const res = await api.get(`/projects/${id}`);
  return res.data;
};

// UPDATE
export const updateProject = async (
  id: number,
  data: Partial<IProject>
) => {
  const res = await api.put(`/projects/${id}`, data);
  return res.data;
};

// DELETE
export const deleteProject = async (
  id: number,
) => {
  const res = await api.delete(`/projects/${id}`);
  return res.data;
};

// GET BY USER
export const getProjectsByUser = async (): Promise<IProject[]> => {
  const res = await api.get("/projects/me");
  return res.data;
};

// ROLE
export const getProjectRole = async (
  projectId: number
): Promise<IProjectRole | null> => {
  const res = await api.get(`/projects/${projectId}/role`);
  return res.data;
};

// REPORT
export const getProjectReport = async (
  id: number
): Promise<IProjectReport> => {
  const res = await api.get(`/projects/${id}/report`);
  return res.data;
};
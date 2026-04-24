import api from "@/services/api";
import { IMember, IMemberInvite, IMemberQuery } from "./member.types";

// CREATE MEMBER
export const createMember = async (data: Partial<IMember>) => {
  const res = await api.post("/members", data);
  return res.data;
};

// GET MEMBERS BY PROJECT
export const getMembersByProject = async (
  projectId: number
): Promise<IMember[]> => {
  const res = await api.get(`/members/project/${projectId}`);
  return res.data;
};

// GET MY INVITES
export const getMyInvites = async (): Promise<IMemberInvite[]> => {
  const res = await api.get("/members/invites");
  return res.data;
};

// ACCEPT INVITE
export const acceptInvite = async (id: number) => {
  const res = await api.put(`/members/${id}/accept`);
  return res.data;
};

// DECLINE INVITE
export const declineInvite = async (id: number) => {
  const res = await api.put(`/members/${id}/decline`);
  return res.data;
};

// GET MEMBER BY ID
export const getMemberById = async (id: number): Promise<IMember> => {
  const res = await api.get(`/members/${id}`);
  return res.data;
};

// UPDATE MEMBER
export const updateMember = async (
  id: number,
  data: Partial<IMember>
) => {
  const res = await api.put(`/members/${id}`, data);
  return res.data;
};

// DELETE MEMBER
export const deleteMember = async (id: number) => {
  const res = await api.delete(`/members/${id}`);
  return res.data;
};

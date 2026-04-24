import api from "@/services/api";
import { INotification, INotificationQuery, INotificationCount } from "./notification.types";

// GET MY NOTIFICATIONS
export const getMyNotifications = async (
  query?: INotificationQuery
): Promise<INotification[]> => {
  const res = await api.get("/notifications/me", { params: query });
  return res.data;
};

// GET MY NOTIFICATION COUNT
export const getMyNotificationCount = async (): Promise<INotificationCount> => {
  const res = await api.get("/notifications/me/count");
  return res.data;
};

// MARK AS READ
export const markNotificationAsRead = async (id: number) => {
  const res = await api.patch(`/notifications/${id}/read`);
  return res.data;
};

// MARK ALL AS READ
export const markAllNotificationsAsRead = async () => {
  const res = await api.patch("/notifications/me/read");
  return res.data;
};

// MARK ALL AS UNREAD
export const markAllNotificationsAsUnread = async () => {
  const res = await api.patch("/notifications/me/unread");
  return res.data;
};

// GET NOTIFICATION BY ID
export const getNotificationById = async (id: number): Promise<INotification> => {
  const res = await api.get(`/notifications/${id}`);
  return res.data;
};

// DELETE NOTIFICATION
export const deleteNotification = async (id: number) => {
  const res = await api.delete(`/notifications/${id}`);
  return res.data;
};

// RESTORE NOTIFICATION
export const restoreNotification = async (id: number) => {
  const res = await api.put(`/notifications/deactive/${id}`);
  return res.data;
};

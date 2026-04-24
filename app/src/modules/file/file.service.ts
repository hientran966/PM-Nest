import api from "@/services/api";
import { IFile, IFileVersion, IFileDetail, IFileQuery } from "./file.types";

// CREATE FILE
export const createFile = async (
  formData: FormData
): Promise<IFileDetail> => {
  const res = await api.post("/files", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data?.result;
};

// GET ALL FILES
export const getFiles = async (query?: IFileQuery): Promise<IFile[]> => {
  const res = await api.get("/files", { params: query });
  return res.data;
};

// GET FILE BY ID
export const getFileById = async (id: number): Promise<IFileDetail> => {
  const res = await api.get(`/files/${id}`);
  return res.data;
};

// ADD FILE VERSION
export const addFileVersion = async (
  fileId: number,
  formData: FormData
): Promise<IFileVersion> => {
  const res = await api.post(`/files/${fileId}/version`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data?.result;
};

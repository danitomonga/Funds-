import api from "./api";
import { API } from "@/lib/constants";
import type { ApiResponse, User } from "@/lib/types";

export const userService = {
  async getAll(): Promise<User[]> {
    const res = await api.get<User[] | [User[], number]>(API.USERS);
    const data = res.data;

    // Backend may return direct user array, or tuple [users, count] for pagination.
    if (Array.isArray(data)) {
      // If format is [users, count], first element is the array.
      if (data.length > 0 && Array.isArray(data[0]) && typeof data[1] === "number") {
        return data[0] as User[];
      }
      return data as User[];
    }

    return [];
  },

  async getById(id: number): Promise<User> {
    const res = await api.get<User>(API.USER_BY_ID(id));
    return res.data;
  },

  async promoteToAdmin(id: number): Promise<ApiResponse> {
    const res = await api.put<ApiResponse>(API.PROMOTE_ADMIN(id));
    return res.data;
  },

  async promoteToSuperAdmin(id: number): Promise<ApiResponse> {
    const res = await api.put<ApiResponse>(API.PROMOTE_SUPER(id));
    return res.data;
  },
};

import api from "./api";
import { API } from "@/lib/constants";
import type { ApiResponse, CreateInvestmentRequest } from "@/lib/types";

export const investmentService = {
  async create(data: CreateInvestmentRequest): Promise<ApiResponse> {
    const res = await api.post<ApiResponse>(API.INVESTMENTS, data);
    return res.data;
  },
};

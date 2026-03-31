import api from "./api";
import { API } from "@/lib/constants";
import type { ApiResponse, ReportSummary, ReportDetail } from "@/lib/types";

export const reportService = {
  async getAll(fundId?: number): Promise<ReportSummary[]> {
    const url = fundId ? `${API.REPORTS}?fund_id=${fundId}` : API.REPORTS;
    const res = await api.get<ApiResponse<ReportSummary[]>>(url);
    return res.data.data ?? [];
  },

  async getById(id: number): Promise<ReportDetail> {
    const res = await api.get<ApiResponse<ReportDetail>>(API.REPORT_BY_ID(id));
    return res.data.data as ReportDetail;
  },

  async getPortfolio(asOf?: string): Promise<ApiResponse> {
    const url = asOf ? `${API.PORTFOLIO}?as_of=${asOf}` : API.PORTFOLIO;
    const res = await api.get<ApiResponse>(url);
    return res.data;
  },

  /** Opens PDF in new tab (direct Flask URL with token) */
  downloadPdf(id: number): void {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
    window.open(`${baseUrl}${API.REPORT_PDF(id)}`, "_blank");
  },

  /** Opens Excel download in new tab */
  downloadBatchSummary(batchId: number): void {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
    window.open(`${baseUrl}${API.BATCH_SUMMARY_EXCEL(batchId)}`, "_blank");
  },
};

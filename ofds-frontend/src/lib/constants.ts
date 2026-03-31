import type { BatchStage, UserRole } from "./types";

// ── Roles ──

export const ROLES = {
  USER: "user" as UserRole,
  ADMIN: "admin" as UserRole,
  SUPER_ADMIN: "super_admin" as UserRole,
} as const;

// ── Batch Stages ──

export const STAGE_LABELS: Record<BatchStage, string> = {
  1: "Deposited",
  2: "Transferred",
  3: "Deployed",
  4: "Active",
};

export const STAGE_DESCRIPTIONS: Record<BatchStage, string> = {
  1: "Investments deposited into batch",
  2: "Funds transferred to custodian",
  3: "Deployment confirmed with date",
  4: "Batch is actively trading",
};

// ── Routes ──

export const ROUTES = {
  // Auth
  LOGIN: "/login",
  REGISTER: "/register",

  // Dashboard
  OVERVIEW: "/overview",

  // Batches
  BATCHES: "/batches",
  BATCH_CREATE: "/batches/new",
  BATCH_DETAIL: (id: number | string) => `/batches/${id}`,
  BATCH_PERFORMANCE: (id: number | string) => `/batches/${id}/performance`,

  // Funds
  FUNDS: "/funds",
  FUND_DETAIL: (id: number | string) => `/funds/${id}`,

  // Valuations
  VALUATIONS: "/valuations",
  VALUATION_CREATE: "/valuations/new",

  // Reports
  REPORTS: "/reports",
  REPORT_DETAIL: (id: number | string) => `/reports/${id}`,
  PORTFOLIO: "/reports/portfolio",

  // Withdrawals
  WITHDRAWALS: "/withdrawals",

  // Users
  USERS: "/users",

  // Super Admin
  AUDIT_LOG: "/audit-log",

  // Settings
  SETTINGS: "/settings",
} as const;

// ── API Paths ──

export const API = {
  // Auth
  LOGIN: "/login",
  REGISTER: "/users",
  USERS: "/users",
  USER_BY_ID: (id: number) => `/users/${id}`,
  PROMOTE_ADMIN: (id: number) => `/admin/${id}`,
  PROMOTE_SUPER: (id: number) => `/super_admin/${id}`,
  EMPLOYEES: "/employees",

  // Batches
  BATCHES: "/batches",
  BATCH_BY_ID: (id: number) => `/batches/${id}`,
  BATCH_SUMMARY: (id: number) => `/batches/${id}/summary`,
  BATCH_FUNDS: (id: number) => `/batches/${id}/funds`,
  BATCH_UPLOAD_EXCEL: (id: number) => `/batches/${id}/upload-excel`,
  BATCH_TOGGLE_ACTIVE: (id: number) => `/batches/${id}/toggle-active`,

  // Investments
  INVESTMENTS: "/investments",

  // Withdrawals
  WITHDRAWALS: "/withdrawals",
  WITHDRAWALS_UPLOAD: "/withdrawals/upload",

  // Funds
  FUNDS: "/funds",

  // Performance
  BATCH_PERFORMANCE: (batchId: number) => `/batches/${batchId}/performance`,
  BATCH_PRO_RATA: (batchId: number) => `/batches/${batchId}/calculate-pro-rata`,
  PERFORMANCE_UPLOAD_EXCEL: "/performance/upload-excel",

  // Valuation
  VALUATION_EPOCH: "/valuation/epoch",
  VALUATION_DRY_RUN: "/valuation/dry-run",
  VALUATION_FUNDS: "/valuation/funds",

  // Reports
  REPORTS: "/reports",
  REPORT_BY_ID: (id: number) => `/reports/${id}`,
  REPORT_PDF: (id: number) => `/reports/${id}/pdf`,
  PORTFOLIO: "/reports/portfolio",
  PORTFOLIO_MULTI_BATCH: "/reports/portfolio/multi-batch",
  BATCH_SUMMARY_EXCEL: (id: number) => `/reports/batch/${id}/summary`,
  BATCH_RECONCILIATION: (id: number) => `/reports/batch/${id}/reconciliation`,

  // Audit (backend dependency — endpoint may not exist yet)
  AUDIT_LOGS: "/audit-logs",
} as const;

// ── Chart Colors (mapped to fund identity) ──

export const FUND_COLORS: Record<string, string> = {
  axiom: "#3B6FD4",
  atium: "#3DBB78",
  default: "#D4940B",
};

export const CHART_COLORS = {
  deposit: "#3DBB78",
  withdrawal: "#D44B4B",
  grid: "#1E293B",
  label: "#94A3B8",
  tooltipBg: "#0B1228",
  tooltipBorder: "#1E293B",
} as const;

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js";

// ── Register all Chart.js components globally ──
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend
);

// ── OFDS Fund Colors — Matched to Reference Images ──
export const FUND_COLORS: Record<string, string> = {
  axiom:   "#0066ff",
  atium:   "#22c55e",
  default: "#f59e0b",
};

export function getFundColor(fundName: string): string {
  const key = fundName.toLowerCase().trim();
  return FUND_COLORS[key] ?? FUND_COLORS.default ?? "#6B9AEE";
}

// ── Flow Colors ──
export const FLOW_COLORS = {
  deposit:    "#22c55e",
  withdrawal: "#ef4444",
} as const;

// ── Shared Chart.js canvas colours ──
const GRID_COLOR     = "rgba(255,255,255,0.05)";
const LABEL_COLOR    = "#64748b";
const TOOLTIP_BG     = "#1e293b";
const TOOLTIP_BORDER = "rgba(255,255,255,0.08)";

// ── Base options (line + bar) ──
export const baseChartOptions: ChartOptions<"line"> & ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: TOOLTIP_BG,
      titleColor: "#ffffff",
      bodyColor: LABEL_COLOR,
      borderColor: TOOLTIP_BORDER,
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      titleFont: { size: 12, weight: "bold" as const },
      bodyFont: { size: 11 },
    },
  },
  scales: {
    x: {
      ticks: { color: LABEL_COLOR, font: { size: 11 } },
      grid:  { color: GRID_COLOR },
      border: { color: "transparent" },
    },
    y: {
      ticks: { color: LABEL_COLOR, font: { size: 11 } },
      grid:  { color: GRID_COLOR },
      border: { color: "transparent" },
    },
  },
};

// ── Doughnut options ──
export const doughnutOptions: ChartOptions<"doughnut"> = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "72%",
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: TOOLTIP_BG,
      titleColor: "#ffffff",
      bodyColor: LABEL_COLOR,
      borderColor: TOOLTIP_BORDER,
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
    },
  },
};

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { KPICard } from "@/components/data/KPICard";
import { ChartCard } from "@/components/charts/ChartCard";
import { FundPerformanceLineChart } from "@/components/charts/FundPerformanceLineChart";
import { PortfolioAUMChart } from "@/components/charts/PortfolioAUMChart";
import { DepositsWithdrawalsBarChart } from "@/components/charts/DepositsWithdrawalsBarChart";
import { fundService } from "@/services/fundService";
import { reportService } from "@/services/reportService";
import { formatCurrencyCompact } from "@/lib/utils";
import { getFundColor, FLOW_COLORS } from "@/lib/chartConfig";
import type { CoreFund, ReportSummary } from "@/lib/types";
import { ArrowLeft, Landmark } from "lucide-react";

export default function FundDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fundId = Number(id);
  const [fund, setFund] = useState<CoreFund | null>(null);
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [funds, reps] = await Promise.allSettled([
          fundService.getAll(),
          reportService.getAll(fundId),
        ]);
        if (funds.status === "fulfilled") setFund(funds.value.find((f) => f.id === fundId) || null);
        if (reps.status === "fulfilled") setReports(reps.value);
      } finally {
        setLoading(false);
      }
    }
    if (fundId) load();
  }, [fundId]);

  const sorted = [...reports].sort((a, b) => new Date(a.epoch_end).getTime() - new Date(b.epoch_end).getTime());
  const labels = sorted.map((r) => new Date(r.epoch_end).toLocaleDateString("en-GB", { month: "short", year: "2-digit" }));

  const latestAUM = sorted[sorted.length - 1]?.summary?.total_closing_aum || 0;
  const latestRate = sorted[sorted.length - 1]?.performance_rate_percent || 0;
  const totalInvestors = sorted[sorted.length - 1]?.summary?.investor_count || 0;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--color-border-subtle)", borderTopColor: "var(--color-brand-400)" }} /></div>;

  return (
    <div>
      <button onClick={() => navigate("/funds")} className="flex items-center gap-1 text-[12px] mb-3 cursor-pointer" style={{ color: "var(--color-text-tertiary)" }}><ArrowLeft size={14} /> Funds</button>

      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--color-brand-50)" }}><Landmark size={18} style={{ color: "var(--color-brand-400)" }} /></div>
        <div>
          <h1 className="fs-4 fw-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>{fund?.fund_name || "Fund"}</h1>
          <span className="text-[10px] fw-bold px-2 py-0.5 rounded" style={{ background: fund?.is_active ? "var(--color-success-bg)" : "var(--color-destructive-bg)", color: fund?.is_active ? "var(--color-success)" : "var(--color-destructive)" }}>{fund?.is_active ? "Active" : "Inactive"}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        <KPICard label="Current AUM" value={formatCurrencyCompact(latestAUM)} />
        <KPICard label="Latest performance" value={`${latestRate.toFixed(2)}%`} />
        <KPICard label="Investors" value={String(totalInvestors)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Performance (%)" subtitle="Rate per epoch" legend={[{ label: fund?.fund_name || "Fund", color: getFundColor(fund?.fund_name || "") }]}>
          <FundPerformanceLineChart data={{ labels: labels.length ? labels : ["—"], funds: [{ name: fund?.fund_name || "Fund", data: sorted.map((r) => r.performance_rate_percent) }] }} />
        </ChartCard>

        <ChartCard title="AUM over time" subtitle="Closing balance per epoch" legend={[{ label: fund?.fund_name || "Fund", color: getFundColor(fund?.fund_name || "") }]}>
          <PortfolioAUMChart data={{ labels: labels.length ? labels : ["—"], funds: [{ name: fund?.fund_name || "Fund", data: sorted.map((r) => r.summary.total_closing_aum) }] }} />
        </ChartCard>

        <ChartCard title="Deposits vs withdrawals" subtitle="Per epoch period" legend={[{ label: "Deposits", color: FLOW_COLORS.deposit }, { label: "Withdrawals", color: FLOW_COLORS.withdrawal }]} >
          <DepositsWithdrawalsBarChart data={{ labels: labels.length ? labels : ["—"], deposits: sorted.map((r) => r.summary.total_deposits), withdrawals: sorted.map((r) => r.summary.total_withdrawals) }} />
        </ChartCard>
      </div>
    </div>
  );
}

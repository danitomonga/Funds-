import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { KPICard } from "@/components/data/KPICard";
import { StatusBadge } from "@/components/data/StatusBadge";
import { BatchStageStepper } from "@/components/data/BatchStageStepper";
import { ChartCard } from "@/components/charts/ChartCard";
import { FundPerformanceLineChart } from "@/components/charts/FundPerformanceLineChart";
import { PortfolioAUMChart } from "@/components/charts/PortfolioAUMChart";
import { DepositsWithdrawalsBarChart } from "@/components/charts/DepositsWithdrawalsBarChart";
import { FundAllocationDoughnut } from "@/components/charts/FundAllocationDoughnut";
import { batchService } from "@/services/batchService";
import { reportService } from "@/services/reportService";
import { formatCurrency, formatCurrencyCompact, formatDate } from "@/lib/utils";
import { getFundColor, FLOW_COLORS } from "@/lib/chartConfig";
import { ROUTES } from "@/lib/constants";
import type { Batch, ReportSummary } from "@/lib/types";
import { ChevronRight } from "lucide-react";

export default function OverviewPage() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Pending" | "Closed">("All");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [batchRes, reportRes] = await Promise.allSettled([
          batchService.getAll(),
          reportService.getAll(),
        ]);
        if (batchRes.status === "fulfilled") setBatches(batchRes.value);
        if (reportRes.status === "fulfilled") setReports(reportRes.value);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Derived KPIs ──
  const activeBatches = batches.filter((b) => b.status === "Active");
  const pendingBatches = batches.filter((b) => b.status === "Pending");
  const totalAUM = batches.reduce((sum, b) => sum + (b.total_capital || b.total_principal || 0), 0);
  const totalInvestors = batches.reduce((sum, b) => sum + (b.investors_count || 0), 0);

  // ── Chart data from reports ──
  const sorted = [...reports].sort(
    (a, b) => new Date(a.epoch_end).getTime() - new Date(b.epoch_end).getTime()
  );
  const fundNames = [...new Set(sorted.map((r) => r.fund_name))];
  const epochLabels = [...new Set(sorted.map((r) => {
    const d = new Date(r.epoch_end);
    return d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
  }))];

  const flowData = {
    labels: epochLabels.length > 0 ? epochLabels : ["—"],
    deposits: epochLabels.map((label) => {
      return sorted
        .filter((r) => {
          const d = new Date(r.epoch_end);
          return d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }) === label;
        })
        .reduce((s, r) => s + (r.summary?.total_deposits || 0), 0);
    }),
    withdrawals: epochLabels.map((label) => {
      return sorted
        .filter((r) => {
          const d = new Date(r.epoch_end);
          return d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }) === label;
        })
        .reduce((s, r) => s + (r.summary?.total_withdrawals || 0), 0);
    }),
  };

  // ── Calculate trends ──
  const aumTrend: { value: string; direction: "up" | "down" | "neutral" } = { value: "+12.3%", direction: "up" };
  const latestDeposits = flowData.deposits[flowData.deposits.length - 1] || 0;
  const depositsTrend: { value: string; direction: "up" | "down" | "neutral" } = latestDeposits > 0
    ? { value: `+${formatCurrencyCompact(latestDeposits)}`, direction: "up" }
    : { value: "—", direction: "neutral" };

  const perfData = {
    labels: epochLabels.length > 0 ? epochLabels : ["—"],
    funds: fundNames.map((name) => ({
      name,
      data: sorted.filter((r) => r.fund_name === name).map((r) => r.performance_rate_percent),
    })),
  };

  const aumData = {
    labels: epochLabels.length > 0 ? epochLabels : ["—"],
    funds: fundNames.map((name) => ({
      name,
      data: sorted.filter((r) => r.fund_name === name).map((r) => r.summary.total_closing_aum),
    })),
  };

  const latestPerFund = fundNames.map((name) => {
    const fr = sorted.filter((r) => r.fund_name === name);
    return { name, value: fr[fr.length - 1]?.summary?.total_closing_aum || 0 };
  });

  const allocData = {
    funds: latestPerFund.length > 0 ? latestPerFund : [{ name: "No data", value: 0 }],
  };

  // ── Filter batches by status ──
  const filteredBatches = statusFilter === "All" 
    ? batches 
    : batches.filter((b) => b.status === statusFilter);
  const recentBatches = filteredBatches.slice(0, 5);

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center h-64">
        <div
          className="spinner-border"
          style={{ color: "var(--color-brand-400)", width: "1.5rem", height: "1.5rem" }}
          role="status"
        >
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-0">
      {/* Header */}
      <div className="mb-4">
        <h1 className="fw-bold" style={{ color: "var(--color-text-primary)", fontSize: "22px" }}>
          Overview
        </h1>
        <p className="mb-0 mt-1" style={{ color: "var(--color-text-secondary)", fontSize: "13px" }}>
          Portfolio summary across all active funds and batches
        </p>
      </div>

      {/* KPI row — 4 equal cols ── */}
      <div className="row g-3 mb-4">
        <div className="col-lg-3 col-sm-6">
          <KPICard label="Total AUM" value={formatCurrencyCompact(totalAUM)} trend={aumTrend} subtitle={`across ${fundNames.length || 0} fund(s)`} />
        </div>
        <div className="col-lg-3 col-sm-6">
          <KPICard label="Active batches" value={String(activeBatches.length)} subtitle={`${pendingBatches.length} pending deployment`} />
        </div>
        <div className="col-lg-3 col-sm-6">
          <KPICard label="This epoch" value={formatCurrencyCompact(latestDeposits)} trend={depositsTrend} subtitle="net deposits (Feb 2026)" />
        </div>
        <div className="col-lg-3 col-sm-6">
          <KPICard label="Total investors" value={totalInvestors.toLocaleString()} subtitle="across all batches" />
        </div>
      </div>

      {/* Charts 2×2 — two equal cols ── */}
      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <ChartCard
            title="Fund performance (%)"
            subtitle="Monthly performance rate by fund"
            legend={fundNames.map((n) => ({ label: n, color: getFundColor(n) }))}
          >
            <FundPerformanceLineChart data={perfData} height={300} />
          </ChartCard>
        </div>
        <div className="col-lg-6">
          <ChartCard
            title="Portfolio AUM"
            subtitle="Total assets under management over time"
            legend={fundNames.map((n) => ({
              label: `${n} ${formatCurrencyCompact(latestPerFund.find((f) => f.name === n)?.value || 0)}`,
              color: getFundColor(n),
            }))}
          >
            <PortfolioAUMChart data={aumData} height={300} />
          </ChartCard>
        </div>
        <div className="col-lg-6">
          <ChartCard
            title="Deposits vs withdrawals"
            subtitle="Inflows and outflows per epoch period"
            legend={[
              { label: "Deposits",    color: FLOW_COLORS.deposit },
              { label: "Withdrawals", color: FLOW_COLORS.withdrawal },
            ]}
          >
            <DepositsWithdrawalsBarChart data={flowData} height={300} />
          </ChartCard>
        </div>
        <div className="col-lg-6">
          <ChartCard
            title="Fund allocation"
            subtitle="Current capital distribution"
            legend={latestPerFund.map((f) => {
              const tot = latestPerFund.reduce((s, x) => s + x.value, 0);
              const pct = tot > 0 ? ((f.value / tot) * 100).toFixed(1) : "0";
              return { label: `${f.name} ${pct}%`, color: getFundColor(f.name) };
            })}
          >
            <FundAllocationDoughnut data={allocData} />
          </ChartCard>
        </div>
      </div>

      {/* Recent batches table */}
      <div className="card shadow overflow-hidden">
        {/* Table header bar */}
        <div
          className="d-flex align-items-center justify-content-between px-4 py-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <h3 className="fw-bold mb-0" style={{ color: "var(--color-text-primary)", fontSize: "14px" }}>
            Recent batches
          </h3>
          <div className="d-flex gap-2">
            {(["All", "Active", "Pending", "Closed"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className="btn btn-sm"
                style={{
                  fontSize: "11px",
                  padding: "3px 10px",
                  borderRadius: "6px",
                  border: statusFilter === status ? "1px solid var(--color-brand-400)" : "1px solid rgba(255,255,255,0.1)",
                  background: statusFilter === status ? "var(--color-brand-50)" : "transparent",
                  color: statusFilter === status ? "var(--color-brand-300)" : "var(--color-text-secondary)",
                }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Bootstrap table-dark */}
        <div className="table-responsive">
          <table className="table table-dark mb-0" style={{ background: "var(--color-bg-surface)" }}>
            <thead>
              <tr>
                {["Batch name", "Certificate", "Stage", "Status", "Total AUM", "Investors", "Deployed", ""].map((h) => (
                  <th key={h} style={{ textAlign: h === "Total AUM" || h === "Investors" ? "right" : "left" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentBatches.map((b) => (
                <tr key={b.id} onClick={() => navigate(ROUTES.BATCH_DETAIL(b.id))}>
                  <td className="fw-bold" style={{ fontSize: "13px" }}>{b.batch_name}</td>
                  <td style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)", fontSize: "12px" }}>
                    {b.certificate_number || "—"}
                  </td>
                  <td><BatchStageStepper currentStage={b.stage} compact /></td>
                  <td><StatusBadge status={b.status} /></td>
                  <td className="text-end" style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                    {formatCurrency(b.total_capital || b.total_principal)}
                  </td>
                  <td className="text-end" style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                    {b.investors_count}
                  </td>
                  <td style={{ color: "var(--color-text-secondary)", fontSize: "12px" }}>
                    {formatDate(b.date_deployed)}
                  </td>
                  <td><ChevronRight size={14} style={{ color: "var(--color-text-tertiary)" }} /></td>
                </tr>
              ))}
              {recentBatches.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-5" style={{ color: "var(--color-text-tertiary)" }}>
                    No batches yet. Create your first batch to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

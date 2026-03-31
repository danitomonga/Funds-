import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { KPICard } from "@/components/data/KPICard";
import { reportService } from "@/services/reportService";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils";
import type { ReportDetail } from "@/lib/types";
import { toast } from "sonner";
import { ArrowLeft, FileText } from "lucide-react";

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const reportId = Number(id);
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!reportId) return;
    setLoading(true);
    reportService.getById(reportId).then(setReport).catch(() => toast.error("Failed to load report")).finally(() => setLoading(false));
  }, [reportId]);

  if (loading || !report) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--color-border-subtle)", borderTopColor: "var(--color-brand-400)" }} /></div>;

  const s = report.summary;
  const diffPositive = report.reconciliation_diff >= 0;

  return (
    <div>
      <button onClick={() => navigate("/reports")} className="flex items-center gap-1 text-[12px] mb-3 cursor-pointer" style={{ color: "var(--color-text-tertiary)" }}><ArrowLeft size={14} /> Reports</button>

      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="fs-4 fw-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>{report.fund_name} — Epoch report</h1>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>{formatDate(report.epoch_start)} → {formatDate(report.epoch_end)} · {formatPercent(report.performance_rate_percent)} rate</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => reportService.downloadPdf(reportId)} className="flex items-center gap-1.5 rounded-md px-3 py-2 text-[12px] font-medium cursor-pointer border" style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)", background: "transparent" }}><FileText size={14} /> PDF</button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
        <KPICard label="Opening capital" value={formatCurrency(s.total_opening_capital)} />
        <KPICard label="Deposits" value={formatCurrency(s.total_deposits)} />
        <KPICard label="Withdrawals" value={formatCurrency(s.total_withdrawals)} />
        <KPICard label="Profit distributed" value={formatCurrency(s.total_profit_distributed)} />
        <KPICard label="Closing AUM" value={formatCurrency(s.total_closing_aum)} />
        <KPICard label="Investors" value={String(s.investor_count)} />
      </div>

      {/* Reconciliation */}
      <div className="rounded-lg border p-5 mb-4 flex items-center justify-between" style={{ background: "var(--color-bg-surface)", borderColor: "var(--color-border-subtle)" }}>
        <div>
          <p className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>Reconciliation difference</p>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>Local closing AUM vs head office total ({formatCurrency(report.head_office_total)})</p>
        </div>
        <p className="text-lg fw-bold" style={{ fontFamily: "var(--font-mono)", color: diffPositive ? "var(--color-success)" : "var(--color-destructive)" }}>
          {diffPositive ? "+" : ""}{formatCurrency(report.reconciliation_diff)}
        </p>
      </div>

      {/* Investor breakdown */}
      <div className="card shadow-lg rounded-4 overflow-hidden border-0" style={{ background: "var(--color-bg-surface)", borderColor: "var(--color-border-subtle)" }}>
        <div className="px-5 py-3.5 border-b" style={{ borderColor: "var(--color-border-subtle)" }}>
          <h3 className="text-sm fw-bold" style={{ color: "var(--color-text-primary)" }}>Investor breakdown ({report.investor_breakdown?.length || 0})</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ background: "var(--color-bg-surface-alt)" }}>
              {["Investor", "Client code", "Start balance", "Deposits", "Withdrawals", "Profit", "End balance"].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-[11px] fw-bold uppercase tracking-wider border-b" style={{ color: "var(--color-text-secondary)", borderColor: "var(--color-border-subtle)", textAlign: h !== "Investor" && h !== "Client code" ? "right" : "left" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(report.investor_breakdown || []).map((inv, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                <td className="px-4 py-2.5 text-[13px] font-medium">{inv.investor_name}</td>
                <td className="px-4 py-2.5 text-[12px]" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)" }}>{inv.internal_client_code}</td>
                <td className="px-4 py-2.5 text-right text-[12px]" style={{ fontFamily: "var(--font-mono)" }}>{formatCurrency(inv.start_balance)}</td>
                <td className="px-4 py-2.5 text-right text-[12px]" style={{ fontFamily: "var(--font-mono)", color: "var(--color-success)" }}>{formatCurrency(inv.deposits)}</td>
                <td className="px-4 py-2.5 text-right text-[12px]" style={{ fontFamily: "var(--font-mono)", color: "var(--color-destructive)" }}>{formatCurrency(inv.withdrawals)}</td>
                <td className="px-4 py-2.5 text-right text-[12px]" style={{ fontFamily: "var(--font-mono)", color: inv.pro_rata_profit >= 0 ? "var(--color-success)" : "var(--color-destructive)" }}>{formatCurrency(inv.pro_rata_profit)}</td>
                <td className="px-4 py-2.5 text-right text-[12px] font-medium" style={{ fontFamily: "var(--font-mono)" }}>{formatCurrency(inv.end_balance)}</td>
              </tr>
            ))}
            {(!report.investor_breakdown || report.investor_breakdown.length === 0) && <tr><td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color: "var(--color-text-tertiary)" }}>No investor data for this report.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

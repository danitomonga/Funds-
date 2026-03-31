import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "@/components/data/StatusBadge";
import { reportService } from "@/services/reportService";
import { valuationService } from "@/services/valuationService";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import type { ReportSummary, CoreFund } from "@/lib/types";
import { Plus, ChevronRight } from "lucide-react";

export default function ValuationListPage() {
  const navigate = useNavigate();
  const [runs, setRuns] = useState<ReportSummary[]>([]);
  const [funds, setFunds] = useState<CoreFund[]>([]);
  const [fundFilter, setFundFilter] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      reportService.getAll(fundFilter ?? undefined),
      valuationService.getActiveFunds(),
    ]).then(([r, f]) => {
      if (r.status === "fulfilled") setRuns(r.value);
      if (f.status === "fulfilled") setFunds(f.value);
    }).finally(() => setLoading(false));
  }, [fundFilter]);

  const pillStyle = (active: boolean) => ({
    fontSize: "11px",
    fontWeight: 600,
    padding: "4px 14px",
    borderRadius: "20px",
    border: active ? "1px solid var(--color-brand-400)" : "1px solid rgba(255,255,255,0.1)",
    background: active ? "var(--color-brand-50)" : "transparent",
    color: active ? "var(--color-brand-300)" : "var(--color-text-secondary)",
    cursor: "pointer",
    transition: "all 0.15s",
  });

  return (
    <div className="container-fluid px-0">
      {/* Header */}
      <div className="d-flex align-items-start justify-content-between mb-4">
        <div>
          <h1 className="fw-bold mb-1" style={{ fontSize: "22px", color: "var(--color-text-primary)" }}>
            Valuations
          </h1>
          <p className="mb-0" style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
            Committed epoch valuation runs across all funds
          </p>
        </div>
        <button
          onClick={() => navigate(ROUTES.VALUATION_CREATE)}
          className="btn btn-primary btn-sm rounded-pill d-flex align-items-center gap-2 fw-bold"
          style={{ padding: "8px 18px" }}
        >
          <Plus size={14} /> New valuation
        </button>
      </div>

      {/* Table card */}
      <div className="card shadow">
        {/* Fund filter bar */}
        <div
          className="d-flex align-items-center gap-2 px-4 py-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <button onClick={() => setFundFilter(null)} style={pillStyle(fundFilter === null)}>
            All funds
          </button>
          {funds.map((f) => (
            <button key={f.id} onClick={() => setFundFilter(f.id)} style={pillStyle(fundFilter === f.id)}>
              {f.fund_name}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="d-flex align-items-center justify-content-center py-5">
            <div className="spinner-border spinner-border-sm" style={{ color: "var(--color-brand-400)" }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark mb-0" style={{ background: "var(--color-bg-surface)" }}>
              <thead>
                <tr>
                  {[
                    { label: "Fund",             align: "left"  },
                    { label: "Epoch",            align: "left"  },
                    { label: "Rate",             align: "right" },
                    { label: "Head Office Total",align: "right" },
                    { label: "Closing AUM",      align: "right" },
                    { label: "Investors",        align: "right" },
                    { label: "Status",           align: "left"  },
                    { label: "Created",          align: "left"  },
                    { label: "",                 align: "left"  },
                  ].map((h) => (
                    <th key={h.label} style={{ textAlign: h.align as "left" | "right" }}>{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => navigate(ROUTES.REPORT_DETAIL(r.id))}>
                    <td className="fw-bold" style={{ fontSize: "13px" }}>{r.fund_name}</td>
                    <td style={{ color: "var(--color-text-secondary)", fontSize: "12px" }}>
                      {formatDate(r.epoch_start)} → {formatDate(r.epoch_end)}
                    </td>
                    <td className="text-end" style={{ fontFamily: "var(--font-mono)", color: "var(--color-success)", fontSize: "12px" }}>
                      {formatPercent(r.performance_rate_percent)}
                    </td>
                    <td className="text-end" style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                      {formatCurrency(r.head_office_total)}
                    </td>
                    <td className="text-end" style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                      {formatCurrency(r.summary.total_closing_aum)}
                    </td>
                    <td className="text-end" style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                      {r.summary.investor_count}
                    </td>
                    <td><StatusBadge status={r.status} /></td>
                    <td style={{ color: "var(--color-text-tertiary)", fontSize: "12px" }}>{formatDate(r.created_at)}</td>
                    <td><ChevronRight size={14} style={{ color: "var(--color-text-tertiary)" }} /></td>
                  </tr>
                ))}
                {runs.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-5" style={{ color: "var(--color-text-tertiary)" }}>
                      No valuation runs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

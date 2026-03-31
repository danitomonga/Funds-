import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { KPICard } from "@/components/data/KPICard";
import { StatusBadge } from "@/components/data/StatusBadge";
import { BatchStageStepper } from "@/components/data/BatchStageStepper";
import { batchService } from "@/services/batchService";
import { formatCurrency, formatCurrencyCompact, formatDate } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import type { Batch, BatchStatus } from "@/lib/types";
import { Plus, Search, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";

type SortKey = "batch_name" | "total_capital" | "investors_count" | "date_deployed" | "stage";
type SortDir = "asc" | "desc";

const FILTERS: ("All" | BatchStatus)[] = ["All", "Active", "Pending", "Closed"];

export default function BatchListPage() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"All" | BatchStatus>("All");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("batch_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    batchService.getAll()
      .then(setBatches)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let r = batches;
    if (filter !== "All") r = r.filter((b) => b.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(
        (b) =>
          b.batch_name.toLowerCase().includes(q) ||
          (b.certificate_number || "").toLowerCase().includes(q)
      );
    }
    return [...r].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      if (typeof av === "number" && typeof bv === "number")
        return sortDir === "asc" ? av - bv : bv - av;
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [batches, filter, search, sortKey, sortDir]);

  const totalAUM   = batches.reduce((s, b) => s + (b.total_capital || b.total_principal || 0), 0);
  const activeCt   = batches.filter((b) => b.status === "Active").length;
  const pendingCt  = batches.filter((b) => b.status === "Pending").length;
  const investorCt = batches.reduce((s, b) => s + (b.investors_count || 0), 0);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey !== col ? null : sortDir === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />;

  const totalFiltered = filtered.reduce((s, b) => s + (b.total_capital || b.total_principal || 0), 0);

  return (
    <div className="container-fluid px-0">

      {/* ── Page Header ── */}
      <div className="d-flex align-items-start justify-content-between mb-4">
        <div>
          <h1 className="fw-bold mb-1" style={{ fontSize: "22px", color: "var(--color-text-primary)" }}>
            Batches
          </h1>
          <p className="mb-0" style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
            Manage investment batches and track deployment stages
          </p>
        </div>
        <button
          onClick={() => navigate(ROUTES.BATCH_CREATE)}
          className="btn btn-primary btn-sm rounded-pill d-flex align-items-center gap-2 fw-bold"
          style={{ padding: "8px 18px" }}
        >
          <Plus size={14} /> New batch
        </button>
      </div>

      {/* ── KPI Row ── */}
      <div className="row g-3 mb-4">
        <div className="col-lg-3 col-sm-6">
          <KPICard label="Total AUM" value={formatCurrencyCompact(totalAUM)} />
        </div>
        <div className="col-lg-3 col-sm-6">
          <KPICard label="Active" value={String(activeCt)} />
        </div>
        <div className="col-lg-3 col-sm-6">
          <KPICard label="Pending" value={String(pendingCt)} />
        </div>
        <div className="col-lg-3 col-sm-6">
          <KPICard label="Investors" value={investorCt.toLocaleString()} />
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="card shadow">

        {/* Filter + Search bar */}
        <div
          className="d-flex align-items-center justify-content-between px-4 py-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          {/* Status pills */}
          <div className="d-flex gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="btn btn-sm"
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "4px 14px",
                  borderRadius: "20px",
                  border: filter === f
                    ? "1px solid var(--color-brand-400)"
                    : "1px solid rgba(255,255,255,0.1)",
                  background: filter === f ? "var(--color-brand-50)" : "transparent",
                  color: filter === f ? "var(--color-brand-300)" : "var(--color-text-secondary)",
                  transition: "all 0.15s",
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="position-relative">
            <Search
              size={13}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-text-tertiary)",
                pointerEvents: "none",
              }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search batches..."
              className="form-control form-control-sm"
              style={{ paddingLeft: "32px", width: "220px", fontSize: "12px" }}
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="d-flex align-items-center justify-content-center py-5">
            <div
              className="spinner-border spinner-border-sm"
              style={{ color: "var(--color-brand-400)" }}
              role="status"
            >
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark mb-0" style={{ background: "var(--color-bg-surface)" }}>
              <thead>
                <tr>
                  {([
                    { key: "batch_name" as SortKey,       label: "Batch Name",  align: "left"  },
                    { key: null,                           label: "Certificate", align: "left"  },
                    { key: "stage" as SortKey,             label: "Stage",       align: "left"  },
                    { key: null,                           label: "Status",      align: "left"  },
                    { key: "total_capital" as SortKey,     label: "Total AUM",   align: "right" },
                    { key: "investors_count" as SortKey,   label: "Investors",   align: "right" },
                    { key: "date_deployed" as SortKey,     label: "Deployed",    align: "left"  },
                    { key: null,                           label: "",            align: "left"  },
                  ] as const).map((col) => (
                    <th
                      key={col.label}
                      style={{
                        textAlign: col.align as "left" | "right",
                        cursor: col.key ? "pointer" : "default",
                        userSelect: "none",
                      }}
                      onClick={() => col.key && toggleSort(col.key)}
                    >
                      <span className="d-inline-flex align-items-center gap-1">
                        {col.label}
                        {col.key && <SortIcon col={col.key} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr
                    key={b.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(ROUTES.BATCH_DETAIL(b.id))}
                  >
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
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-5" style={{ color: "var(--color-text-tertiary)" }}>
                      No batches match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div
          className="d-flex align-items-center justify-content-between px-4 py-2"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            fontSize: "11px",
            color: "var(--color-text-tertiary)",
          }}
        >
          <span>{filtered.length} batch{filtered.length !== 1 ? "es" : ""}</span>
          <span>Total: {formatCurrency(totalFiltered)}</span>
        </div>
      </div>
    </div>
  );
}

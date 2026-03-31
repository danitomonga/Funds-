import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { KPICard } from "@/components/data/KPICard";
import { StatusBadge } from "@/components/data/StatusBadge";
import { BatchStageStepper } from "@/components/data/BatchStageStepper";
import { batchService } from "@/services/batchService";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ROUTES, STAGE_LABELS } from "@/lib/constants";
import type { Batch, BatchStage } from "@/lib/types";
import { toast } from "sonner";
import { ArrowLeft, Download, Trash2, ChevronRight } from "lucide-react";
import { reportService } from "@/services/reportService";

export default function BatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [investments, setInvestments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const batchId = Number(id);

  useEffect(() => {
    async function load() {
      if (!batchId || isNaN(batchId)) return;
      setLoading(true);
      try {
        const data = await batchService.getById(batchId);
        setBatch(data);
        // Investments come nested in the batch detail response
        setInvestments((data as any).investments || []);
      } catch {
        toast.error("Failed to load batch");
        navigate(ROUTES.BATCHES);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [batchId, navigate]);

  const advanceStage = async () => {
    if (!batch) return;
    const nextStage = (batch.stage + 1) as BatchStage;
    if (nextStage > 4) return;

    const patchData: Record<string, unknown> = { stage: nextStage };
    if (nextStage === 2) patchData.is_transferred = true;
    if (nextStage === 3) {
      patchData.deployment_confirmed = true;
      patchData.date_deployed = new Date().toISOString();
    }
    if (nextStage === 4) patchData.is_active = true;

    try {
      await batchService.patch(batchId, patchData);
      toast.success(`Batch advanced to ${STAGE_LABELS[nextStage]}`);
      // Reload
      const data = await batchService.getById(batchId);
      setBatch(data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update";
      toast.error(msg);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this batch? This cannot be undone.")) return;
    try {
      await batchService.delete(batchId);
      toast.success("Batch deleted");
      navigate(ROUTES.BATCHES);
    } catch {
      toast.error("Failed to delete batch");
    }
  };

  if (loading || !batch) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--color-border-subtle)", borderTopColor: "var(--color-brand-400)" }} />
      </div>
    );
  }

  return (
    <div className="container-fluid px-0">
      {/* Back + header */}
      <button onClick={() => navigate(ROUTES.BATCHES)} className="d-flex align-items-center gap-1 mb-3 btn btn-link p-0 text-decoration-none" style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>
        <ArrowLeft size={14} /> Back to batches
      </button>

      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="d-flex align-items-center gap-3">
            <h1 className="fs-4 fw-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>{batch.batch_name}</h1>
            <StatusBadge status={batch.status} />
          </div>
          {batch.certificate_number && (
            <p className="text-[12px] mt-1" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-tertiary)" }}>{batch.certificate_number}</p>
          )}
        </div>
        <div className="d-flex align-items-center gap-2">
          <button onClick={() => reportService.downloadBatchSummary(batchId)} className="flex items-center gap-1.5 rounded-md px-3 py-2 text-[12px] font-medium cursor-pointer border" style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)", background: "transparent" }}>
            <Download size={14} /> Export
          </button>
          <button onClick={handleDelete} className="flex items-center gap-1.5 rounded-md px-3 py-2 text-[12px] font-medium cursor-pointer" style={{ background: "var(--color-destructive-bg)", color: "var(--color-destructive)" }}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* Stage stepper */}
      <div className="card shadow mb-4" style={{ background: "var(--color-bg-surface)" }}>
        <div className="card-body p-4">
          <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm fw-bold" style={{ color: "var(--color-text-primary)" }}>Deployment progress</h3>
          {batch.stage < 4 && (
            <button onClick={advanceStage} className="text-[12px] fw-bold px-4 py-1.5 rounded-md cursor-pointer" style={{ background: "var(--color-brand-400)", color: "#FFF" }}>
              Advance to {STAGE_LABELS[(batch.stage + 1) as BatchStage]}
            </button>
          )}
        </div>
          <BatchStageStepper currentStage={batch.stage} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KPICard label="Total capital" value={formatCurrency(batch.total_capital || batch.total_principal)} />
        <KPICard label="Investors" value={String(batch.investors_count)} />
        <KPICard label="Duration" value={`${batch.duration_days} days`} />
        <KPICard label="Deployed" value={formatDate(batch.date_deployed)} />
      </div>

      {/* Fund breakdown */}
      {batch.funds && batch.funds.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {batch.funds.map((f) => (
            <div key={f.fund_name} className="card shadow p-4" style={{ background: "var(--color-bg-surface)" }}>
              <p className="text-[11px] font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{f.fund_name}</p>
              <p className="text-lg fw-bold" style={{ fontFamily: "var(--font-mono)" }}>{formatCurrency(f.total_principal)}</p>
              <p className="text-[10px]" style={{ color: "var(--color-text-tertiary)" }}>{f.investors_count} investor{f.investors_count !== 1 ? "s" : ""}</p>
            </div>
          ))}
        </div>
      )}

      {/* Investments table */}
      <div className="card shadow mb-4 overflow-hidden" style={{ background: "var(--color-bg-surface)" }}>
        <div className="d-flex align-items-center justify-content-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <h3 className="text-sm fw-bold mb-0" style={{ color: "var(--color-text-primary)" }}>Investments ({investments.length})</h3>
          <button onClick={() => navigate(ROUTES.BATCH_PERFORMANCE(batchId))} className="btn btn-link p-0 text-decoration-none d-flex align-items-center gap-1" style={{ fontSize: "11px", fontWeight: 500, color: "var(--color-brand-400)" }}>
            Performance <ChevronRight size={12} />
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-dark mb-0" style={{ background: "var(--color-bg-surface)" }}>
            <thead>
              <tr>
                {([
                  { label: "Investor", align: "left" },
                  { label: "Client code", align: "left" },
                  { label: "Fund", align: "left" },
                  { label: "Amount", align: "right" },
                  { label: "Date deposited", align: "left" },
                ] as const).map((h) => (
                  <th key={h.label} style={{ textAlign: h.align as "left" | "right" }}>
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {investments.map((inv: any) => (
                <tr key={inv.id} style={{ cursor: "default" }}>
                  <td>
                    <div className="fw-bold" style={{ fontSize: "13px" }}>{inv.investor_name}</div>
                    <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>{inv.investor_email}</div>
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)", fontSize: "12px", verticalAlign: "middle" }}>{inv.internal_client_code || "—"}</td>
                  <td style={{ color: "var(--color-text-secondary)", fontSize: "12px", verticalAlign: "middle" }}>{inv.fund_name || "—"}</td>
                  <td className="text-end" style={{ fontFamily: "var(--font-mono)", fontSize: "12px", verticalAlign: "middle" }}>{formatCurrency(inv.amount_deposited)}</td>
                  <td style={{ color: "var(--color-text-secondary)", fontSize: "12px", verticalAlign: "middle" }}>{formatDate(inv.date_deposited)}</td>
                </tr>
              ))}
              {investments.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-5 text-sm" style={{ color: "var(--color-text-tertiary)" }}>No investments in this batch yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

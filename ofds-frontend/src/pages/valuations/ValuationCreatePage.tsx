import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createValuationSchema, type CreateValuationFormData } from "@/lib/validators/valuation.schema";
import { valuationService } from "@/services/valuationService";
import { formatCurrency } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import type { CoreFund } from "@/lib/types";
import { toast } from "sonner";
import { ArrowLeft, Eye } from "lucide-react";

export default function ValuationCreatePage() {
  const navigate = useNavigate();
  const [funds, setFunds] = useState<CoreFund[]>([]);
  const [dryRunResult, setDryRunResult] = useState<any>(null);
  const [dryRunning, setDryRunning] = useState(false);

  useEffect(() => {
    valuationService.getActiveFunds().then(setFunds).catch(() => {});
  }, []);

  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<CreateValuationFormData>({
    resolver: zodResolver(createValuationSchema),
  });

  const onSubmit = async (data: CreateValuationFormData) => {
    try {
      await valuationService.createEpoch(data);
      toast.success("Valuation committed successfully");
      navigate(ROUTES.VALUATIONS);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to commit valuation");
    }
  };

  const onDryRun = async () => {
    const vals = getValues();
    if (!vals.fund_id || !vals.start_date || !vals.end_date || vals.performance_rate == null || vals.head_office_total == null) {
      toast.error("Fill all fields before previewing");
      return;
    }
    setDryRunning(true);
    try {
      const res = await valuationService.dryRun(vals);
      setDryRunResult((res as any).data || res);
      toast.success("Dry run complete");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Dry run failed");
    } finally {
      setDryRunning(false);
    }
  };

  const inputStyle = { background: "var(--color-bg-input)", borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" };

  return (
    <div className="container-fluid px-0">
      <button onClick={() => navigate(ROUTES.VALUATIONS)} className="d-flex align-items-center gap-1 mb-3 btn btn-link p-0 text-decoration-none" style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}><ArrowLeft size={14} /> Back to valuations</button>
      <div className="mb-4">
        <h1 className="fw-bold mb-1" style={{ fontSize: "22px", color: "var(--color-text-primary)" }}>New valuation</h1>
        <p className="mb-0" style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>Create an epoch valuation for a core fund</p>
      </div>

      <div className="row g-4">
        {/* Form */}
        <div className="col-lg-6">
          <div className="card shadow h-100">
            <div className="card-body p-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Fund *</label>
              <select {...register("fund_id", { valueAsNumber: true })} className="form-control py-3 border-secondary" style={{ ...inputStyle, borderColor: errors.fund_id ? "var(--color-destructive)" : inputStyle.borderColor }}>
                <option value="">Select fund</option>
                {funds.map((f) => <option key={f.id} value={f.id}>{f.fund_name}</option>)}
              </select>
              {errors.fund_id && <p className="text-xs mt-1" style={{ color: "var(--color-destructive)" }}>{errors.fund_id.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Start date *</label>
                <input type="date" {...register("start_date")} className="form-control py-3 border-secondary" style={{ ...inputStyle, borderColor: errors.start_date ? "var(--color-destructive)" : inputStyle.borderColor }} />
                {errors.start_date && <p className="text-xs mt-1" style={{ color: "var(--color-destructive)" }}>{errors.start_date.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>End date *</label>
                <input type="date" {...register("end_date")} className="form-control py-3 border-secondary" style={{ ...inputStyle, borderColor: errors.end_date ? "var(--color-destructive)" : inputStyle.borderColor }} />
                {errors.end_date && <p className="text-xs mt-1" style={{ color: "var(--color-destructive)" }}>{errors.end_date.message}</p>}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Performance rate (%) *</label>
              <input type="number" step="0.01" {...register("performance_rate", { valueAsNumber: true })} className="form-control py-3 border-secondary" style={{ ...inputStyle, borderColor: errors.performance_rate ? "var(--color-destructive)" : inputStyle.borderColor }} placeholder="5.25" />
              {errors.performance_rate && <p className="text-xs mt-1" style={{ color: "var(--color-destructive)" }}>{errors.performance_rate.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Head office total ($) *</label>
              <input type="number" step="0.01" {...register("head_office_total", { valueAsNumber: true })} className="form-control py-3 border-secondary" style={{ ...inputStyle, borderColor: errors.head_office_total ? "var(--color-destructive)" : inputStyle.borderColor }} placeholder="12345678.90" />
              {errors.head_office_total && <p className="text-xs mt-1" style={{ color: "var(--color-destructive)" }}>{errors.head_office_total.message}</p>}
            </div>
            <div className="d-flex gap-3 pt-3">
              <button type="button" onClick={onDryRun} disabled={dryRunning} className="btn w-50 d-flex align-items-center justify-content-center gap-2 px-3 py-2 fw-bold" style={{ fontSize: "13px", border: "1px solid rgba(255,255,255,0.15)", color: "var(--color-text-secondary)", background: "transparent" }}>
                <Eye size={14} /> {dryRunning ? "Running..." : "Dry run"}
              </button>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary w-50 px-3 py-2 fw-bold" style={{ fontSize: "13px" }}>{isSubmitting ? "Committing..." : "Commit valuation"}</button>
            </div>
          </form>
            </div>
          </div>
        </div>

        {/* Dry run preview */}
        <div className="col-lg-6">
          <div className="card shadow h-100">
            <div className="card-body p-4">
              <h3 className="fw-bold mb-4" style={{ fontSize: "18px", color: "var(--color-text-primary)" }}>Preview</h3>
          {dryRunResult ? (
            <div className="space-y-3">
              {Object.entries(dryRunResult).map(([key, val]) => (
                <div key={key} className="flex justify-between text-[13px]">
                  <span style={{ color: "var(--color-text-secondary)" }}>{key.replace(/_/g, " ")}</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}>
                    {typeof val === "number" ? formatCurrency(val) : String(val)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>Run a dry run to see the calculated preview before committing.</p>
          )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

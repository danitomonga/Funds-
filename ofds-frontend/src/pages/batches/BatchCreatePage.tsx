import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBatchSchema, type CreateBatchFormData } from "@/lib/validators/batch.schema";
import { batchService } from "@/services/batchService";
import { ROUTES } from "@/lib/constants";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, ArrowLeft } from "lucide-react";

export default function BatchCreatePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"manual" | "excel">("manual");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [excelBatchName, setExcelBatchName] = useState("");
  const [createdBatch, setCreatedBatch] = useState<{ id: number; name: string } | null>(null);

  // Manual form
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateBatchFormData>({
    resolver: zodResolver(createBatchSchema),
  });

  const onManualSubmit = async (data: CreateBatchFormData) => {
    try {
      const res = await batchService.create(data);
      const batchId = (res.data as any)?.id;
      
      toast.success("Batch created successfully. Please upload investor file.");
      
      if (batchId) {
        setCreatedBatch({ id: batchId, name: data.batch_name });
        setTab("excel");
      } else {
        navigate(ROUTES.BATCHES);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to create batch";
      toast.error(msg);
    }
  };

  const onExcelUpload = async () => {
    if (!selectedFile) return;
    
    // If a batch is NOT already created, require a name
    if (!createdBatch && !excelBatchName.trim()) {
      toast.error("Please enter a batch name first");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    // Simulate progress (real Axios progress would use onUploadProgress)
    const interval = setInterval(() => setUploadProgress((p) => Math.min(p + 15, 90)), 200);

    try {
      let batchId = createdBatch?.id;

      if (!batchId) {
        // 1. Create batch
        const createRes = await batchService.create({ batch_name: excelBatchName.trim() });
        batchId = (createRes.data as { id?: number })?.id;

        if (!batchId) {
          throw new Error("Failed to receive batch ID from creation");
        }
      }

      // 2. Upload excel
      await batchService.uploadExcel(batchId, selectedFile);

      setUploadProgress(100);
      toast.success("Excel batch uploaded successfully");
      setTimeout(() => navigate(ROUTES.BATCHES), 500);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || (err as Error).message || "Upload failed";
      toast.error(msg);
    } finally {
      clearInterval(interval);
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.xlsx?$/i)) {
      toast.error("Please select an .xlsx or .xls file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB");
      return;
    }
    setSelectedFile(file);
  };

  const inputStyle = {
    background: "var(--color-bg-input)",
    borderColor: "var(--color-border-default)",
    color: "var(--color-text-primary)",
  };

  return (
    <div className="container-fluid px-0">
      {/* Header */}
      <div className="mb-4">
        <button
          onClick={() => navigate(ROUTES.BATCHES)}
          className="d-flex align-items-center gap-1 mb-3 btn btn-link p-0 text-decoration-none"
          style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}
        >
          <ArrowLeft size={14} /> Back to batches
        </button>
        <h1 className="fw-bold mb-1" style={{ fontSize: "22px", color: "var(--color-text-primary)" }}>New batch</h1>
        <p className="mb-0" style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>Create a new investment batch manually or import from Excel</p>
      </div>

      {/* Form card */}
      <div className="card shadow mb-4" style={{ maxWidth: "600px" }}>
        {/* Tabs */}
        <div className="d-flex border-bottom" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          {(["manual", "excel"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-grow-1 py-3 transition-colors text-center"
              style={{
                fontSize: "13px",
                fontWeight: 500,
                background: "transparent",
                border: "none",
                borderBottom: tab === t ? "2px solid var(--color-brand-400)" : "2px solid transparent",
                color: tab === t ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
              }}
            >
              {t === "manual" ? "Manual entry" : "Excel upload"}
            </button>
          ))}
        </div>

        <div className="card-body p-4">
          {tab === "manual" ? (
            <form onSubmit={handleSubmit(onManualSubmit)} className="space-y-5">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Batch name *</label>
                <input {...register("batch_name")} className="form-control py-3 border-secondary" style={{...inputStyle, borderColor: errors.batch_name ? "var(--color-destructive)" : inputStyle.borderColor }} placeholder="Q2-2026 Portfolio" />
                {errors.batch_name && <p className="text-xs mt-1" style={{ color: "var(--color-destructive)" }}>{errors.batch_name.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Certificate number</label>
                <input {...register("certificate_number")} className="form-control py-3 border-secondary" style={inputStyle} placeholder="CERT-Q2-001 (optional)" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Date deployed</label>
                <input type="date" {...register("date_deployed")} className="form-control py-3 border-secondary" style={inputStyle} />
              </div>
              <div className="d-flex gap-3 pt-2">
                <button type="button" onClick={() => navigate(ROUTES.BATCHES)} className="btn w-50 fw-bold px-3 py-2" style={{ border: "1px solid rgba(255,255,255,0.15)", color: "var(--color-text-secondary)", background: "transparent", fontSize: "13px" }}>Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary w-50 fw-bold px-3 py-2" style={{ fontSize: "13px" }}>{isSubmitting ? "Creating..." : "Create batch"}</button>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              {!createdBatch ? (
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Batch name *</label>
                  <input 
                    value={excelBatchName}
                    onChange={(e) => setExcelBatchName(e.target.value)}
                    className="form-control py-3 border-secondary" 
                    style={inputStyle} 
                    placeholder="Q2-2026 Direct Upload" 
                  />
                </div>
              ) : (
                <div className="mb-4 p-3 rounded-lg border flex items-center justify-between" style={{ background: "rgba(255,255,255,0.02)", borderColor: "var(--color-border-subtle)" }}>
                  <div>
                    <span className="text-xs text-gray-400 block mb-1">Uploading investors for batch</span>
                    <span className="text-sm font-semibold">{createdBatch.name}</span>
                  </div>
                </div>
              )}

              {/* Drop zone */}
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors"
                style={{ borderColor: selectedFile ? "var(--color-success)" : "var(--color-border-default)" }}
                onClick={() => fileRef.current?.click()}
              >
                <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileSelect} />
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileSpreadsheet size={32} style={{ color: "var(--color-success)" }} />
                    <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{selectedFile.name}</p>
                    <p className="text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>{(selectedFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload size={32} style={{ color: "var(--color-text-tertiary)" }} />
                    <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Click to select or drag an Excel file</p>
                    <p className="text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>.xlsx or .xls, max 10MB</p>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              {uploading && (
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-border-subtle)" }}>
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%`, background: "var(--color-brand-400)" }} />
                </div>
              )}

              <div className="d-flex gap-3 pt-2">
                <button onClick={() => navigate(ROUTES.BATCHES)} className="btn w-50 fw-bold px-3 py-2" style={{ border: "1px solid rgba(255,255,255,0.15)", color: "var(--color-text-secondary)", background: "transparent", fontSize: "13px" }}>Cancel</button>
                <button onClick={onExcelUpload} disabled={!selectedFile || uploading} className="btn btn-primary w-50 fw-bold px-3 py-2" style={{ fontSize: "13px" }}>{uploading ? "Uploading..." : "Upload"}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

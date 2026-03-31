import { useEffect, useState } from "react";
import { auditService } from "@/services/auditService";
import { formatDate } from "@/lib/utils";
import {} from "@/lib/utils";
import type { AuditLogEntry } from "@/lib/types";
import { Search, ShieldCheck, AlertTriangle } from "lucide-react";

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [search, setSearch] = useState("");
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    setLoading(true);
    auditService.getAll({ action: actionFilter || undefined })
      .then((data) => {
        setLogs(data);
        setUnavailable(false);
      })
      .catch(() => setUnavailable(true))
      .finally(() => setLoading(false));
  }, [actionFilter]);

  const filtered = search
    ? logs.filter((l) =>
        (l.action || "").toLowerCase().includes(search.toLowerCase()) ||
        (l.target_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (l.description || "").toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  const uniqueActions = [...new Set(logs.map((l) => l.action))].sort();

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <ShieldCheck size={24} style={{ color: "var(--color-brand-400)" }} />
        <div>
          <h1 className="fs-4 fw-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>Audit log</h1>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>System-wide activity log — super admin access only</p>
        </div>
      </div>

      {unavailable && (
        <div className="rounded-lg border p-5 mb-4 flex items-center gap-3" style={{ background: "var(--color-warning-bg)", borderColor: "var(--color-warning)" }}>
          <AlertTriangle size={18} style={{ color: "var(--color-warning)" }} />
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--color-warning)" }}>Audit log endpoint not available</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>The backend needs to implement <span style={{ fontFamily: "var(--font-mono)" }}>GET /api/v1/audit-logs</span> with pagination. This UI is ready and will work once the endpoint is deployed.</p>
          </div>
        </div>
      )}

      <div className="card shadow-lg rounded-4 overflow-hidden border-0" style={{ background: "var(--color-bg-surface)", borderColor: "var(--color-border-subtle)" }}>
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "var(--color-border-subtle)" }}>
          <div className="d-flex align-items-center gap-2">
            <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="rounded-md px-3 py-1.5 text-[12px] outline-none border" style={{ background: "var(--color-bg-input)", borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}>
              <option value="">All actions</option>
              {uniqueActions.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-tertiary)" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search logs..." className="rounded-md pl-8 pr-3 py-1.5 text-[12px] outline-none border w-48" style={{ background: "var(--color-bg-input)", borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }} />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "var(--color-border-subtle)", borderTopColor: "var(--color-brand-400)" }} /></div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--color-bg-surface-alt)" }}>
                {["Timestamp", "Action", "Target", "User", "Description", "Status", "IP"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-[11px] fw-bold uppercase tracking-wider border-b" style={{ color: "var(--color-text-secondary)", borderColor: "var(--color-border-subtle)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id} style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                  <td className="px-4 py-2.5 text-[11px] whitespace-nowrap" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-tertiary)" }}>{formatDate(log.timestamp)}</td>
                  <td className="px-4 py-2.5"><span className="text-[10px] fw-bold px-2 py-0.5 rounded" style={{ background: "var(--color-brand-50)", color: "var(--color-brand-300)" }}>{log.action}</span></td>
                  <td className="px-4 py-2.5 text-[12px]">
                    <span style={{ color: "var(--color-text-secondary)" }}>{log.target_type}</span>
                    {log.target_name && <span className="ml-1" style={{ color: "var(--color-text-primary)" }}>{log.target_name}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-[12px]" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-tertiary)" }}>{log.user_id ?? "system"}</td>
                  <td className="px-4 py-2.5 text-[12px] max-w-[200px] truncate" style={{ color: "var(--color-text-secondary)" }}>{log.description || "—"}</td>
                  <td className="px-4 py-2.5"><span className="text-[10px] fw-bold px-2 py-0.5 rounded" style={{ background: log.success ? "var(--color-success-bg)" : "var(--color-destructive-bg)", color: log.success ? "var(--color-success)" : "var(--color-destructive)" }}>{log.success ? "OK" : "FAIL"}</span></td>
                  <td className="px-4 py-2.5 text-[11px]" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-tertiary)" }}>{log.ip_address || "—"}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color: "var(--color-text-tertiary)" }}>{unavailable ? "Waiting for backend endpoint." : "No audit logs found."}</td></tr>}
            </tbody>
          </table>
        )}

        <div className="px-5 py-2.5 border-t text-[11px]" style={{ borderColor: "var(--color-border-subtle)", color: "var(--color-text-tertiary)" }}>{filtered.length} entries</div>
      </div>
    </div>
  );
}

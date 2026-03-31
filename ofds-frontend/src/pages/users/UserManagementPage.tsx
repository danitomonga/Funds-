import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/data/StatusBadge";
import { userService } from "@/services/userService";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/lib/utils";
import type { User } from "@/lib/types";
import { toast } from "sonner";
import { Shield, ShieldCheck } from "lucide-react";

export default function UserManagementPage() {
  const { role: myRole } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setUsers(await userService.getAll()); }
    catch { toast.error("Failed to load users"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const promote = async (userId: number, targetRole: "admin" | "super_admin") => {
    if (!confirm(`Promote user #${userId} to ${targetRole}?`)) return;
    try {
      if (targetRole === "admin") await userService.promoteToAdmin(userId);
      else await userService.promoteToSuperAdmin(userId);
      toast.success(`User promoted to ${targetRole}`);
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Promotion failed");
    }
  };

  const safeUsers = Array.isArray(users) ? users : [];

  return (
    <div className="container-fluid px-0">
      {/* Header */}
      <div className="mb-4">
        <h1 className="fw-bold mb-1" style={{ fontSize: "22px", color: "var(--color-text-primary)" }}>
          Users
        </h1>
        <p className="mb-0" style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
          Manage system users and role assignments
        </p>
      </div>

      {/* Table card */}
      <div className="card shadow">
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
                  {["Name", "Email", "Role", "Status", "Created", ""].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {safeUsers.map((u) => (
                  <tr key={u.id}>
                    <td className="fw-bold" style={{ fontSize: "13px" }}>{u.name}</td>
                    <td style={{ color: "var(--color-text-secondary)", fontSize: "12px" }}>{u.email}</td>
                    <td>
                      <StatusBadge
                        status={u.user_role === "super_admin" ? "Active" : u.user_role === "admin" ? "Info" : "Pending"}
                      />
                      <span className="ms-2" style={{ color: "var(--color-text-tertiary)", fontSize: "11px" }}>
                        {u.user_role}
                      </span>
                    </td>
                    <td>
                      <span
                        className="badge rounded-pill"
                        style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          background: u.active ? "var(--color-success-bg)" : "var(--color-destructive-bg)",
                          color: u.active ? "var(--color-success)" : "var(--color-destructive)",
                        }}
                      >
                        {u.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ color: "var(--color-text-tertiary)", fontSize: "12px" }}>{formatDate(u.date_created)}</td>
                    <td>
                      {(myRole === "admin" || myRole === "super_admin") && u.user_role === "user" && (
                        <button
                          onClick={() => promote(u.id, "admin")}
                          className="btn btn-sm d-inline-flex align-items-center gap-1"
                          style={{
                            fontSize: "11px",
                            background: "var(--color-brand-50)",
                            color: "var(--color-brand-300)",
                            border: "none",
                            borderRadius: "6px",
                          }}
                        >
                          <Shield size={10} /> Make admin
                        </button>
                      )}
                      {myRole === "super_admin" && u.user_role === "admin" && (
                        <button
                          onClick={() => promote(u.id, "super_admin")}
                          className="btn btn-sm d-inline-flex align-items-center gap-1"
                          style={{
                            fontSize: "11px",
                            background: "var(--color-warning-bg)",
                            color: "var(--color-warning)",
                            border: "none",
                            borderRadius: "6px",
                          }}
                        >
                          <ShieldCheck size={10} /> Make super
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {safeUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-5" style={{ color: "var(--color-text-tertiary)" }}>
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div
          className="px-4 py-2"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "11px", color: "var(--color-text-tertiary)" }}
        >
          {safeUsers.length} user{safeUsers.length !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}

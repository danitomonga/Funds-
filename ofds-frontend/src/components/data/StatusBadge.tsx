import { cn } from "@/lib/utils";

type BadgeVariant = "active" | "pending" | "closed" | "info" | "error" | "approved" | "rejected";

const variantClass: Record<BadgeVariant, string> = {
  active:   "badge-active",
  approved: "badge-active",
  pending:  "badge-pending",
  closed:   "badge-closed",
  error:    "badge-closed",
  rejected: "badge-closed",
  info:     "badge-info",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const key = status.toLowerCase() as BadgeVariant;
  const cls = variantClass[key] ?? "badge-info";

  return (
    <span
      className={cn(
        "badge rounded-pill px-3 py-1 fw-bold text-uppercase",
        cls,
        className
      )}
      style={{ fontSize: "10px", letterSpacing: "0.04em" }}
    >
      {status}
    </span>
  );
}

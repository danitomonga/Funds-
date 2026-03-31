interface ChartCardProps {
  title: string;
  subtitle?: string;
  legend?: { label: string; color: string }[];
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function ChartCard({ title, subtitle, legend, children, actions }: ChartCardProps) {
  return (
    <div className="card shadow h-100">
      <div className="card-body d-flex flex-column" style={{ padding: "1.25rem" }}>
        {/* Header */}
        <div className="d-flex align-items-start justify-content-between mb-2">
          <div>
            <h3
              className="fw-bold mb-0"
              style={{ color: "var(--color-text-primary)", fontSize: "14px" }}
            >
              {title}
            </h3>
            {subtitle && (
              <p className="mb-0 mt-1" style={{ color: "var(--color-text-tertiary)", fontSize: "12px" }}>
                {subtitle}
              </p>
            )}
          </div>
          {actions}
        </div>

        {/* Chart */}
        <div className="flex-grow-1 mt-3">{children}</div>

        {/* Legend */}
        {legend && legend.length > 0 && (
          <div className="d-flex flex-wrap gap-3 mt-3">
            {legend.map((item) => (
              <span
                key={item.label}
                className="d-flex align-items-center gap-2"
                style={{ color: "var(--color-text-secondary)", fontSize: "11px" }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "2px",
                    background: item.color,
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
                {item.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

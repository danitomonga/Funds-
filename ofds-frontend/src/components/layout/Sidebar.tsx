import { NavLink } from "react-router-dom";
import { ROUTES } from "@/lib/constants";
import { RoleGate } from "./RoleGate";
import { useUI } from "@/context/UIContext";
import {
  LayoutDashboard,
  Layers,
  Landmark,
  TrendingUp,
  FileBarChart,
  ArrowDownUp,
  Users,
  ShieldCheck,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const mainNav: NavItem[] = [
  { label: "Overview",    path: ROUTES.OVERVIEW,    icon: <LayoutDashboard size={17} /> },
  { label: "Batches",     path: ROUTES.BATCHES,     icon: <Layers size={17} /> },
  { label: "Funds",       path: ROUTES.FUNDS,       icon: <Landmark size={17} /> },
  { label: "Valuations",  path: ROUTES.VALUATIONS,  icon: <TrendingUp size={17} /> },
  { label: "Reports",     path: ROUTES.REPORTS,     icon: <FileBarChart size={17} /> },
  { label: "Withdrawals", path: ROUTES.WITHDRAWALS, icon: <ArrowDownUp size={17} /> },
  { label: "Users",       path: ROUTES.USERS,       icon: <Users size={17} /> },
];

const superAdminNav: NavItem[] = [
  { label: "Audit Log", path: ROUTES.AUDIT_LOG, icon: <ShieldCheck size={17} /> },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUI();
  const w = sidebarCollapsed ? "var(--sidebar-collapsed)" : "var(--sidebar-width)";

  return (
    <aside
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        width: w,
        background: "var(--color-bg-surface)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s ease",
        zIndex: 30,
        overflowX: "hidden",
      }}
    >
      {/* Logo */}
      <div
        style={{
          height: "var(--topbar-height)",
          display: "flex",
          alignItems: "center",
          padding: sidebarCollapsed ? "0 1rem" : "0 1.25rem",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
          justifyContent: sidebarCollapsed ? "center" : "flex-start",
        }}
      >
        <span style={{ color: "var(--color-brand-400)", fontWeight: 800, fontSize: "1rem", letterSpacing: "0.06em" }}>
          {sidebarCollapsed ? "O" : "OFDS"}
        </span>
      </div>

      {/* Main nav */}
      <nav className="sidebar-nav flex-grow-1 py-2 px-2" style={{ overflowY: "auto" }}>
        <ul className="nav flex-column mb-0">
          {mainNav.map((item) => (
            <li className="nav-item" key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <span style={{ flexShrink: 0 }}>{item.icon}</span>
                {!sidebarCollapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Divider */}
        <hr style={{ borderColor: "rgba(255,255,255,0.07)", margin: "0.75rem 0.5rem" }} />

        {/* Super Admin */}
        <RoleGate allowedRoles={["super_admin"]}>
          {!sidebarCollapsed && (
            <p
              className="mb-2 px-3"
              style={{ color: "var(--color-text-tertiary)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}
            >
              Super Admin
            </p>
          )}
          <ul className="nav flex-column mb-0">
            {superAdminNav.map((item) => (
              <li className="nav-item" key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <span style={{ flexShrink: 0 }}>{item.icon}</span>
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </RoleGate>
      </nav>

      {/* Bottom: Settings + Collapse */}
      <div
        className="sidebar-nav py-2 px-2"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}
      >
        <ul className="nav flex-column mb-0">
          <li className="nav-item">
            <NavLink
              to={ROUTES.SETTINGS}
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
              title={sidebarCollapsed ? "Settings" : undefined}
            >
              <Settings size={17} />
              {!sidebarCollapsed && <span>Settings</span>}
            </NavLink>
          </li>
        </ul>

        <button
          onClick={toggleSidebar}
          className="nav-link w-100 mt-1"
          style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
          title={sidebarCollapsed ? "Expand" : "Collapse"}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={17} /> : (
            <>
              <PanelLeftClose size={17} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

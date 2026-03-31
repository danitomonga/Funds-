import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useUI } from "@/context/UIContext";

/**
 * AppShell wraps all authenticated pages.
 * Provides: fixed sidebar + fixed topbar + scrollable main content.
 */
export function AppShell() {
  const { sidebarCollapsed } = useUI();

  const sidebarWidth = sidebarCollapsed ? "var(--sidebar-collapsed)" : "var(--sidebar-width)";

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg-base)" }}>
      {/* Sidebar (fixed left) */}
      <Sidebar />

      {/* Main area (offset by sidebar width) */}
      <div
        className="d-flex flex-column min-vh-100"
        style={{
          marginLeft: sidebarWidth,
          minHeight: "100vh",
          transition: "margin-left 0.2s ease",
          background: "var(--color-bg-base)",
          border: "none",
        }}
      >
        {/* Topbar */}
        <Topbar />

        <main className="flex-grow-1 p-5 overflow-y-auto" style={{ background: "var(--color-bg-base)", border: "none" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

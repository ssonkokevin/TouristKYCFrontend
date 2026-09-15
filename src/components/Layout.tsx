import { useState, useEffect, type ReactNode } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  BarChart3,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/NotificationBell";
import { DashboardWatermark } from "@/components/DashboardWatermark";

function navClass({ isActive }: { isActive: boolean }) {
  return `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition duration-150 ${
    isActive
      ? "bg-kyc-brand text-white shadow-sm"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:translate-x-0.5"
  }`;
}

function subNavClass({ isActive }: { isActive: boolean }) {
  return `flex items-center rounded-lg px-3 py-1.5 pl-9 text-sm transition duration-150 ${
    isActive
      ? "bg-kyc-brand-tint text-kyc-brand font-medium"
      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 hover:translate-x-0.5"
  }`;
}

// Shared collapse/expand for submenus: height + opacity + a tiny upward slide,
// so sublists ease in/out instead of popping instantly.
function Submenu({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0, y: -4 }}
          animate={{ height: "auto", opacity: 1, y: 0 }}
          exit={{ height: 0, opacity: 0, y: -4 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="overflow-hidden"
        >
          <div className="space-y-0.5 pt-0.5">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SectionLabel({ children, collapsed }: { children: ReactNode; collapsed: boolean }) {
  if (collapsed) return <div className="my-2 border-t border-kyc-border" />;
  return (
    <div className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-kyc-text-secondary">
      {children}
    </div>
  );
}

function NavTooltip({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (!collapsed) return null;
  return (
    <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
      {label}
    </span>
  );
}

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [subscribersOpen, setSubscribersOpen] = useState(location.pathname.startsWith("/subscribers"));
  const [simCardsOpen, setSimCardsOpen] = useState(
    location.pathname.startsWith("/sim-inventory") || location.pathname.startsWith("/msisdn-pool")
  );
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("kyc-sidebar-collapsed") === "1");

  useEffect(() => {
    localStorage.setItem("kyc-sidebar-collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  const expandAnd = (fn: () => void) => () => {
    if (collapsed) setCollapsed(false);
    fn();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-kyc-bg">
      <DashboardWatermark />
      {/* Sidebar */}
      <aside
        className={`relative z-10 flex flex-col overflow-hidden border-r border-kyc-border bg-white transition-[width] duration-300 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        <div className="flex flex-shrink-0 items-center gap-2.5 px-5 py-4 border-b border-kyc-border">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-kyc-brand text-white">
            <ShieldCheck className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="min-w-0 overflow-hidden whitespace-nowrap">
              <div className="text-sm font-bold text-slate-900 leading-tight">SIM KYC</div>
              <div className="text-xs text-slate-400 leading-tight">Tourist Registration</div>
            </div>
          )}
        </div>

        <div className="flex flex-shrink-0 items-center justify-end border-b border-kyc-border px-2 py-1.5">
          <button
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-kyc-text-secondary transition-colors hover:bg-kyc-brand-tint hover:text-kyc-brand"
          >
            <ChevronLeft className={`h-3.5 w-3.5 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        <nav className="flex-1 min-h-0 space-y-0.5 overflow-y-auto p-3">
          <NavLink to="/" end className={(p) => navClass(p) + " group relative"}>
            {({ isActive }) => (
              <>
                <LayoutDashboard
                  className={`h-4 w-4 flex-shrink-0 transition-transform duration-150 ${isActive ? "scale-105" : ""}`}
                />
                {!collapsed && (
                  <>
                    Dashboard
                    <ChevronRight className="ml-auto h-3.5 w-3.5 flex-shrink-0" />
                  </>
                )}
                <NavTooltip label="Dashboard" collapsed={collapsed} />
              </>
            )}
          </NavLink>

          <SectionLabel collapsed={collapsed}>Registration</SectionLabel>

          <button
            onClick={expandAnd(() => setSubscribersOpen((o) => !o))}
            className="group relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:translate-x-0.5 transition duration-150"
          >
            <Users className="h-4 w-4 flex-shrink-0" />
            {!collapsed && (
              <>
                Subscribers
                <ChevronDown
                  className={`ml-auto h-3.5 w-3.5 transition-transform duration-200 ${subscribersOpen ? "rotate-180" : ""}`}
                />
              </>
            )}
            <NavTooltip label="Subscribers" collapsed={collapsed} />
          </button>
          <Submenu open={subscribersOpen && !collapsed}>
            <NavLink to="/subscribers" end className={subNavClass}>
              All Subscribers
            </NavLink>
            <NavLink to="/subscribers/passport-history" className={subNavClass}>
              Passport History
            </NavLink>
            <NavLink to="/subscribers/suspensions" className={subNavClass}>
              Suspensions
            </NavLink>
            <NavLink to="/subscribers/deregistrations" className={subNavClass}>
              Deregistrations
            </NavLink>
          </Submenu>

          <SectionLabel collapsed={collapsed}>SIM Management</SectionLabel>

          <button
            onClick={expandAnd(() => setSimCardsOpen((o) => !o))}
            className="group relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:translate-x-0.5 transition duration-150"
          >
            <Smartphone className="h-4 w-4 flex-shrink-0" />
            {!collapsed && (
              <>
                SIM Cards
                <ChevronDown
                  className={`ml-auto h-3.5 w-3.5 transition-transform duration-200 ${simCardsOpen ? "rotate-180" : ""}`}
                />
              </>
            )}
            <NavTooltip label="SIM Cards" collapsed={collapsed} />
          </button>
          <Submenu open={simCardsOpen && !collapsed}>
            <NavLink to="/sim-inventory" className={subNavClass}>
              SIM Inventory
              <ChevronRight className="ml-auto h-3.5 w-3.5 flex-shrink-0 opacity-50" />
            </NavLink>
            <NavLink to="/msisdn-pool" className={subNavClass}>
              MSISDN Pool
              <ChevronRight className="ml-auto h-3.5 w-3.5 flex-shrink-0 opacity-50" />
            </NavLink>
          </Submenu>

          <SectionLabel collapsed={collapsed}>Analytics</SectionLabel>

          <NavLink to="/reports" className={(p) => navClass(p) + " group relative"}>
            {({ isActive }) => (
              <>
                <BarChart3
                  className={`h-4 w-4 flex-shrink-0 transition-transform duration-150 ${isActive ? "scale-105" : ""}`}
                />
                {!collapsed && (
                  <>
                    Reports
                    <ChevronRight className="ml-auto h-3.5 w-3.5 flex-shrink-0" />
                  </>
                )}
                <NavTooltip label="Reports" collapsed={collapsed} />
              </>
            )}
          </NavLink>
        </nav>

        <div className="border-t border-kyc-border p-3">
          <div className="group relative flex items-center gap-2.5 rounded-lg px-2 py-2">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-kyc-brand-tint text-kyc-brand text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() ?? "A"}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-slate-900">{user?.name}</div>
                <div className="truncate text-xs text-slate-400">{user?.role}</div>
              </div>
            )}
            <button
              onClick={logout}
              className={`rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors ${collapsed ? "absolute inset-0 h-full w-full opacity-0" : ""}`}
              title="Logout"
            >
              {!collapsed && <LogOut className="h-3.5 w-3.5" />}
            </button>
            <NavTooltip label={`${user?.name ?? "Account"} — Logout`} collapsed={collapsed} />
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-end gap-3 border-b border-kyc-border bg-white px-6 py-3">
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-auto">
          <div className="w-full px-6 pt-5 pb-7 space-y-5">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

import { useState, type ReactNode } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ChevronDown,
  Smartphone,
  BarChart3,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/NotificationBell";

function navClass({ isActive }: { isActive: boolean }) {
  return `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-kyc-brand-tint text-kyc-brand" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  }`;
}

function subNavClass({ isActive }: { isActive: boolean }) {
  return `block rounded-lg px-3 py-1.5 pl-9 text-sm transition-colors ${
    isActive ? "bg-kyc-brand-tint text-kyc-brand font-medium" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
  }`;
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-kyc-text-secondary bg-kyc-bg">
      {children}
    </div>
  );
}

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [subscribersOpen, setSubscribersOpen] = useState(location.pathname.startsWith("/subscribers"));
  const [simCardsOpen, setSimCardsOpen] = useState(
    location.pathname.startsWith("/sim-inventory") || location.pathname.startsWith("/msisdn-pool")
  );

  return (
    <div className="flex h-screen overflow-hidden bg-kyc-bg">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-kyc-border bg-white">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-kyc-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-kyc-brand text-white">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 leading-tight">SIM KYC</div>
            <div className="text-xs text-slate-400 leading-tight">Tourist Registration</div>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          <NavLink to="/" end className={navClass}>
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </NavLink>

          <SectionLabel>Records</SectionLabel>

          <button
            onClick={() => setSubscribersOpen((o) => !o)}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <Users className="h-4 w-4" />
            Subscribers
            <ChevronDown className={`ml-auto h-3.5 w-3.5 transition-transform ${subscribersOpen ? "rotate-180" : ""}`} />
          </button>
          {subscribersOpen && (
            <div className="space-y-0.5">
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
            </div>
          )}

          <button
            onClick={() => setSimCardsOpen((o) => !o)}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <Smartphone className="h-4 w-4" />
            SIM Cards
            <ChevronDown className={`ml-auto h-3.5 w-3.5 transition-transform ${simCardsOpen ? "rotate-180" : ""}`} />
          </button>
          {simCardsOpen && (
            <div className="space-y-0.5">
              <NavLink to="/sim-inventory" className={subNavClass}>
                SIM Inventory
              </NavLink>
              <NavLink to="/msisdn-pool" className={subNavClass}>
                MSISDN Pool
              </NavLink>
            </div>
          )}

          <SectionLabel>System</SectionLabel>

          <NavLink to="/reports" className={navClass}>
            <BarChart3 className="h-4 w-4" />
            Reports
          </NavLink>
        </nav>

        <div className="border-t border-kyc-border p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-kyc-brand-tint text-kyc-brand text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() ?? "A"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-slate-900">{user?.name}</div>
              <div className="truncate text-xs text-slate-400">{user?.role}</div>
            </div>
            <button
              onClick={logout}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              title="Logout"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-end gap-3 border-b border-kyc-border bg-white px-6 py-3">
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

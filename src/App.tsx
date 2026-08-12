import type { ReactNode } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "@/pages/Login";
import { Layout } from "@/components/Layout";
import { DashboardPage } from "@/pages/Dashboard";
import { AllSubscribersPage } from "@/pages/subscribers/AllSubscribers";
import { PassportHistoryPage } from "@/pages/subscribers/PassportHistory";
import { SuspensionsPage } from "@/pages/subscribers/Suspensions";
import { DeregistrationsPage } from "@/pages/subscribers/Deregistrations";
import { SubscriberProfilePage } from "@/pages/subscriber-profile/SubscriberProfile";
import { SimInventoryPage } from "@/pages/SimInventory";
import { MsisdnPoolPage } from "@/pages/MsisdnPool";
import { ReportsPage } from "@/pages/Reports";
import { useAuth, isTokenValid } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/toaster";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  return token && isTokenValid(token) ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="subscribers" element={<AllSubscribersPage />} />
          <Route path="subscribers/passport-history" element={<PassportHistoryPage />} />
          <Route path="subscribers/suspensions" element={<SuspensionsPage />} />
          <Route path="subscribers/deregistrations" element={<DeregistrationsPage />} />
          <Route path="subscribers/:id" element={<SubscriberProfilePage />} />
          <Route path="sim-inventory" element={<SimInventoryPage />} />
          <Route path="msisdn-pool" element={<MsisdnPoolPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}

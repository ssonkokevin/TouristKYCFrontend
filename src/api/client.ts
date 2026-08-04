const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function login(email: string, password: string) {
  return request<{ token: string; user: any }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function loginWithGoogle(idToken: string) {
  return request<{ token: string; user: any }>("/auth/google", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });
}

export async function getMe() {
  return request<{ id: string; email: string; name: string; role: string }>("/auth/me");
}

export async function listSubscribers(params?: Record<string, string>) {
  const query = params ? new URLSearchParams(params).toString() : "";
  return request<{ data: any[]; meta: any }>(`/subscribers?${query}`);
}

export async function listSimInventory(params?: Record<string, string>) {
  const query = params ? new URLSearchParams(params).toString() : "";
  return request<{ data: any[]; meta: any }>(`/sim-inventory?${query}`);
}

export async function listMsisdnPool(params?: Record<string, string>) {
  const query = params ? new URLSearchParams(params).toString() : "";
  return request<{ data: any[]; meta: any }>(`/msisdn-pool?${query}`);
}

export async function getSubscriber(id: string) {
  return request<any>(`/subscribers/${id}`);
}

export async function updateSubscriber(id: string, data: any) {
  return request<any>(`/subscribers/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function suspendSubscriber(id: string, reason: string, reason_note?: string) {
  return request<any>(`/subscribers/${id}/suspend`, {
    method: "POST",
    body: JSON.stringify({ reason, reason_note }),
  });
}

export async function deregisterSubscriber(id: string, reason: string, reason_note?: string) {
  return request<any>(`/subscribers/${id}/deregister`, {
    method: "POST",
    body: JSON.stringify({ reason, reason_note }),
  });
}

export async function listSuspensions(params?: Record<string, string>) {
  const query = params ? new URLSearchParams(params).toString() : "";
  return request<{ data: any[]; total: number; page: number; limit: number }>(`/suspensions?${query}`);
}

export async function reactivateSubscriber(id: string) {
  return request<any>(`/suspensions/${id}/reactivate`, { method: "POST" });
}

export async function listDeregistrations(params?: Record<string, string>) {
  const query = params ? new URLSearchParams(params).toString() : "";
  return request<{ data: any[]; total: number; page: number; limit: number }>(`/deregistrations?${query}`);
}

export async function getPassportHistory(passportNumber: string) {
  return request<any>(`/passport-history/${encodeURIComponent(passportNumber)}`);
}

export async function listNotifications(params?: Record<string, string>) {
  const query = params ? new URLSearchParams(params).toString() : "";
  return request<{ data: any[] }>(`/notifications?${query}`);
}

export async function markNotificationRead(id: string) {
  return request<any>(`/notifications/${id}/read`, { method: "PATCH" });
}

export async function uploadDocument(subscriberId: string, type: string, file: File) {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/documents/subscribers/${subscriberId}/${type}`, {
    method: "POST",
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function deleteDocument(subscriberId: string, type: string) {
  return request<any>(`/documents/subscribers/${subscriberId}/${type}`, { method: "DELETE" });
}

export async function getReportByVisaType(from?: string, to?: string) {
  const query = new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) }).toString();
  return request<any[]>(`/reports/by-visa-type?${query}`);
}

export async function getReportByPurpose(from?: string, to?: string) {
  const query = new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) }).toString();
  return request<any[]>(`/reports/by-purpose-of-visit?${query}`);
}

export async function getReportByNationality(from?: string, to?: string) {
  const query = new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) }).toString();
  return request<any[]>(`/reports/by-nationality?${query}`);
}

export async function getNationalityDistribution() {
  return request<any[]>(`/distributions/nationality`);
}

export async function getPurposeDistribution() {
  return request<any[]>(`/distributions/purpose`);
}

export async function getStatusDistribution() {
  return request<any[]>(`/distributions/status`);
}

export async function getVisaExpiryAlerts(range: "7d" | "1m" | "6m" | "1y") {
  return request<{ range: string; data: { label: string; expiring: number; active: number }[] }>(
    `/alerts/visa-expiry?range=${range}`
  );
}

export async function getRegistrationTrend(days: number) {
  return request<{ label: string; count: number }[]>(`/alerts/trends/registrations?days=${days}`);
}

export async function getMetrics() {
  return request<{
    total_tourists: number;
    active_sims: number;
    suspended: number;
    deregistered: number;
    sim_stock_available: number;
    sim_stock_assigned: number;
  }>(`/metrics`);
}

export async function logFrontendError(
  message: string,
  context?: Record<string, unknown>
): Promise<void> {
  try {
    await fetch(`${API_BASE}/logs/frontend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level: "error", message, context }),
    });
  } catch {
    // silently ignore — logging should not break the app
  }
}

const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

// Log the resolved API base once on load so misconfigured VITE_API_URL is
// immediately visible in the browser console.
// eslint-disable-next-line no-console
console.info("[api] API_BASE resolved to:", API_BASE);

let requestSeq = 0;

async function reportToBackend(entry: Record<string, unknown>) {
  try {
    await fetch(`${API_BASE}/logs/frontend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
  } catch {
    // Backend itself may be unreachable (the exact failure we're trying to
    // trace) — never let logging throw or block the caller.
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const id = ++requestSeq;
  const method = options.method || "GET";
  const url = `${API_BASE}${path}`;
  const startedAt = performance.now();

  // eslint-disable-next-line no-console
  console.groupCollapsed(`[api #${id}] ${method} ${url}`);
  // eslint-disable-next-line no-console
  console.log("request", { method, url, body: options.body });

  const token = localStorage.getItem("token");
  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch (err: any) {
    const durationMs = Math.round(performance.now() - startedAt);
    // A thrown TypeError here (e.g. "Failed to fetch") means the request
    // never reached the server — CORS, DNS, SSL, or network connectivity
    // issue, as opposed to an HTTP error response (handled below).
    // eslint-disable-next-line no-console
    console.error("network error", { name: err?.name, message: err?.message, durationMs, apiBase: API_BASE });
    console.groupEnd();
    reportToBackend({
      level: "error",
      message: `API ${method} ${path} network error: ${err?.message || err}`,
      context: { url, errorName: err?.name, durationMs, apiBase: API_BASE },
    });
    throw err;
  }

  const durationMs = Math.round(performance.now() - startedAt);

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Request failed" }));
    // eslint-disable-next-line no-console
    console.error("response error", { status: res.status, durationMs, body });
    console.groupEnd();
    reportToBackend({
      level: res.status >= 500 ? "error" : "warn",
      message: `API ${method} ${path} failed with HTTP ${res.status}`,
      context: { url, status: res.status, durationMs, body },
    });
    if (res.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
      throw new Error("Session expired. Please log in again.");
    }
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  const data = (await res.json()) as T;
  // eslint-disable-next-line no-console
  console.log("response ok", { status: res.status, durationMs });
  console.groupEnd();
  reportToBackend({
    level: "info",
    message: `API ${method} ${path} succeeded with HTTP ${res.status}`,
    context: { url, status: res.status, durationMs },
  });
  return data;
}

export async function login(identifier: string, password: string) {
  return request<{ token: string; user: any }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password }),
  });
}

// Google Sign-In is disabled on the backend (plain-HTTP, no-domain
// deployment can't satisfy Google's HTTPS-origin requirement). Kept as a
// commented reference rather than deleted in case it's reintroduced later
// alongside TLS.
// export async function loginWithGoogle(idToken: string) {
//   return request<{ token: string; user: any }>("/auth/google", {
//     method: "POST",
//     body: JSON.stringify({ idToken }),
//   });
// }

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
  const url = `${API_BASE}/documents/subscribers/${subscriberId}/${type}`;
  const startedAt = performance.now();
  // eslint-disable-next-line no-console
  console.groupCollapsed(`[api] POST ${url}`);
  // eslint-disable-next-line no-console
  console.log("request", { fileName: file.name, fileSize: file.size, mimeType: file.type });

  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("file", file);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData,
    });
  } catch (err: any) {
    const durationMs = Math.round(performance.now() - startedAt);
    // eslint-disable-next-line no-console
    console.error("network error", { name: err?.name, message: err?.message, durationMs, apiBase: API_BASE });
    console.groupEnd();
    reportToBackend({
      level: "error",
      message: `Upload document network error: ${err?.message || err}`,
      context: { url, errorName: err?.name, durationMs, apiBase: API_BASE },
    });
    throw err;
  }

  const durationMs = Math.round(performance.now() - startedAt);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Upload failed" }));
    // eslint-disable-next-line no-console
    console.error("response error", { status: res.status, durationMs, body });
    console.groupEnd();
    reportToBackend({
      level: "error",
      message: `Upload document failed with HTTP ${res.status}`,
      context: { url, status: res.status, durationMs, body },
    });
    if (res.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
      throw new Error("Session expired. Please log in again.");
    }
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  const data = await res.json();
  // eslint-disable-next-line no-console
  console.log("response ok", { status: res.status, durationMs });
  console.groupEnd();
  return data;
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

export async function getNationalityDistribution(from?: string, to?: string) {
  const query = new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) }).toString();
  return request<any[]>(`/distributions/nationality${query ? `?${query}` : ""}`);
}

export async function getPurposeDistribution() {
  return request<any[]>(`/distributions/purpose`);
}

export async function getSimProvisioningTrend(from?: string, to?: string) {
  const query = new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) }).toString();
  return request<{ label: string; count: number }[]>(`/reports/sim-provisioning-trend${query ? `?${query}` : ""}`);
}

/** Streams the Registrations CSV export from the backend and triggers a
 * browser download — not routed through the generic JSON `request()` helper
 * since the response body is CSV text, not JSON. */
export async function exportRegistrationsCsv(registeredFrom?: string, registeredTo?: string) {
  const query = new URLSearchParams({
    ...(registeredFrom ? { registered_from: registeredFrom } : {}),
    ...(registeredTo ? { registered_to: registeredTo } : {}),
  }).toString();
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/reports/registrations/export${query ? `?${query}` : ""}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Export failed" }));
    throw new Error(body.error || `Export failed (HTTP ${res.status})`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "registrations_export.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export async function getStatusDistribution(from?: string, to?: string) {
  const query = new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) }).toString();
  return request<any[]>(`/distributions/status${query ? `?${query}` : ""}`);
}

export async function getVisaExpiryAlerts(range: "7d" | "1m" | "6m" | "1y") {
  return request<{ range: string; data: { label: string; expiring: number; active: number }[] }>(
    `/alerts/visa-expiry?range=${range}`
  );
}

export async function getRegistrationTrend(opts: number | { from: string; to: string }) {
  const query = typeof opts === "number" ? `days=${opts}` : `from=${opts.from}&to=${opts.to}`;
  return request<{ label: string; count: number }[]>(`/alerts/trends/registrations?${query}`);
}

export async function getSimInventorySummary() {
  return request<{ status: { status: string; _count: { status: number } }[]; type: { type: string; _count: { type: number } }[] }>(
    `/sim-inventory/summary`
  );
}

export async function getMsisdnPoolSummary() {
  return request<{ status: { status: string; _count: { status: number } }[] }>(`/msisdn-pool/summary`);
}

export async function getMetrics() {
  return request<{
    total_tourists: number;
    active_sims: number;
    suspended: number;
    deregistered: number;
    sim_stock_available: number;
    sim_stock_assigned: number;
    expiring_soon: number;
    visa_expired_active: number;
  }>(`/metrics`);
}

export async function logFrontendError(
  message: string,
  context?: Record<string, unknown>
): Promise<void> {
  // eslint-disable-next-line no-console
  console.error("[app]", message, context);
  await reportToBackend({ level: "error", message, context });
}

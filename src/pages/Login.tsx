import { useState, FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Mail, Lock, Eye, EyeOff, AlertCircle, FileCheck2, Smartphone, BellRing } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { login } from "@/api/client";

const FEATURE_CHIPS = [
  { icon: <FileCheck2 className="h-4 w-4" />, label: "Passport & Visa Verification" },
  { icon: <Smartphone className="h-4 w-4" />, label: "SIM Card Registration" },
  { icon: <BellRing className="h-4 w-4" />, label: "Visa Expiry Monitoring" },
];

export function LoginPage() {
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier || !password) {
      setError("Email/username and password are required.");
      return;
    }
    setIsLoading(true);
    try {
      const { token, user } = await login(identifier, password);
      setAuth(token, user);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Invalid email/username or password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-kyc-bg">
      {/* Left panel — sign-in form */}
      <div className="relative flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="console-grid-bg absolute inset-0" aria-hidden="true" />
        <div className="relative z-10 w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-kyc-brand text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold leading-tight text-kyc-text-primary">SIM KYC</div>
              <div className="text-xs leading-tight text-kyc-text-secondary">Tourist Registration</div>
            </div>
          </div>

          <div className="rounded-card bg-kyc-surface p-8 shadow-card">
            <h1 className="text-xl font-semibold text-kyc-text-primary">Welcome back</h1>
            <p className="mt-1 text-sm text-kyc-text-secondary">
              Sign in to access the KYC and SIM registration system
            </p>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-kyc-danger-tint px-3 py-2.5 text-sm text-kyc-danger">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="identifier" className="mb-1.5 block text-sm font-medium text-kyc-text-primary">
                  Email or Username
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-kyc-text-secondary" />
                  <input
                    id="identifier"
                    type="text"
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full rounded-lg border border-kyc-border bg-white py-2 pl-9 pr-3 text-sm text-kyc-text-primary placeholder:text-slate-400 focus:border-kyc-brand focus:outline-none focus:ring-2 focus:ring-kyc-brand/20"
                    placeholder="admin@hamiltel.ug"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-kyc-text-primary">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-kyc-text-secondary" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-kyc-border bg-white py-2 pl-9 pr-10 text-sm text-kyc-text-primary placeholder:text-slate-400 focus:border-kyc-brand focus:outline-none focus:ring-2 focus:ring-kyc-brand/20"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-kyc-text-secondary hover:text-kyc-text-primary"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-kyc-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-kyc-brand/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}
                {isLoading ? "Signing you in…" : "Sign In"}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-kyc-text-secondary">
            Accounts are provisioned internally by your system administrator — there is no self-service
            registration. Having trouble signing in? Contact your system administrator.
          </p>
        </div>
      </div>

      {/* Right panel — visual */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-kyc-brand via-emerald-700 to-slate-900 lg:flex lg:items-center lg:justify-center">
        <div className="console-grid-bg-light absolute inset-0" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="relative z-10 flex flex-col gap-4 px-12">
          {FEATURE_CHIPS.map((chip, idx) => (
            <FeatureChip key={chip.label} icon={chip.icon} label={chip.label} delay={idx * 150} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FeatureChip({ icon, label, delay }: { icon: ReactNode; label: string; delay: number }) {
  return (
    <div
      className="glass-chip animate-fade-in-up flex items-center gap-3 rounded-card px-4 py-3 text-sm font-medium text-white"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/15">{icon}</span>
      {label}
    </div>
  );
}

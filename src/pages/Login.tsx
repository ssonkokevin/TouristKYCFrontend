import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { login } from "@/api/client";
import { useToast } from "@/components/ui/use-toast";

export function LoginPage() {
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast({ title: "Login failed", description: "Username and password are required", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      console.log("[login] submitting credentials to /auth/login");
      const { token, user } = await login(identifier, password);
      console.log("[login] backend login succeeded", { userId: user?.id, email: user?.email });
      setAuth(token, user);
      navigate("/");
    } catch (err: any) {
      console.error("[login] backend login failed", { name: err?.name, message: err?.message });
      toast({
        title: "Login failed",
        description: err.message || "Invalid username or password.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-bold shadow-md">
            T
          </div>
          <h1 className="text-2xl font-bold text-slate-900">TouristKYC UG</h1>
          <p className="mt-1 text-sm text-slate-500">Tourist KYC &amp; SIM Registration Portal</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-semibold text-slate-900">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-500">Sign in to access the KYC and SIM registration system</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="identifier" className="mb-1.5 block text-sm font-medium text-slate-700">
                Username
              </label>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="admin@hamiltel.ug"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Signing you in…" : "Sign In"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Access policy</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="space-y-3 rounded-lg bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500" />
              <p className="text-sm text-slate-600">
                Accounts are provisioned internally by your system administrator — there is no self-service
                registration.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Having trouble signing in? Contact your system administrator.
        </p>
      </div>
    </div>
  );
}

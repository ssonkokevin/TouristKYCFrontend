import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Zap,
  Headset,
  Wifi,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { login } from "@/api/client";

// Full-bleed collage background — hosted externally on base44 (kept as-is per product spec).
const COLLAGE = [
  "https://media.base44.com/images/public/6a7ebce6de52d2fdd4119940/8dcb76835_generated_image.png",
  "https://media.base44.com/images/public/6a7ebce6de52d2fdd4119940/595a98e98_generated_image.png",
  "https://media.base44.com/images/public/6a7ebce6de52d2fdd4119940/3d0173d0e_generated_image.png",
  "https://media.base44.com/images/public/6a7ebce6de52d2fdd4119940/ad0ac1e57_generated_image.png",
];

const TRUST_BADGES = [
  { icon: BadgeCheck, label: "Secure & Compliant" },
  { icon: Zap, label: "Fast Registration" },
  { icon: Headset, label: "24/7 Support" },
  { icon: Wifi, label: "Reliable Connectivity" },
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
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Full-bleed collage background */}
      <div className="fixed inset-0 -z-10 grid grid-cols-2 grid-rows-2">
        {COLLAGE.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover"
          />
        ))}
      </div>
      <div
        className="fixed inset-0 -z-10"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(180deg, rgba(26,18,11,0.68) 0%, rgba(26,18,11,0.55) 45%, rgba(26,18,11,0.78) 100%)",
        }}
      />

      {/* Top-left overlay copy */}
      <div className="relative z-10 hidden flex-1 flex-col justify-center px-12 py-12 sm:flex lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 flex items-center gap-2.5"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-kyc-brand text-white shadow-lg">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold leading-tight text-white">SIM KYC</div>
            <div className="text-xs leading-tight text-white/70">Tourist Registration</div>
          </div>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-md text-4xl font-bold leading-tight text-white"
        >
          Stay Connected. Explore with Confidence.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-4 max-w-sm text-sm text-white/75"
        >
          Secure passport verification and SIM registration for every traveler, backed by real-time
          compliance monitoring.
        </motion.p>
      </div>

      {/* Centered glassmorphism login card */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-12 sm:flex-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="w-full max-w-[420px] rounded-2xl border border-white/25 bg-white/85 p-8 shadow-2xl backdrop-blur-xl"
        >
          <div className="mb-6 flex items-center gap-2.5 sm:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-kyc-brand text-white">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-bold leading-tight text-kyc-text-primary">SIM KYC</div>
              <div className="text-xs leading-tight text-kyc-text-secondary">Tourist Registration</div>
            </div>
          </div>

          <span className="inline-flex items-center rounded-full bg-kyc-brand-tint px-3 py-1 text-xs font-semibold text-kyc-brand">
            Tourist KYC Portal
          </span>

          <h2 className="mt-4 text-2xl font-semibold text-kyc-text-primary">Welcome back</h2>
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
              {isLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              {isLoading ? "Signing you in…" : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-kyc-text-secondary">
            Accounts are provisioned internally by your system administrator — there is no self-service
            registration. Having trouble signing in? Contact your system administrator.
          </p>
        </motion.div>
      </div>

      {/* Bottom trust badge strip */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="relative z-10 hidden items-center justify-center gap-8 border-t border-white/15 bg-black/20 px-6 py-4 backdrop-blur-sm md:flex"
      >
        {TRUST_BADGES.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 text-white/85">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10">
              <Icon className="h-4 w-4" />
            </span>
            <span className="text-xs font-medium">{label}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

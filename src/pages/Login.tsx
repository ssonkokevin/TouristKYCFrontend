import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { ShieldCheck, Building2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { loginWithGoogle } from "@/api/client";
import { useToast } from "@/components/ui/use-toast";

export function LoginPage() {
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) {
      toast({ title: "Login failed", description: "No credential received", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { token, user } = await loginWithGoogle(credentialResponse.credential);
      setAuth(token, user);
      navigate("/");
    } catch (err: any) {
      toast({
        title: "Login failed",
        description: err.message || "Only @hamiltel.com accounts are permitted to sign in.",
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

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() =>
                toast({ title: "Login failed", description: "Google sign-in failed", variant: "destructive" })
              }
              useOneTap
              width="320"
            />
          </div>

          {isLoading && (
            <p className="mt-4 text-center text-sm text-slate-500">Signing you in&hellip;</p>
          )}

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Access policy</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="space-y-3 rounded-lg bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <Building2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500" />
              <p className="text-sm text-slate-600">
                Restricted to <span className="font-medium text-slate-900">@hamiltel.com</span> Google Workspace
                accounts.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500" />
              <p className="text-sm text-slate-600">
                First time signing in? Your account is created automatically — no separate registration needed.
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

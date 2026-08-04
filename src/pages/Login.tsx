import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/hooks/useAuth";
import { loginWithGoogle } from "@/api/client";
import { useToast } from "@/components/ui/use-toast";

export function LoginPage() {
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) {
      toast({ title: "Login failed", description: "No credential received", variant: "destructive" });
      return;
    }
    try {
      const { token, user } = await loginWithGoogle(credentialResponse.credential);
      setAuth(token, user);
      navigate("/");
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-xl border-2 border-slate-900 bg-white text-slate-900 text-xl font-bold">T</div>
          <h1 className="text-2xl font-bold text-slate-900">TouristReg UG</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in with your Google account</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => toast({ title: "Login failed", description: "Google sign-in failed", variant: "destructive" })}
              useOneTap
            />
          </div>
        </div>
      </div>
    </div>
  );
}

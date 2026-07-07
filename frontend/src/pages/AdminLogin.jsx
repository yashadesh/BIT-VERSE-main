import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { LOGO_URL } from "@/lib/api";
import { Shield, Lock, Mail, Eye, EyeOff, LogIn } from "lucide-react";

function formatDetail(detail) {
  if (!detail) return "Login failed";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((e) => e?.msg || JSON.stringify(e)).join(" ");
  return String(detail);
}

export default function AdminLogin() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await login(email.trim(), password);
      toast.success("Welcome back, Adesh!");
    } catch (e2) {
      setErr(formatDetail(e2?.response?.data?.detail));
    }
    setBusy(false);
  };

  const inp = "w-full pl-11 pr-4 py-3 rounded-xl bg-[#0D1117]/70 border border-white/10 text-white text-sm focus:outline-none focus:border-[#00E5D4]/60 focus:ring-2 focus:ring-[#00E5D4]/20";

  return (
    <div className="page-enter min-h-[80vh] flex items-center justify-center px-6 pt-28 md:pt-32">
      <div className="w-full max-w-md" data-testid="admin-login-page">
        <div className="flex flex-col items-center mb-8">
          <span className="logo-frame mb-4">
            <img src={LOGO_URL} alt="BITVERSE" className="w-16 h-16 object-contain block" />
          </span>
          <div className="chip mb-3"><Shield className="w-3 h-3" /> Admin Access</div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tighter text-center">
            Restricted <span className="text-[#00E5D4]">BITVERSE</span> Console
          </h1>
          <p className="mt-3 text-sm text-[#B0B8C5] text-center max-w-sm">
            Sign in to upload, edit or remove files. Only the site owner can access this area.
          </p>
        </div>

        <form onSubmit={submit} className="card-glass p-6 md:p-8 space-y-5">
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="email"
              autoComplete="username"
              placeholder="Email"
              className={inp}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              data-testid="admin-login-email"
            />
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Password"
              className={inp}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              data-testid="admin-login-password"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-white/40 hover:text-[#00E5D4]"
              data-testid="admin-login-toggle-pw"
              aria-label="Toggle password"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {err && (
            <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5" data-testid="admin-login-error">
              {err}
            </div>
          )}

          <button
            type="submit"
            className="btn-neon primary w-full"
            disabled={busy}
            data-testid="admin-login-submit"
          >
            <LogIn className="w-4 h-4" /> {busy ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-white/40 font-mono">
          Not the owner? Head back to{" "}
          <a href="/" className="text-[#00E5D4] hover:underline">bitverse.in</a>
        </p>
      </div>
    </div>
  );
}

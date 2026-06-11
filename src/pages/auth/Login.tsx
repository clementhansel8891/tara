import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { ForgotPasswordModal } from "./ForgotPasswordModal";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login({ email, password });
    if (result.success) {
      navigate("/core/dashboard");
    } else {
      setError(result.error || "Failed to login");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px] animate-pulse pointer-events-none" />

      <div className="max-w-md w-full glass-morphism rounded-3xl shadow-2xl border border-white/20 dark:border-white/5 overflow-hidden relative z-10 p-1">
        <div className="bg-background/40 backdrop-blur-md rounded-[1.4rem] p-8 sm:p-10">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-14 h-14 bg-gradient-to-tr from-primary to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/40 mb-6 group transition-transform hover:scale-110 duration-500">
              <svg className="w-8 h-8 text-primary-foreground group-hover:rotate-12 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-foreground mb-2">ZENVIX</h2>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-[0.2em]">Intelligent Workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-destructive/10 border-l-4 border-destructive text-destructive text-sm rounded-r-md animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-1">Work Email</label>
              <input
                type="email"
                required
                className="w-full px-5 py-3.5 rounded-2xl border border-border bg-background/50 backdrop-blur-sm shadow-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300 font-medium"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Password</label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-[10px] font-black uppercase text-primary hover:text-primary/80 transition-colors tracking-widest"
                >
                  Recovery
                </button>
              </div>
              <input
                type="password"
                required
                className="w-full px-5 py-3.5 rounded-2xl border border-border bg-background/50 backdrop-blur-sm shadow-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300 font-medium"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black italic uppercase tracking-[0.15em] py-4 rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 mt-4"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-primary-foreground" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Initialize Access</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-border/50 text-center">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              New to Zenvix?{" "}
              <Link to="/auth/register" className="text-primary hover:text-primary/80 transition-colors ml-1">
                Create Organization
              </Link>
            </p>
          </div>
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
      />
    </div>
  );
}

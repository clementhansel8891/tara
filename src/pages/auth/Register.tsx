import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Register() {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { registerUser, login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await registerUser(formData);
    if (result.success) {
      // Auto login after successful registration
      const loginResult = await login({
        email: formData.email,
        password: formData.password,
      });
      if (loginResult.success) {
        navigate("/core/dashboard");
      } else {
        navigate("/auth/login"); // Fallback if auto-login fails
      }
    } else {
      setError(result.error || "Registration failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden py-12 px-4">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse pointer-events-none" />

      <div className="max-w-xl w-full glass-morphism rounded-3xl shadow-2xl border border-white/20 dark:border-white/5 overflow-hidden relative z-10 p-1 transition-all duration-500">
        <div className="bg-background/40 backdrop-blur-md rounded-[1.4rem] p-8 sm:p-10">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-14 h-14 bg-gradient-to-tr from-primary to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/40 mb-6 group transition-transform hover:scale-110 duration-500">
              <svg className="w-8 h-8 text-primary-foreground group-hover:rotate-12 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-foreground mb-2 uppercase italic">Register</h2>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-[0.2em] max-w-xs mx-auto">Initialize your isolated enterprise partition</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-destructive/10 border-l-4 border-destructive text-destructive text-sm rounded-r-md animate-in fade-in slide-in-from-top-1 font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-1">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  required
                  className="w-full px-5 py-3.5 rounded-2xl border border-border bg-background/50 backdrop-blur-sm shadow-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300 font-medium"
                  value={formData.first_name}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-1">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  required
                  className="w-full px-5 py-3.5 rounded-2xl border border-border bg-background/50 backdrop-blur-sm shadow-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300 font-medium"
                  value={formData.last_name}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-1">Work Email</label>
              <input
                type="email"
                name="email"
                required
                className="w-full px-5 py-3.5 rounded-2xl border border-border bg-background/50 backdrop-blur-sm shadow-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300 font-medium"
                placeholder="name@company.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-1">Phone Number (Optional)</label>
              <input
                type="tel"
                name="phone"
                className="w-full px-5 py-3.5 rounded-2xl border border-border bg-background/50 backdrop-blur-sm shadow-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300 font-medium"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-1">Access Credential</label>
              <input
                type="password"
                name="password"
                required
                minLength={8}
                className="w-full px-5 py-3.5 rounded-2xl border border-border bg-background/50 backdrop-blur-sm shadow-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300 font-medium"
                placeholder="Min 8 characters"
                value={formData.password}
                onChange={handleChange}
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
                  <span>Provisioning...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-border/50 text-center">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Existing Member?{" "}
              <Link to="/auth/login" className="text-primary hover:text-primary/80 transition-colors ml-1">
                Sign in to console
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

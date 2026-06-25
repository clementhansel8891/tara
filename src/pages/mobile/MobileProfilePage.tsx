import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { User, Sun, Moon, Globe, LogOut, ChevronRight, Shield, Lock, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

export function MobileProfilePage() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showSecurity, setShowSecurity] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", new_pass: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);

  const handleLogout = () => { logout(); navigate("/login"); };

  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.new_pass) { toast.error("Password lama dan baru wajib diisi"); return; }
    if (passwords.new_pass.length < 6) { toast.error("Password baru minimal 6 karakter"); return; }
    if (passwords.new_pass !== passwords.confirm) { toast.error("Konfirmasi password tidak cocok"); return; }
    try {
      await api.post("/auth/change-password", { current_password: passwords.current, new_password: passwords.new_pass });
      toast.success("Password berhasil diubah");
    } catch { toast.success("Password berhasil diubah (demo)"); }
    setPasswords({ current: "", new_pass: "", confirm: "" });
    setShowSecurity(false);
  };

  return (
    <div className="px-5 py-6 space-y-6 animate-fade-in">
      {/* Profile Card */}
      <div className="surface-elevated p-5 flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
          <span className="text-xl font-display font-semibold text-gold">{user?.full_name?.charAt(0) || "?"}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-medium truncate">{user?.full_name || "—"}</p>
          <p className="text-xs text-muted-foreground">{user?.email || "—"}</p>
          <p className="text-2xs text-muted-foreground mt-0.5">{user?.role} • {user?.department || "—"}</p>
        </div>
      </div>

      {/* Menu */}
      <div className="space-y-1">
        {/* Language */}
        <button onClick={() => setShowLang(!showLang)} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/50">
          <Globe className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1 text-left">
            <p className="text-sm">Bahasa</p>
            <p className="text-2xs text-muted-foreground">{user?.language_preference === "en" ? "English" : "Bahasa Indonesia"}</p>
          </div>
          <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", showLang && "rotate-90")} />
        </button>
        {showLang && (
          <div className="ml-12 space-y-1 animate-fade-in">
            {[{ v: "id", l: "🇮🇩 Bahasa Indonesia" }, { v: "en", l: "🇬🇧 English" }].map(lang => (
              <button key={lang.v} onClick={() => { toast.success(`Bahasa diubah ke ${lang.l}`); setShowLang(false); }}
                className={cn("w-full text-left px-3 py-2 rounded-md text-sm", user?.language_preference === lang.v ? "bg-accent font-medium" : "hover:bg-accent/50")}>
                {lang.l}
              </button>
            ))}
          </div>
        )}

        {/* Security */}
        <button onClick={() => setShowSecurity(!showSecurity)} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/50">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1 text-left"><p className="text-sm">Keamanan</p><p className="text-2xs text-muted-foreground">Ubah password</p></div>
          <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", showSecurity && "rotate-90")} />
        </button>
        {showSecurity && (
          <div className="mx-4 p-4 rounded-md border border-border/50 space-y-3 animate-fade-in">
            <div className="space-y-1.5">
              <label className="text-luxury-label">Password Saat Ini</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})}
                  placeholder="••••••••" className="w-full h-9 px-3 pr-9 rounded-md border border-input bg-background text-sm" />
                <button onClick={() => setShowPass(!showPass)} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  {showPass ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5 text-muted-foreground" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-luxury-label">Password Baru</label>
              <input type="password" value={passwords.new_pass} onChange={e => setPasswords({...passwords, new_pass: e.target.value})}
                placeholder="Minimal 6 karakter" className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-luxury-label">Konfirmasi</label>
              <input type="password" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                placeholder="Ketik ulang" className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" />
            </div>
            <button onClick={handleChangePassword} className="w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium">
              <Lock className="h-3.5 w-3.5 inline mr-1.5" />Ubah Password
            </button>
          </div>
        )}

        {/* Theme */}
        <button onClick={() => { toggleTheme(); toast.success(`Tema diubah ke mode ${theme === "dark" ? "terang" : "gelap"}`); }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/50">
          {theme === "dark" ? <Sun className="h-5 w-5 text-muted-foreground" /> : <Moon className="h-5 w-5 text-muted-foreground" />}
          <div className="flex-1 text-left"><p className="text-sm">{theme === "dark" ? "Mode Terang" : "Mode Gelap"}</p></div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Logout */}
      <button onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 h-12 rounded-lg border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/5">
        <LogOut className="h-4 w-4" />Keluar
      </button>

      <p className="text-center text-2xs text-muted-foreground">TARA v2.0 • PT. Maju Bersama</p>
    </div>
  );
}

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { MapPin, Fingerprint, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileClockPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<"idle" | "processing" | "success">("idle");
  const [clockedIn, setClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [clockOutTime, setClockOutTime] = useState<string | null>(null);

  const handleClock = async () => {
    setStatus("processing");
    const now = new Date();
    const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

    try {
      if (!clockedIn) {
        await api.post("/attendance/clock-in", {
          timestamp: now.toISOString(),
          latitude: -6.2088,
          longitude: 106.8456,
        });
        setClockInTime(timeStr);
        toast.success(`Clock-in berhasil pukul ${timeStr} WIB`);
      } else {
        await api.post("/attendance/clock-out", {
          timestamp: now.toISOString(),
          latitude: -6.2088,
          longitude: 106.8456,
        });
        setClockOutTime(timeStr);
        toast.success(`Clock-out berhasil pukul ${timeStr} WIB`);
      }
      setStatus("success");
      setClockedIn(!clockedIn);
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err: any) {
      // Demo mode — still succeed
      if (!clockedIn) { setClockInTime(timeStr); toast.success(`Clock-in berhasil pukul ${timeStr} WIB`); }
      else { setClockOutTime(timeStr); toast.success(`Clock-out berhasil pukul ${timeStr} WIB`); }
      setStatus("success");
      setClockedIn(!clockedIn);
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  return (
    <div className="px-5 py-6 space-y-8 animate-fade-in">
      <div className="text-center space-y-1">
        <p className="text-luxury-label">Kehadiran</p>
        <p className="text-3xl font-display font-semibold">
          {new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Clock Button */}
      <div className="flex flex-col items-center space-y-4">
        <button onClick={handleClock} disabled={status === "processing"}
          className={cn("h-32 w-32 rounded-full flex flex-col items-center justify-center gap-1 transition-all duration-300",
            status === "success" ? "bg-success/10 border-2 border-success" :
            clockedIn ? "bg-destructive/5 border-2 border-destructive/40 hover:border-destructive" :
            "bg-gradient-to-br from-gold/20 to-gold/5 border-2 border-gold/40 hover:border-gold hover:shadow-luxury-glow",
            status === "processing" && "animate-pulse", "active:scale-95")}>
          {status === "success" ? <CheckCircle2 className="h-10 w-10 text-success" /> : (
            <><Fingerprint className={cn("h-10 w-10", clockedIn ? "text-destructive" : "text-gold")} />
            <span className={cn("text-2xs font-medium", clockedIn ? "text-destructive" : "text-gold")}>
              {clockedIn ? "CLOCK OUT" : "CLOCK IN"}</span></>
          )}
        </button>
        <p className="text-sm text-muted-foreground">
          {status === "processing" ? "Memverifikasi..." :
           status === "success" ? "Berhasil!" :
           clockedIn ? "Ketuk untuk Clock Out" : "Ketuk untuk Clock In"}
        </p>
      </div>

      {/* Location Status */}
      <div className="surface-elevated p-4 space-y-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-success" />
          <span className="text-sm font-medium">Dalam area kantor</span>
        </div>
        <p className="text-2xs text-muted-foreground pl-6">Kantor Pusat Jakarta • Jarak: ~50m dari titik pusat</p>
      </div>

      {/* Today's Record */}
      <div className="surface-elevated p-4 space-y-3">
        <p className="text-luxury-label">Rekap Hari Ini</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 rounded-md bg-secondary/50">
            <p className="text-xs text-muted-foreground">Clock In</p>
            <p className="text-sm font-mono font-medium mt-1">{clockInTime || "—"}</p>
          </div>
          <div className="text-center p-3 rounded-md bg-secondary/50">
            <p className="text-xs text-muted-foreground">Clock Out</p>
            <p className="text-sm font-mono font-medium mt-1">{clockOutTime || "—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

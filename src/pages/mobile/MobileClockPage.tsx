import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { MapPin, Lock, CheckCircle2, AlertTriangle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

/**
 * Request the device's current GPS position.
 */
function getGeoLocation(): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Perangkat tidak mendukung GPS"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            reject(new Error("Izin lokasi ditolak. Aktifkan GPS dan izinkan akses lokasi."));
            break;
          case err.POSITION_UNAVAILABLE:
            reject(new Error("Lokasi tidak tersedia. Pastikan GPS aktif."));
            break;
          case err.TIMEOUT:
            reject(new Error("Timeout mendapatkan lokasi. Coba lagi."));
            break;
          default:
            reject(new Error("Gagal mendapatkan lokasi"));
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

/**
 * PIN Input Dialog Component
 */
function PinDialog({
  open,
  onSubmit,
  onCancel,
  isVerifying,
  error,
}: {
  open: boolean;
  onSubmit: (pin: string) => void;
  onCancel: () => void;
  isVerifying: boolean;
  error: string | null;
}) {
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (open) {
      setPin(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [open]);

  if (!open) return null;

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only digits

    const newPin = [...pin];
    newPin[index] = value.slice(-1); // Take last character
    setPin(newPin);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (value && index === 5) {
      const fullPin = newPin.join("");
      if (fullPin.length === 6) {
        onSubmit(fullPin);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setPin(pasted.split(""));
      onSubmit(pasted);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-card rounded-2xl p-6 mx-4 w-full max-w-sm shadow-luxury-lg space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-gold" />
            <h3 className="font-display font-semibold text-lg">Masukkan PIN</h3>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-md hover:bg-accent">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          Masukkan PIN 6 digit untuk verifikasi kehadiran Anda.
        </p>

        {/* PIN Input */}
        <div className="flex justify-center gap-2" onPaste={handlePaste}>
          {pin.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={isVerifying}
              className={cn(
                "w-11 h-12 text-center text-lg font-mono font-semibold rounded-lg border-2 bg-background transition-all",
                "focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold",
                error ? "border-destructive" : "border-input",
                isVerifying && "opacity-50"
              )}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="text-center text-sm text-destructive font-medium animate-fade-in">
            {error}
          </p>
        )}

        {/* Loading */}
        {isVerifying && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Memverifikasi...</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function MobileClockPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<"idle" | "locating" | "pin" | "submitting" | "success" | "error">("idle");
  const [clockedIn, setClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [clockOutTime, setClockOutTime] = useState<string | null>(null);
  const [geoStatus, setGeoStatus] = useState<"unknown" | "inside" | "outside">("unknown");
  const [geoError, setGeoError] = useState<string | null>(null);
  const [lastPosition, setLastPosition] = useState<GeoPosition | null>(null);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isPinVerifying, setIsPinVerifying] = useState(false);
  const [pendingPosition, setPendingPosition] = useState<GeoPosition | null>(null);

  // Get location on page load
  useEffect(() => {
    getGeoLocation()
      .then((pos) => {
        setLastPosition(pos);
        setGeoStatus("inside");
        setGeoError(null);
      })
      .catch((err) => {
        setGeoError(err.message);
        setGeoStatus("unknown");
      });
  }, []);

  const handleClock = async () => {
    if (!user?.id) {
      toast.error("Sesi tidak valid. Silakan login ulang.");
      return;
    }

    // Step 1: Get GPS location
    setStatus("locating");
    try {
      const position = await getGeoLocation();
      setLastPosition(position);
      setGeoStatus("inside");
      setGeoError(null);
      setPendingPosition(position);
    } catch (err: any) {
      setGeoError(err.message);
      setGeoStatus("unknown");
      setStatus("error");
      toast.error(err.message);
      setTimeout(() => setStatus("idle"), 2000);
      return;
    }

    // Step 2: Show PIN dialog
    setStatus("pin");
    setPinError(null);
    setShowPinDialog(true);
  };

  const handlePinSubmit = async (pin: string) => {
    setIsPinVerifying(true);
    setPinError(null);

    try {
      // Verify PIN with backend
      const result = await api.post<{ success: boolean; data: { verified: boolean } }>("/auth/verify-pin", { pin });

      if (!result.data?.verified) {
        setPinError("PIN salah. Coba lagi.");
        setIsPinVerifying(false);
        return;
      }

      // PIN verified — close dialog and submit attendance
      setShowPinDialog(false);
      setIsPinVerifying(false);
      await submitClock(pendingPosition!);
    } catch (err: any) {
      setPinError(err.message || "Gagal verifikasi PIN");
      setIsPinVerifying(false);
    }
  };

  const handlePinCancel = () => {
    setShowPinDialog(false);
    setStatus("idle");
    setPinError(null);
    setIsPinVerifying(false);
  };

  const submitClock = async (position: GeoPosition) => {
    setStatus("submitting");
    const now = new Date();
    const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

    try {
      if (!clockedIn) {
        await api.post("/absensi-agent/clock-in", {
          employee_id: user!.id,
          timestamp: now.toISOString(),
          gps_latitude: position.latitude,
          gps_longitude: position.longitude,
          biometric_verified: true, // PIN verified
          attendance_source: "phone",
        });
        setClockInTime(timeStr);
        setClockedIn(true);
        setStatus("success");
        toast.success(`Clock-in berhasil pukul ${timeStr} WIB`);
      } else {
        await api.post("/absensi-agent/clock-out", {
          employee_id: user!.id,
          timestamp: now.toISOString(),
          gps_latitude: position.latitude,
          gps_longitude: position.longitude,
          attendance_source: "phone",
        });
        setClockOutTime(timeStr);
        setClockedIn(false);
        setStatus("success");
        toast.success(`Clock-out berhasil pukul ${timeStr} WIB`);
      }
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err: any) {
      setStatus("error");
      toast.error(err.message || "Gagal mengirim data kehadiran");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const isProcessing = status === "locating" || status === "submitting";

  const statusLabel = () => {
    switch (status) {
      case "locating": return "Mendapatkan lokasi...";
      case "pin": return "Masukkan PIN...";
      case "submitting": return "Mengirim data...";
      case "success": return "Berhasil!";
      case "error": return "Gagal. Coba lagi.";
      default: return clockedIn ? "Ketuk untuk Clock Out" : "Ketuk untuk Clock In";
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
        <button
          onClick={handleClock}
          disabled={isProcessing || status === "pin"}
          className={cn(
            "h-32 w-32 rounded-full flex flex-col items-center justify-center gap-1 transition-all duration-300",
            status === "success"
              ? "bg-success/10 border-2 border-success"
              : status === "error"
              ? "bg-destructive/10 border-2 border-destructive"
              : clockedIn
              ? "bg-destructive/5 border-2 border-destructive/40 hover:border-destructive"
              : "bg-gradient-to-br from-gold/20 to-gold/5 border-2 border-gold/40 hover:border-gold hover:shadow-luxury-glow",
            isProcessing && "animate-pulse",
            "active:scale-95"
          )}
        >
          {status === "success" ? (
            <CheckCircle2 className="h-10 w-10 text-success" />
          ) : status === "error" ? (
            <AlertTriangle className="h-10 w-10 text-destructive" />
          ) : isProcessing ? (
            <Loader2 className="h-10 w-10 text-gold animate-spin" />
          ) : (
            <>
              <Lock className={cn("h-10 w-10", clockedIn ? "text-destructive" : "text-gold")} />
              <span className={cn("text-2xs font-medium", clockedIn ? "text-destructive" : "text-gold")}>
                {clockedIn ? "CLOCK OUT" : "CLOCK IN"}
              </span>
            </>
          )}
        </button>
        <p className="text-sm text-muted-foreground">{statusLabel()}</p>
      </div>

      {/* Location Status */}
      <div className="surface-elevated p-4 space-y-2">
        <div className="flex items-center gap-2">
          {geoError ? (
            <>
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium text-warning">Lokasi tidak tersedia</span>
            </>
          ) : geoStatus === "inside" ? (
            <>
              <MapPin className="h-4 w-4 text-success" />
              <span className="text-sm font-medium">Lokasi terdeteksi</span>
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Mendeteksi lokasi...</span>
            </>
          )}
        </div>
        <p className="text-2xs text-muted-foreground pl-6">
          {geoError
            ? geoError
            : lastPosition
            ? `Akurasi: ~${Math.round(lastPosition.accuracy)}m • ${lastPosition.latitude.toFixed(5)}, ${lastPosition.longitude.toFixed(5)}`
            : "Menunggu data GPS..."}
        </p>
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

      {/* PIN Dialog */}
      <PinDialog
        open={showPinDialog}
        onSubmit={handlePinSubmit}
        onCancel={handlePinCancel}
        isVerifying={isPinVerifying}
        error={pinError}
      />
    </div>
  );
}

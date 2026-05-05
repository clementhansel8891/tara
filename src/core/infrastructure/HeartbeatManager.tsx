import { useEffect, useRef } from "react";
import { useSession } from "@/core/security/session";
import { retailService } from "@/core/services/retail/retailService";

export const HeartbeatManager = () => {
  const session = useSession();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!session.tenant_id || !session.user_id) return;

    const reportPulse = async () => {
      try {
        // Report heartbeat for the current terminal/node
        // We use a generic terminal ID if not specific, 
        // but in a real app, this would be the local device ID.
        const terminalId = localStorage.getItem("zenvix_terminal_id") || `node-${session.user_id.slice(0, 8)}`;
        
        await retailService.recordHeartbeat(session.tenant_id!, session, {
          device_id: terminalId,
          status: "ONLINE",
          diagnostics: {
            battery: (navigator as any).getBattery ? await (navigator as any).getBattery().then((b: any) => b.level * 100) : null,
            memory: (performance as any).memory?.usedJSHeapSize,
            url: window.location.href,
            userAgent: navigator.userAgent
          }
        });
        
        console.debug(`[Heartbeat] Pulse reported for ${terminalId}`);
      } catch (err) {
        console.warn("[Heartbeat] Failed to report pulse", err);
      }
    };

    // Initial pulse
    reportPulse();

    // Set interval (every 30 seconds)
    intervalRef.current = setInterval(reportPulse, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [session.tenant_id, session.user_id]);

  return null; // Silent background component
};

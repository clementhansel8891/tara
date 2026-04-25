import React, { createContext, useEffect, useRef, ReactNode } from "react";

/**
 * BarcodeScannerContextType
 * Placeholder for global scanner state if needed in the future.
 */
export type BarcodeScannerContextType = Record<string, never>;

export const BarcodeScannerContext = createContext<
  BarcodeScannerContextType | undefined
>(undefined);

interface BarcodeScannerProviderProps {
  children: ReactNode;
}

/**
 * BarcodeScannerProvider
 * Listens for global keyboard events (HID scanners emulate keyboards).
 * Dispatches a 'barcode-scanned' CustomEvent when a full sequence is detected (ended by Enter).
 */
export const BarcodeScannerProvider: React.FC<BarcodeScannerProviderProps> = ({
  children,
}) => {
  const buffer = useRef<string>("");
  const lastKeyTime = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // HID scanners usually just fast-type into whatever is focused.
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      const now = Date.now();
      // Scanners typically send keys with < 50ms intervals.
      const diff = now - lastKeyTime.current;
      lastKeyTime.current = now;

      // If it's Enter, the scan is likely finished.
      if (e.key === "Enter") {
        if (buffer.current.length >= 3) {
          // Minimum barcode length safety
          console.log("[Scanner] Detected:", buffer.current);
          window.dispatchEvent(
            new CustomEvent("barcode-scanned", { detail: buffer.current }),
          );

          // Clear buffer
          buffer.current = "";

          // Prevent Enter from submitting forms if a scan was detected
          if (!isInput) {
            e.preventDefault();
          }
        } else {
          buffer.current = "";
        }
        return;
      }

      // Buffer printable characters
      if (e.key?.length === 1) {
        // If it's been a while since the last key, it might be the start of a new scan or manual typing
        // We reset the buffer if the gap is too large (> 100ms)
        if (diff > 100) {
          buffer.current = "";
        }
        buffer.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown, true); // Use capture phase
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, []);

  return (
    <BarcodeScannerContext.Provider value={{}}>
      {children}
    </BarcodeScannerContext.Provider>
  );
};

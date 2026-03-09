import { useEffect } from "react";

/**
 * useBarcodeScanner
 * Hook for components to subscribe to scanned barcodes detected by the HID keyboard scanner.
 */
export function useBarcodeScanner(onScan: (barcode: string) => void) {
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      onScan(customEvent.detail);
    };

    window.addEventListener("barcode-scanned", handler);
    return () => window.removeEventListener("barcode-scanned", handler);
  }, [onScan]);
}

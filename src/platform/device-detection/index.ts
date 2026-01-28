// ============================================================
// DEVICE DETECTION - Runtime device capability detection
// ============================================================

import { useState, useEffect } from "react";
import type { DeviceType, DeviceCapability } from "@/core/types";

export interface DetectedDevice {
  type: DeviceType;
  capabilities: DeviceCapability[];
  screenWidth: number;
  screenHeight: number;
  isTouch: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isKiosk: boolean;
  orientation: "portrait" | "landscape";
}

// Configurable breakpoints
const MOBILE_MAX_WIDTH = 480;
const TABLET_MAX_WIDTH = 1024;

export function detectDevice(): DetectedDevice {
  if (typeof window === "undefined") return getDefaultDevice();

  const width = window.innerWidth;
  const height = window.innerHeight;
  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const orientation: "portrait" | "landscape" =
    width > height ? "landscape" : "portrait";

  // Kiosk detection (fullscreen or standalone)
  const isKiosk =
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: standalone)").matches;

  // Device type logic
  let type: DeviceType = "desktop";
  let isMobile = false;
  let isTablet = false;
  let isDesktop = true;

  if (isTouch) {
    if (width <= MOBILE_MAX_WIDTH) {
      type = "mobile";
      isMobile = true;
      isDesktop = false;
    } else if (width <= TABLET_MAX_WIDTH) {
      type = "tablet";
      isTablet = true;
      isDesktop = false;
    }
  }

  if (isKiosk && !isMobile) {
    type = "kiosk";
    isDesktop = false;
  }

  // Capabilities detection
  const capabilities: DeviceCapability[] = ["pos"]; // All devices support POS

  // Camera for scanner/barcode
  if (navigator.mediaDevices?.getUserMedia) capabilities.push("scanner");

  // TODO: Extend with printer, NFC, biometric, etc.

  return {
    type,
    capabilities,
    screenWidth: width,
    screenHeight: height,
    isTouch,
    isMobile,
    isTablet,
    isDesktop,
    isKiosk,
    orientation,
  };
}

export function getDefaultDevice(
  overrides?: Partial<DetectedDevice>,
): DetectedDevice {
  return {
    type: "desktop",
    capabilities: ["pos"],
    screenWidth: 1920,
    screenHeight: 1080,
    isTouch: false,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isKiosk: false,
    orientation: "landscape",
    ...overrides,
  };
}

// ============================================================
// REACT HOOK: useDevice
// ============================================================

export function useDevice(): DetectedDevice {
  const [device, setDevice] = useState<DetectedDevice>(detectDevice);

  useEffect(() => {
    const updateDevice = () => setDevice(detectDevice());

    // Debounce resize/orientation changes to improve performance
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateDevice, 100);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  return device;
}

/**
 * LOGISTICS_CARRIERS_CONFIG
 *
 * Configures available logistics carriers for the Order Fulfillment module.
 * This list drives the carrier dropdown in the Racetrack AWB input.
 *
 * Future integration: Replace `slug` with actual API adapter keys from
 * your logistics router (e.g., RajaOngkir, Shipper, GudangAda logistics).
 *
 * To add a new carrier:
 *  1. Add an entry here with a unique `code`.
 *  2. Map the `code` to your logistics API connector in the backend.
 */

export interface LogisticsCarrier {
  /** Internal code, used as payload value in API calls */
  code: string;
  /** Display label shown in the UI dropdown */
  label: string;
  /** Optional badge color for UI rendering */
  color?: string;
  /** Whether this carrier is currently enabled */
  enabled: boolean;
}

export const LOGISTICS_CARRIERS: LogisticsCarrier[] = [
  { code: "JNE", label: "JNE Express", color: "#e8222e", enabled: true },
  {
    code: "SICEPAT",
    label: "SiCepat Ekspres",
    color: "#f97316",
    enabled: true,
  },
  { code: "JNT", label: "J&T Express", color: "#dc2626", enabled: true },
  { code: "GRAB", label: "Grab Express", color: "#00b14f", enabled: true },
  { code: "GOJEK", label: "GoSend", color: "#00aed9", enabled: true },
  { code: "ANTERAJA", label: "AnterAja", color: "#5b21b6", enabled: true },
  { code: "TIKI", label: "TIKI", color: "#ea580c", enabled: false },
  { code: "POS", label: "Pos Indonesia", color: "#b45309", enabled: false },
];

/** Returns only enabled carriers for use in UI dropdowns */
export const getActiveCarriers = (): LogisticsCarrier[] =>
  LOGISTICS_CARRIERS.filter((c) => c.enabled);

import type {
  BranchDevice,
  BranchDeviceType,
  CCTVProvider,
  BranchSensor,
  SensorType,
} from "@/core/types/retail/retail";

export type ConnType =
  | "tcp_ip"
  | "usb"
  | "bluetooth"
  | "com_port"
  | "wifi"
  | "other";

export interface ExtDevice extends BranchDevice {
  connType?: ConnType;
  comPort?: string;
  usbPort?: string;
}

export type Tab = "devices" | "cctv" | "sensors";

export interface DiscoveredDevice {
  discoveryId: string;
  name: string;
  type: BranchDeviceType;
  macAddress: string;
  ipAddress: string;
  model: string;
  status: string;
}

export interface RegForm {
  name: string;
  subType: string;
  model: string;
  serial: string;
  ip: string;
  mac: string;
  connType: ConnType | "";
  comPort: string;
  usbPort: string;
  placement: string;
  notes: string;
}

export const EMPTY_FORM: RegForm = {
  name: "",
  subType: "",
  model: "",
  serial: "",
  ip: "",
  mac: "",
  connType: "",
  comPort: "",
  usbPort: "",
  placement: "",
  notes: "",
};

export const DEVICE_TYPES: { v: BranchDeviceType; l: string }[] = [
  { v: "pc", l: "PC / Desktop" },
  { v: "tablet", l: "Tablet" },
  { v: "scanner", l: "Barcode Scanner" },
  { v: "thermal_printer", l: "Thermal Printer" },
  { v: "dot_matrix_printer", l: "Dot-Matrix Printer" },
  { v: "pos_terminal", l: "POS Terminal" },
  { v: "kiosk", l: "Kiosk" },
  { v: "mobile", l: "Mobile Device" },
  { v: "other", l: "Other" },
];

export const CAM_PROVIDERS: { v: CCTVProvider; l: string }[] = [
  { v: "dahua", l: "Dahua" },
  { v: "hikvision", l: "Hikvision" },
  { v: "axis", l: "Axis" },
  { v: "reolink", l: "Reolink" },
  { v: "custom", l: "Custom" },
  { v: "other", l: "Other" },
];

export const SENSOR_TYPES: { v: SensorType; l: string }[] = [
  { v: "temperature", l: "Temperature" },
  { v: "humidity", l: "Humidity" },
  { v: "fire_alarm", l: "Fire Alarm" },
  { v: "smoke", l: "Smoke Detector" },
  { v: "motion", l: "Motion Sensor" },
  { v: "door_contact", l: "Door Contact" },
  { v: "co2", l: "CO₂ Monitor" },
  { v: "vibration", l: "Vibration" },
  { v: "other", l: "Other" },
];

export const CONN_TYPES: { v: ConnType; l: string }[] = [
  { v: "tcp_ip", l: "TCP/IP (Network)" },
  { v: "wifi", l: "Wi-Fi" },
  { v: "usb", l: "USB" },
  { v: "bluetooth", l: "Bluetooth" },
  { v: "com_port", l: "COM / Serial Port" },
  { v: "other", l: "Other" },
];

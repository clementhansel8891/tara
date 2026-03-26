export class Device {
  id: string;
  tenantId: string;
  name: string;
  type: string; // RFID_READER, BARCODE_SCANNER, POS_TERMINAL
  connection: string; // API, LAN, USB, MQTT
  status: string; // ONLINE, OFFLINE
  locationId?: string;
  ownerId?: string;
  metadata?: any;
  createdAt: Date;
}

export class DeviceEvent {
  id: string;
  tenantId: string;
  deviceId: string;
  eventType: string; // RFID_SCAN, BARCODE_SCAN, TEMP_ALERT
  payload: any;
  processed: boolean;
  createdAt: Date;
}

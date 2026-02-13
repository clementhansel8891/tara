/**
 * Device Entity
 * Represents hardware devices registered in the system
 */
export class Device {
  id: string;
  tenantId: string;
  locationId: string;
  deviceType: 'pos' | 'biometric' | 'printer' | 'scanner' | 'terminal';
  deviceName: string;
  ipAddress?: string;
  macAddress?: string;
  status: 'online' | 'offline' | 'maintenance';
  lastSeen: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

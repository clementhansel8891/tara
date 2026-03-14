export interface AttendanceRecord {
  id: string;
  tenantId: string;
  employeeId: string;
  date: string;
  clockInTime?: Date;
  clockOutTime?: Date;
  locationId?: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY';
  createdAt: Date;
  updatedAt: Date;
}

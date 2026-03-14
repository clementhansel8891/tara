export interface Shift {
  id: string;
  tenantId: string;
  name: string;
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "17:00"
  locationId?: string;
  departmentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeeShiftAssignment {
  id: string;
  tenantId: string;
  employeeId: string;
  shiftId: string;
  date: string;
}

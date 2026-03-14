/**
 * Attendance Entity
 * Represents employee attendance records
 */
export class Attendance {
  id: string;
  tenantId: string;
  employeeId: string;
  locationId: string;
  clockIn: Date;
  clockOut?: Date;
  date: string; // YYYY-MM-DD format
  hoursWorked?: number;
  status: "present" | "absent" | "late" | "half_day";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

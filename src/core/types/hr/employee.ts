import type { HRAuditFields } from "./base";

export type EmploymentStatus = "candidate" | "offer" | "hired" | "probation" | "active" | "transferred" | "promoted" | "on_leave" | "suspended" | "terminated";
export type EmploymentType = "full_time" | "part_time" | "contractor" | "intern" | "temporary";

export interface Employee extends HRAuditFields {
  id: string;
  tenantId: string;
  userId?: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  departmentId: string;
  managerId?: string;
  roleTitle: string;
  location?: string;
  locationId: string;
  status: EmploymentStatus;
  employmentType: EmploymentType;
  baseSalary?: number;
  hourlyRate?: number;
  hireDate: string;
  terminationDate?: string;
}

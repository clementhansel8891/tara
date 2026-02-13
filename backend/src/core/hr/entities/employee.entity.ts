/**
 * Employee Entity
 * Represents an employee in the system
 */
export class Employee {
  id: string;
  tenantId: string;
  locationId?: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  departmentId: string;
  managerId?: string;
  roleTitle: string;
  status: 'active' | 'inactive' | 'terminated' | 'on_leave';
  employmentType: 'full_time' | 'part_time' | 'contractor' | 'intern';
  baseSalary?: number;
  hourlyRate?: number;
  hireDate: Date;
  terminationDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

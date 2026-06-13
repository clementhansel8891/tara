/**
 * Employee Entity
 * Represents an employee in the system.
 *
 * Field-mapping discipline (Requirement 5): several fields below are
 * compatibility aliases that do NOT match the `employees` schema columns 1:1.
 * Persisting them requires explicit translation via
 * `utils/field-mapping.ts -> mapEmployeeFieldsToColumns`, which resolves:
 *   - `position` / `job_title` / `role_title` -> column `positions`
 *   - `position_id`                            -> column `job_role_id`
 *   - `documents_metadata`                     -> column `document_metadata`
 * Computed/derived fields (`full_name`, `currency`) have NO backing column and
 * are dropped by the mapper instead of being spread into Prisma.
 */
export class Employee {
  id: string;
  tenant_id: string;
  location_id?: string;
  company_id?: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  full_name: string; // Computed (first_name + last_name); no schema column
  email: string;
  phone?: string;
  department_id: string;
  user_id?: string;
  manager_id?: string;
  position: string; // Alias -> schema column `positions`
  position_id?: string; // Alias -> schema column `job_role_id`
  job_title?: string; // Alias -> schema column `positions`
  currency?: string; // Derived from compensation/company; no schema column
  role_title: string; // Alias -> schema column `positions`
  status: 
    | "candidate" 
    | "offer" 
    | "hired" 
    | "probation" 
    | "active" 
    | "transferred" 
    | "promoted" 
    | "on_leave" 
    | "suspended" 
    | "terminated";
  employment_type: "full_time" | "part_time" | "contractor" | "intern" | "temporary";
  base_salary?: number;
  hourly_rate?: number;
  documents_metadata?: any;
  hire_date: Date;
  termination_date?: Date;
  hr_employee_skills?: any[];
  companies?: any;
  created_at: Date;
  updated_at: Date;
}

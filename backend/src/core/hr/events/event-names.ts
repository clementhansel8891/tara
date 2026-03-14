/**
 * HR Domain Event Names
 * Phase 2 — Event Model
 * 
 * Standardized constants for events emitted across the HR domain.
 * These are processed by the Global Event Bus.
 */

export const EVENT_NAMES = {
  // Employee Lifecycle Events
  EMPLOYEE_CREATED: 'employee.created',
  EMPLOYEE_PROMOTED: 'employee.promoted',
  EMPLOYEE_TRANSFERRED: 'employee.transferred',
  EMPLOYEE_SUSPENDED: 'employee.suspended',
  EMPLOYEE_TERMINATED: 'employee.terminated',

  // Recruitment Events
  CANDIDATE_CONVERTED: 'candidate.converted',
  INTERVIEW_SCHEDULED: 'interview.scheduled',

  // Payroll Events
  PAYROLL_EXECUTED: 'payroll.executed',
  PAYSLIP_GENERATED: 'payslip.generated',

  // Compliance Events
  COMPLIANCE_REPORT_GENERATED: 'compliance.report.generated',
  COMPLIANCE_MODULE_ENABLED: 'compliance.module.enabled',

  // Time & Attendance Events
  LEAVE_REQUESTED: 'leave.requested',
  LEAVE_APPROVED: 'leave.approved',
  LEAVE_REJECTED: 'leave.rejected',
  CLOCK_IN: 'clock.in',
  CLOCK_OUT: 'clock.out',
  SHIFT_ASSIGNED: 'shift.assigned',
} as const;

export type EventName = typeof EVENT_NAMES[keyof typeof EVENT_NAMES];

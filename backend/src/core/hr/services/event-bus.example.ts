/**
 * Event Bus Service Usage Examples
 * 
 * This file demonstrates how to use the EventBusService for TARA HR System
 * to emit structured events for various HR operations.
 */

import { EventBusService, TaraEvent } from './event-bus.service';

/**
 * Example 1: Emit Leave Request Submitted Event
 * 
 * Requirements: 21.1 - Emit event for leave request submission
 */
async function emitLeaveRequestSubmitted(
  eventBus: EventBusService,
  employeeId: string,
  leaveRequestId: string,
) {
  await eventBus.emit({
    event_type: 'leave.request.submitted',
    actor: {
      id: employeeId,
      type: 'employee',
    },
    entity: {
      id: leaveRequestId,
      type: 'leave_request',
    },
    payload: {
      leave_type: 'annual',
      start_date: '2024-01-15',
      end_date: '2024-01-20',
      total_days: 5,
      reason: 'Family vacation',
    },
  });
}

/**
 * Example 2: Emit Attendance Clock-In Event
 * 
 * Requirements: 21.2 - Emit event for clock-in action
 */
async function emitClockIn(
  eventBus: EventBusService,
  employeeId: string,
  attendanceId: string,
  gpsLocation: { latitude: number; longitude: number },
) {
  await eventBus.emit({
    event_type: 'attendance.clock_in',
    actor: {
      id: employeeId,
      type: 'employee',
    },
    entity: {
      id: attendanceId,
      type: 'attendance',
    },
    payload: {
      clock_in_time: new Date().toISOString(),
      location: gpsLocation,
      is_tardy: false,
      source: 'phone',
    },
  });
}

/**
 * Example 3: Emit Warning Letter Issuance Event
 * 
 * Requirements: 21.3 - Emit event for warning letter issuance
 */
async function emitWarningLetterIssued(
  eventBus: EventBusService,
  hrPersonnelId: string,
  employeeId: string,
  warningLetterId: string,
) {
  await eventBus.emit({
    event_type: 'warning_letter.issued',
    actor: {
      id: hrPersonnelId,
      type: 'employee', // HR personnel is also an employee
    },
    entity: {
      id: warningLetterId,
      type: 'warning_letter',
    },
    payload: {
      recipient_id: employeeId,
      warning_level: 'SP1',
      issue_date: new Date().toISOString(),
      reason: 'Repeated tardiness',
    },
    metadata: {
      visibility: 'private',
      confidential: true,
    },
  });
}

/**
 * Example 4: Emit Onboarding Step Completed Event
 * 
 * Requirements: 21.4 - Emit event for onboarding step completion
 */
async function emitOnboardingStepCompleted(
  eventBus: EventBusService,
  employeeId: string,
  stepNumber: number,
  stepName: string,
) {
  await eventBus.emit({
    event_type: 'onboarding.step_completed',
    actor: {
      id: 'system',
      type: 'agent', // Onboarding Agent
    },
    entity: {
      id: employeeId,
      type: 'employee',
    },
    payload: {
      step_number: stepNumber,
      step_name: stepName,
      completed_at: new Date().toISOString(),
    },
  });
}

/**
 * Example 5: Emit Leave Balance Updated Event
 * 
 * Requirements: 21.5 - Emit event for leave balance update
 */
async function emitLeaveBalanceUpdated(
  eventBus: EventBusService,
  employeeId: string,
  previousBalance: number,
  newBalance: number,
) {
  await eventBus.emit({
    event_type: 'leave_balance.updated',
    actor: {
      id: 'system',
      type: 'agent', // Leave Request Agent
    },
    entity: {
      id: employeeId,
      type: 'employee',
    },
    payload: {
      previous_balance: previousBalance,
      new_balance: newBalance,
      change: newBalance - previousBalance,
      updated_at: new Date().toISOString(),
    },
  });
}

/**
 * Example 6: Emit Weekly Check-In Submitted Event
 * 
 * Requirements: 21.6 - Emit event for weekly check-in submission
 */
async function emitWeeklyCheckInSubmitted(
  eventBus: EventBusService,
  employeeId: string,
  checkinId: string,
) {
  await eventBus.emit({
    event_type: 'weekly_checkin.submitted',
    actor: {
      id: employeeId,
      type: 'employee',
    },
    entity: {
      id: checkinId,
      type: 'weekly_checkin',
    },
    payload: {
      week_start_date: '2024-01-15',
      accomplishments: 'Completed user authentication module',
      challenges: 'Database performance optimization',
      next_week_goals: 'Implement leave management features',
      submitted_at: new Date().toISOString(),
    },
  });
}

/**
 * Example 7: Retrieve Events for an Employee
 * 
 * Requirements: 21.11 - Event ordering guarantee per employee
 */
async function getEmployeeEvents(
  eventBus: EventBusService,
  employeeId: string,
) {
  // Get all events for employee (ordered chronologically)
  const allEvents = await eventBus.getEventsForEmployee(employeeId);

  // Get only attendance events for employee
  const attendanceEvents = await eventBus.getEventsForEmployee(employeeId, {
    event_type: 'attendance.clock_in',
  });

  // Get paginated events
  const paginatedEvents = await eventBus.getEventsForEmployee(employeeId, {
    limit: 20,
    offset: 0,
  });

  return {
    allEvents,
    attendanceEvents,
    paginatedEvents,
  };
}

/**
 * Example 8: Query Events by Type
 */
async function getEventsByType(
  eventBus: EventBusService,
  eventType: string,
) {
  // Get all events of a specific type
  const events = await eventBus.getEventsByType(eventType);

  // Get only pending events of this type
  const pendingEvents = await eventBus.getEventsByType(eventType, {
    delivery_status: 'pending',
  });

  return {
    events,
    pendingEvents,
  };
}

export {
  emitLeaveRequestSubmitted,
  emitClockIn,
  emitWarningLetterIssued,
  emitOnboardingStepCompleted,
  emitLeaveBalanceUpdated,
  emitWeeklyCheckInSubmitted,
  getEmployeeEvents,
  getEventsByType,
};

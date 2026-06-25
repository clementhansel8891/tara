import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

/**
 * Session-aware data push gateway for TARA HR System.
 *
 * Propagates data updates (employee, attendance, leave balance) to all active
 * user sessions within 10 seconds of the underlying database mutation.
 *
 * Requirement 13.7: THE TARA_System SHALL propagate data updates to all active
 * user sessions within 10 seconds.
 *
 * Architecture:
 * - Clients connect via WebSocket namespace `/session-data`
 * - On connection, clients authenticate with their employee_id
 * - The gateway listens for domain events via @OnEvent and pushes updates
 *   to relevant connected sessions
 * - Public events (e.g. attendance announcements) are broadcast to all sessions
 * - Private events (e.g. leave balance) are sent only to the affected employee's sessions
 */
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'session-data',
})
@Injectable()
export class SessionDataPushGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SessionDataPushGateway.name);

  /**
   * Maps employee_id -> Set of socket IDs for that employee.
   * An employee can have multiple active sessions (e.g. desktop + mobile).
   */
  private readonly employeeSessions = new Map<string, Set<string>>();

  /**
   * Maps socket ID -> employee_id for reverse lookup on disconnect.
   */
  private readonly socketToEmployee = new Map<string, string>();

  // ─────────────────────────────────────────────────────────────────────────────
  // Connection lifecycle
  // ─────────────────────────────────────────────────────────────────────────────

  handleConnection(client: Socket) {
    const employeeId = client.handshake.query.employee_id as string;

    if (!employeeId) {
      this.logger.warn(
        `[SESSION_DATA] Client ${client.id} connected without employee_id — awaiting authenticate message`,
      );
      return;
    }

    this.registerSession(client.id, employeeId);
  }

  handleDisconnect(client: Socket) {
    this.unregisterSession(client.id);
  }

  /**
   * Allow late authentication via message (for clients that cannot pass
   * query params on initial connect).
   */
  @SubscribeMessage('authenticate')
  handleAuthenticate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { employee_id: string },
  ) {
    if (!payload?.employee_id) {
      client.emit('error', { message: 'employee_id is required' });
      return;
    }

    this.registerSession(client.id, payload.employee_id);
    client.emit('authenticated', {
      employee_id: payload.employee_id,
      message: 'Session registered for data push',
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Domain event listeners — push updates to sessions within 10s (Req 13.7)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Leave balance updated — push to the affected employee's sessions.
   */
  @OnEvent('leave.balance.updated')
  handleLeaveBalanceUpdated(event: any) {
    const employeeId = event?.payload?.employee_id || event?.entity?.id;
    if (!employeeId) return;

    this.pushToEmployee(employeeId, 'data:leave_balance_updated', {
      employee_id: employeeId,
      year: event.payload?.year,
      remaining_days: event.payload?.new_remaining_days ?? event.payload?.remaining_balance,
      used_days: event.payload?.new_used_days ?? event.payload?.used_days,
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Leave request approved/rejected — push to the requesting employee.
   */
  @OnEvent('leave.request.approved')
  handleLeaveRequestApproved(event: any) {
    const employeeId = event?.payload?.employee_id;
    if (!employeeId) return;

    this.pushToEmployee(employeeId, 'data:leave_request_updated', {
      leave_request_id: event.payload?.leave_request_id || event.entity?.id,
      status: 'approved',
      approved_by: event.payload?.approver_name,
      remaining_balance: event.payload?.remaining_balance,
      updated_at: new Date().toISOString(),
    });
  }

  @OnEvent('leave.request.rejected')
  handleLeaveRequestRejected(event: any) {
    const employeeId = event?.payload?.employee_id;
    if (!employeeId) return;

    this.pushToEmployee(employeeId, 'data:leave_request_updated', {
      leave_request_id: event.payload?.leave_request_id || event.entity?.id,
      status: 'rejected',
      rejection_reason: event.payload?.rejection_reason,
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Attendance clock-in — push to the employee + broadcast to all (public status update).
   */
  @OnEvent('attendance.clock_in')
  handleAttendanceClockIn(event: any) {
    const employeeId = event?.payload?.employee_id || event?.actor?.id;
    if (!employeeId) return;

    // Push to the specific employee's session(s)
    this.pushToEmployee(employeeId, 'data:attendance_updated', {
      employee_id: employeeId,
      action: 'clock_in',
      clock_in_time: event.payload?.clock_in_time,
      is_tardy: event.payload?.is_tardy,
      updated_at: new Date().toISOString(),
    });

    // Broadcast to all sessions (real-time attendance dashboard)
    this.broadcastToAll('data:attendance_status_changed', {
      employee_id: employeeId,
      employee_name: event.payload?.employee_name,
      action: 'clock_in',
      clock_in_time: event.payload?.clock_in_time,
      is_tardy: event.payload?.is_tardy,
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Attendance clock-out — push to the employee + broadcast to all.
   */
  @OnEvent('attendance.clock_out')
  handleAttendanceClockOut(event: any) {
    const employeeId = event?.payload?.employee_id || event?.actor?.id;
    if (!employeeId) return;

    this.pushToEmployee(employeeId, 'data:attendance_updated', {
      employee_id: employeeId,
      action: 'clock_out',
      clock_out_time: event.payload?.clock_out_time,
      updated_at: new Date().toISOString(),
    });

    this.broadcastToAll('data:attendance_status_changed', {
      employee_id: employeeId,
      employee_name: event.payload?.employee_name,
      action: 'clock_out',
      clock_out_time: event.payload?.clock_out_time,
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Employee data updated — push to the affected employee's sessions.
   */
  @OnEvent('employee.updated')
  handleEmployeeUpdated(event: any) {
    const employeeId = event?.payload?.employee_id || event?.entity?.id;
    if (!employeeId) return;

    this.pushToEmployee(employeeId, 'data:employee_updated', {
      employee_id: employeeId,
      changes: event.payload?.changes,
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * New employee created — broadcast to all sessions (for admin dashboards).
   */
  @OnEvent('employee.created')
  @OnEvent('hr.employee.created')
  handleEmployeeCreated(event: any) {
    const employeeId = event?.payload?.employee_id || event?.entity?.id;
    if (!employeeId) return;

    this.broadcastToAll('data:employee_created', {
      employee_id: employeeId,
      employee_name: event.payload?.full_name,
      updated_at: new Date().toISOString(),
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Internal helpers
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Push data to a specific employee's active session(s).
   */
  private pushToEmployee(employeeId: string, eventName: string, data: any): void {
    const sessions = this.employeeSessions.get(employeeId);
    if (!sessions || sessions.size === 0) {
      this.logger.debug(
        `[SESSION_DATA] No active sessions for employee ${employeeId} — skipping push`,
      );
      return;
    }

    const payload = { ...data, _pushed_at: new Date().toISOString() };
    for (const socketId of sessions) {
      try {
        this.server.to(socketId).emit(eventName, payload);
      } catch (err) {
        this.logger.error(
          `[SESSION_DATA] Failed to push to socket ${socketId}: ${err.message}`,
        );
      }
    }

    this.logger.debug(
      `[SESSION_DATA] Pushed ${eventName} to ${sessions.size} session(s) for employee ${employeeId}`,
    );
  }

  /**
   * Broadcast data to ALL active sessions.
   */
  private broadcastToAll(eventName: string, data: any): void {
    if (!this.server) return;

    const payload = { ...data, _pushed_at: new Date().toISOString() };
    this.server.emit(eventName, payload);

    this.logger.debug(
      `[SESSION_DATA] Broadcast ${eventName} to all active sessions (${this.socketToEmployee.size} total)`,
    );
  }

  /**
   * Register a socket to an employee.
   */
  private registerSession(socketId: string, employeeId: string): void {
    // Remove any existing mapping for this socket (re-auth scenario)
    this.unregisterSession(socketId);

    if (!this.employeeSessions.has(employeeId)) {
      this.employeeSessions.set(employeeId, new Set());
    }
    this.employeeSessions.get(employeeId)!.add(socketId);
    this.socketToEmployee.set(socketId, employeeId);

    this.logger.log(
      `[SESSION_DATA] Session registered: socket=${socketId}, employee=${employeeId} ` +
        `(${this.employeeSessions.get(employeeId)!.size} active sessions)`,
    );
  }

  /**
   * Unregister a socket on disconnect.
   */
  private unregisterSession(socketId: string): void {
    const employeeId = this.socketToEmployee.get(socketId);
    if (!employeeId) return;

    const sessions = this.employeeSessions.get(employeeId);
    if (sessions) {
      sessions.delete(socketId);
      if (sessions.size === 0) {
        this.employeeSessions.delete(employeeId);
      }
    }
    this.socketToEmployee.delete(socketId);

    this.logger.log(
      `[SESSION_DATA] Session unregistered: socket=${socketId}, employee=${employeeId}`,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Public API for diagnostics
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Get the number of active sessions.
   */
  getActiveSessionCount(): number {
    return this.socketToEmployee.size;
  }

  /**
   * Get sessions for a specific employee.
   */
  getSessionsForEmployee(employeeId: string): string[] {
    return Array.from(this.employeeSessions.get(employeeId) || []);
  }

  /**
   * Get all registered employee IDs with active sessions.
   */
  getConnectedEmployees(): string[] {
    return Array.from(this.employeeSessions.keys());
  }
}

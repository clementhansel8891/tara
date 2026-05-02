import type { SessionContext } from "@/core/security/session";
import type {
  DailySchedule,
  EmergencyOverride,
  ShiftSwapRequest,
} from "@/core/types/hr/scheduling";
import type { SessionContext } from "@/core/security/session";
import type {
  DailySchedule,
  EmergencyOverride,
  ShiftSwapRequest,
  Shift,
} from "@/core/types/hr/scheduling";
import { workflowService } from "@/core/services/hr/workflowService";
import { audit } from "@/core/logging/audit";
import { apiRequest } from "@/core/api/apiClient";

export const schedulingService = {
  async getDailySchedule(
    tenantId: string,
    employeeId: string,
    date: string,
    session?: SessionContext,
  ): Promise<DailySchedule | null> {
    // 1. Check for Emergency Overrides (Highest Priority)
    const allOverridesRaw = await apiRequest<any[]>(
      "/v1/hr/scheduling/overrides",
      "GET",
      session,
      undefined,
      { tenantId }
    );
    
    const overrides = (Array.isArray(allOverridesRaw) ? allOverridesRaw : []).filter((o) => {
      const oDate = new Date(o.start_date).toISOString().split('T')[0];
      return oDate === date && o.employee_id === employeeId;
    });

    if (overrides.length > 0) {
      const override = overrides[0];
      const shifts = await apiRequest<any[]>(
        "/v1/hr/scheduling/master-shifts",
        "GET",
        session,
        undefined,
        { tenantId }
      );
      const shiftRaw = shifts.find(s => s.id === override.shift_id);
      
      if (shiftRaw) {
        return {
          date,
          employeeId,
          shift: this.mapShift(shiftRaw),
          locationId: "loc-override",
          source: "OVERRIDE",
          overrideReferenceId: override.id,
        };
      }
    }

    // 2. Check for Approved Shift Swaps
    const allSwapsRaw = await apiRequest<any[]>(
      "/v1/hr/scheduling/swaps",
      "GET",
      session,
      undefined,
      { tenantId }
    );
    
    const swaps = (Array.isArray(allSwapsRaw) ? allSwapsRaw : []).filter((s) => {
      // For swaps, we might need a date field in the DB, but for now we look at status
      // Note: the backend swap model might need a 'date' field if not present.
      // Based on previous code, s.date was used.
      return (
        s.status === "APPROVED" &&
        (s.requester_id === employeeId || s.target_id === employeeId)
      );
    });

    const swappedIn = swaps.find((s) => s.target_id === employeeId);
    if (swappedIn) {
        const shifts = await apiRequest<any[]>(
          "/v1/hr/scheduling/master-shifts",
          "GET",
          session,
          undefined,
          { tenantId }
        );
        const shiftRaw = shifts.find(s => s.id === swappedIn.shift_id);
      if (shiftRaw) {
        return {
          date,
          employeeId,
          shift: this.mapShift(shiftRaw),
          locationId: "loc-swap",
          source: "SWAP",
          overrideReferenceId: swappedIn.id,
        };
      }
    }

    const swappedOut = swaps.find((s) => s.requester_id === employeeId);
    if (swappedOut) {
      return null; // I gave away my shift
    }

    // 3. Fallback to Standard Schedule Assignment
    const assignmentsRaw = await apiRequest<any[]>(
      "/v1/hr/scheduling/assignments",
      "GET",
      session,
      undefined,
      { tenantId }
    );
    const assignment = assignmentsRaw.find(a => a.employee_id === employeeId);
    
    if (assignment) {
      const dayOfWeek = new Date(date).getDay();
      const shiftRaw = assignment.shift;
      if (shiftRaw && shiftRaw.work_days.includes(dayOfWeek)) {
        return {
          date,
          employeeId,
          shift: this.mapShift(shiftRaw),
          locationId: assignment.location_id,
          source: "STANDARD",
        };
      }
    }

    return null;
  },

  async requestSwap(
    tenantId: string,
    session: SessionContext,
    targetEmployeeId: string,
    shiftId: string,
    date: string,
    reason: string,
  ) {
    const data = {
      requester_id: session.user_id,
      target_id: targetEmployeeId,
      shift_id: shiftId,
      status: "PENDING",
      reason, // Note: reason might need to be added to DB if not there
    };

    const response = await apiRequest<any>(
      "/v1/hr/scheduling/swaps",
      "POST",
      session,
      data,
      { tenantId }
    );

    // Create Workflow
    await workflowService.createRequest(tenantId, session, {
      entityType: "SHIFT_SWAP",
      entityId: response.id,
      makerDept: session.department_id,
      destinationDept: session.department_id,
      notes: `Shift Swap Request: ${reason}`,
      metadata: { date, targetEmployeeId },
    });

    return {
        id: response.id,
        tenantId: response.tenant_id,
        requesterId: response.requester_id,
        targetEmployeeId: response.target_id,
        shiftId: response.shift_id,
        date: date,
        status: response.status,
        reason: reason,
        createdAt: response.created_at,
        updatedAt: response.updated_at,
    } as ShiftSwapRequest;
  },

  async submitOverride(
    tenantId: string,
    session: SessionContext,
    absentEmployeeId: string,
    coveringEmployeeId: string,
    shiftId: string,
    date: string,
    reason: string,
  ) {
    const data = {
      employee_id: coveringEmployeeId,
      reason,
      start_date: date,
      end_date: date,
      shift_id: shiftId, // Note: shift_id needs to be in DB for override if we want to link it
    };

    const response = await apiRequest<any>(
      "/v1/hr/scheduling/overrides",
      "POST",
      session,
      data,
      { tenantId }
    );

    // Create Audit Workflow
    await workflowService.createRequest(tenantId, session, {
      entityType: "EMERGENCY_OVERRIDE",
      entityId: response.id,
      makerDept: session.department_id,
      destinationDept: "HR",
      notes: `Emergency Override: ${reason}`,
      metadata: { date, absentEmployeeId, coveringEmployeeId },
    });

    audit.log({
      tenantId,
      actorId: session.user_id,
      action: "schedule.override",
      entityType: "schedule_override",
      entityId: response.id,
      after: { coveringEmployeeId },
    });

    return {
        id: response.id,
        tenantId: response.tenant_id,
        absentEmployeeId: absentEmployeeId, // We don't store this in simple DB but keep for UI
        coveringEmployeeId: response.employee_id,
        shiftId: shiftId,
        date: date,
        reason: response.reason,
        authorizedBy: session.user_id,
        payrollImpact: true,
        createdAt: response.created_at,
        updatedAt: response.updated_at,
    } as EmergencyOverride;
  },

  mapShift(raw: any): Shift {
    return {
      id: raw.id,
      name: raw.name,
      startTime: raw.start_time,
      endTime: raw.end_time,
      breakDuration: raw.break_duration,
      flexibleWindow: raw.flexible_window,
      workDays: raw.work_days,
    };
  }
};

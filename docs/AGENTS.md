# Autonomous Agents

TARA operates 7 autonomous agents that handle HR tasks 24/7 without manual intervention. All agents can be enabled/disabled via the Settings page.

## Agent Overview

| # | Agent | Trigger | Output | SLA |
|---|-------|---------|--------|-----|
| 1 | Leave Request Agent | Employee submits leave | Validate balance → Notify supervisor → Update balance | 5 minutes |
| 2 | Absensi Agent | Clock-in/out API call | Record attendance → Detect tardiness → Trigger Late Report | Real-time |
| 3 | Clock Confirmation Agent | Event: `attendance.clock_in/out` | Send private confirmation notification | 30 seconds |
| 4 | Weekly Checkin Agent | Cron: Friday 16:00 WIB | Distribute form → Collect → Monday report | Scheduled |
| 5 | Late Report Agent | Cron: Daily 09:05 WIB | Query tardy → Public announcement + HR recap | 2 minutes |
| 6 | Onboarding Agent | New employee created | Execute 7-step workflow | 2 hours |
| 7 | Saldo Cuti Agent | Balance query / Monthly cron | Real-time balance + monthly recap | 5 seconds |

## Agent Architecture

Each agent is a NestJS `@Injectable()` service with:
- **Health check** — reports status to agent config dashboard
- **Event emission** — publishes to Event Bus after every action
- **Configuration** — reads from `agent_configs` table
- **Error handling** — logs errors, notifies HR on failure
- **Scheduled tasks** — `@Cron()` decorators for time-based execution

## Event Flow

```
User Action → Service → Event Bus → Agent(s) → Notification → User
```

Example: Clock-In
```
Employee taps Clock In
  → POST /attendance/clock-in
    → TaraAttendanceService.recordClockIn()
      → EventBus.emit('attendance.clock_in')
        → ClockConfirmationAgent listens → sends private notification
        → LateReportAgent listens → logs tardiness for daily report
        → Hermes AI consumes event (if configured)
```

## Detailed Agent Descriptions

### 1. Leave Request Agent (`leave-request.agent.ts`)
- Validates leave days against employee's LeaveBalance
- Notifies supervisor for approval within 5 minutes
- Updates balance on approval
- Supports: annual, sick, emergency, unpaid leave

### 2. Absensi Agent (`absensi.agent.ts`)
- Processes clock-in/out with GPS validation
- Calculates tardiness based on configurable threshold
- Runs status cache update every 5 minutes (07:00-18:00, Mon-Fri)
- Checks missing clock-outs at 18:00 daily

### 3. Clock Confirmation Agent (`clock-confirmation.agent.ts`)
- Listens to `attendance.clock_in` and `attendance.clock_out` events
- Sends private Indonesian-language confirmation to employee
- Includes timestamp (WIB), name, and tardiness status
- Tracks 30-second SLA compliance

### 4. Weekly Checkin Agent (`weekly-checkin.agent.ts`)
- Distributes productivity form every Friday 16:00 WIB
- Collects: accomplishments, challenges, next week goals
- Generates Monday 08:00 summary report for HR + Supervisors
- Sends reminders for non-submissions

### 5. Late Report Agent (`late-report.agent.ts`)
- Runs at 09:05 WIB (Mon-Fri), skips weekends and holidays
- Queries all tardy attendance records for the day
- Sends public announcement (all employees see who's late)
- Sends detailed recap to HR team
- If no tardiness: sends positive acknowledgment

### 6. Onboarding Agent (`onboarding.agent.ts`)
- 7-step workflow: Email → Welcome Kit → Orientation → Team Intro → Tools → SOP → Contract
- Tracks each step status (pending/in_progress/completed/failed)
- Notifies HR on completion or failure
- Target: complete within 2 hours

### 7. Saldo Cuti Agent (`saldo-cuti.agent.ts`)
- Real-time balance queries (< 5 seconds)
- Monthly recap on 1st day at 08:00 WIB
- Shows: remaining days, used days, total entitlement, upcoming leaves
- Private to requesting employee

## Configuration

Agents are configured via `Settings > Agen Otonom` or the `agent_configs` table:

```json
{
  "agent_name": "leave_request",
  "is_enabled": true,
  "configuration": { "auto_approve_sick_leave": false },
  "health_status": "healthy"
}
```

## Manual Override

All automated actions can be performed manually by HR:
- HR can approve/reject leaves directly
- HR can record attendance manually (override geo-fence)
- HR can send notifications manually
- HR can process onboarding steps manually

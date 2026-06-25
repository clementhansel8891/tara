/**
 * TARA — Default Configuration Seeder
 *
 * Seeds essential default data on first run:
 * - System settings
 * - Agent configurations for all 7 agents
 * - Hermes integration defaults
 * - Default office location
 *
 * Idempotent: uses upsert so it's safe to run multiple times.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('[SEED] Seeding default configuration...');

  // === 1. Agent Configurations (7 agents) ===
  const agents = [
    { agent_name: 'leave_request', is_enabled: true },
    { agent_name: 'absensi', is_enabled: true },
    { agent_name: 'clock_confirmation', is_enabled: true },
    { agent_name: 'weekly_checkin', is_enabled: true },
    { agent_name: 'late_report', is_enabled: true },
    { agent_name: 'onboarding', is_enabled: true },
    { agent_name: 'saldo_cuti', is_enabled: true },
  ];

  for (const agent of agents) {
    await prisma.agentConfig.upsert({
      where: { agent_name: agent.agent_name },
      update: {},
      create: {
        agent_name: agent.agent_name,
        is_enabled: agent.is_enabled,
        configuration: {},
        health_status: 'unknown',
      },
    });
  }
  console.log('[SEED] ✓ Agent configurations seeded');

  // === 2. Hermes Integration (disabled by default, ready to configure) ===
  await prisma.systemSettings.upsert({
    where: { setting_key: 'hermes_integration' },
    update: {},
    create: {
      setting_key: 'hermes_integration',
      setting_category: 'integrations',
      setting_value: {
        enabled: false,
        connection_url: '',
        api_key: '',
        webhook_secret: '',
        retry_policy: { max_retries: 3, backoff_ms: 1000 },
        agents: [],
        event_filter: [
          'attendance.clock_in',
          'attendance.clock_out',
          'attendance.tardiness_detected',
          'leave.request.submitted',
          'leave.request.approved',
          'leave.request.rejected',
          'report.tardiness_generated',
          'onboarding.workflow_completed',
        ],
      },
      description: 'Hermes Agentic AI integration configuration',
    },
  });
  console.log('[SEED] ✓ Hermes integration defaults seeded');

  // === 3. System Settings ===
  const settings = [
    {
      setting_key: 'attendance_config',
      setting_category: 'attendance',
      setting_value: {
        clock_in_threshold: '09:00',
        timezone: 'Asia/Jakarta',
        geofence_enabled: true,
        default_geofence_radius_meters: 200,
        attendance_sources: ['phone', 'aws_device'],
      },
      description: 'Attendance system configuration',
    },
    {
      setting_key: 'leave_config',
      setting_category: 'leave',
      setting_value: {
        default_annual_entitlement: 12,
        carryover_max_days: 5,
        carryover_expiry_months: 3,
        min_advance_days: 3,
        auto_balance_calculation: true,
      },
      description: 'Leave management configuration',
    },
    {
      setting_key: 'notification_config',
      setting_category: 'notification',
      setting_value: {
        channels: { in_app: true, whatsapp: false, telegram: false, email: false },
        quiet_hours: { enabled: false, start: '22:00', end: '07:00' },
      },
      description: 'Notification delivery configuration',
    },
  ];

  for (const setting of settings) {
    await prisma.systemSettings.upsert({
      where: { setting_key: setting.setting_key },
      update: {},
      create: setting,
    });
  }
  console.log('[SEED] ✓ System settings seeded');

  // === 4. Default Roles ===
  const roles = [
    { role_name: 'SuperAdmin', permissions: { all: true } },
    { role_name: 'HR_Admin', permissions: { hr: true, employees: true, reports: true } },
    { role_name: 'Supervisor', permissions: { team: true, leave_approval: true, reports: true } },
    { role_name: 'Employee', permissions: { self: true } },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { role_name: role.role_name },
      update: {},
      create: { role_name: role.role_name, permissions: role.permissions },
    });
  }
  console.log('[SEED] ✓ Default roles seeded');

  console.log('[SEED] ✓ All defaults seeded successfully');
}

main()
  .catch((e) => {
    console.error('[SEED] Error:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

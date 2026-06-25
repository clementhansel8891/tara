/**
 * Demo data for TARA — used when no database is available.
 * Simulates a fully populated HR system for PT. Maju Bersama.
 */

export const DEMO_EMPLOYEES = [
  { id: 'emp-001', employee_code: 'ADM-001', full_name: 'Sari Wulandari', email: 'sari@majubersama.com', phone: '081234567890', role: 'HR_Admin', department: 'Human Resources', office: 'Ralali Headquarter', employment_status: 'active', hire_date: '2020-03-15', language_preference: 'id', supervisor_id: null },
  { id: 'emp-002', employee_code: 'SUP-001', full_name: 'Budi Hartono', email: 'budi@majubersama.com', phone: '081234567891', role: 'Supervisor', department: 'Engineering', office: 'Ralali Headquarter', employment_status: 'active', hire_date: '2019-08-01', language_preference: 'id', supervisor_id: null },
  { id: 'emp-003', employee_code: 'EMP-001', full_name: 'Rina Permata', email: 'rina@majubersama.com', phone: '081234567892', role: 'Employee', department: 'Engineering', office: 'Ralali Headquarter', employment_status: 'active', hire_date: '2022-01-10', language_preference: 'id', supervisor_id: 'emp-002' },
  { id: 'emp-004', employee_code: 'EMP-002', full_name: 'Agus Setiawan', email: 'agus@majubersama.com', phone: '081234567893', role: 'Employee', department: 'Marketing', office: 'Ralali Headquarter', employment_status: 'active', hire_date: '2021-06-20', language_preference: 'id', supervisor_id: 'emp-002' },
  { id: 'emp-005', employee_code: 'EMP-003', full_name: 'Dewi Lestari', email: 'dewi@majubersama.com', phone: '081234567894', role: 'Employee', department: 'Finance', office: 'Cabang Bandung', employment_status: 'active', hire_date: '2023-02-14', language_preference: 'id', supervisor_id: 'emp-002' },
  { id: 'emp-006', employee_code: 'EMP-004', full_name: 'Rizky Pratama', email: 'rizky@majubersama.com', phone: '081234567895', role: 'Employee', department: 'Engineering', office: 'Ralali Headquarter', employment_status: 'active', hire_date: '2023-09-01', language_preference: 'en', supervisor_id: 'emp-002' },
];

export const DEMO_ACCOUNTS: Record<string, { password: string; employee_id: string }> = {
  'sari@majubersama.com': { password: 'demo123', employee_id: 'emp-001' },
  'budi@majubersama.com': { password: 'demo123', employee_id: 'emp-002' },
  'rina@majubersama.com': { password: 'demo123', employee_id: 'emp-003' },
  'demo@tara.com': { password: 'demo123', employee_id: 'emp-001' },
};

export const DEMO_DEPARTMENTS = [
  { id: 'dept-1', name: 'Human Resources', description: 'HR & People Operations', manager_id: 'emp-001', employees: [{ id: 'emp-001' }] },
  { id: 'dept-2', name: 'Engineering', description: 'Software Development', manager_id: 'emp-002', employees: [{ id: 'emp-002' }, { id: 'emp-003' }, { id: 'emp-006' }] },
  { id: 'dept-3', name: 'Marketing', description: 'Digital & Traditional Marketing', manager_id: null, employees: [{ id: 'emp-004' }] },
  { id: 'dept-4', name: 'Finance', description: 'Accounting & Finance', manager_id: null, employees: [{ id: 'emp-005' }] },
];

export const DEMO_ROLES = [
  { id: 'role-1', role_name: 'SuperAdmin', permissions: { all: true }, employees: [] },
  { id: 'role-2', role_name: 'HR_Admin', permissions: { manage_employees: true, manage_leaves: true, manage_settings: true, view_reports: true, issue_warnings: true }, employees: [{ id: 'emp-001' }] },
  { id: 'role-3', role_name: 'Supervisor', permissions: { approve_leaves: true, view_team_reports: true, view_attendance: true }, employees: [{ id: 'emp-002' }] },
  { id: 'role-4', role_name: 'Employee', permissions: { clock_in_out: true, request_leave: true, view_own_data: true }, employees: [{ id: 'emp-003' }, { id: 'emp-004' }, { id: 'emp-005' }, { id: 'emp-006' }] },
];

export const DEMO_OFFICES = [
  { id: 'off-1', location_name: 'Ralali Headquarter', address: 'Capital Cove Business Loft, BSD City, Jl. BSD Grand Boulevard No.26, Cilenggang, Serpong Sub-District, South Tangerang City, Banten 15310', latitude: -6.300421, longitude: 106.660355, geofence_radius_meters: 200, is_active: true },
  { id: 'off-2', location_name: 'Cabang Bandung', address: 'Jl. Asia Afrika No. 45, Bandung', latitude: -6.9175, longitude: 107.6191, geofence_radius_meters: 150, is_active: true },
];

const today = new Date().toISOString().split('T')[0];

export const DEMO_ATTENDANCE = [
  { id: 'att-1', employee_id: 'emp-001', employee_name: 'Sari Wulandari', attendance_date: today, clock_in_time: `${today}T01:55:00Z`, clock_out_time: null, clock_in_source: 'phone', is_tardy: false, tardiness_minutes: 0 },
  { id: 'att-2', employee_id: 'emp-002', employee_name: 'Budi Hartono', attendance_date: today, clock_in_time: `${today}T01:50:00Z`, clock_out_time: null, clock_in_source: 'phone', is_tardy: false, tardiness_minutes: 0 },
  { id: 'att-3', employee_id: 'emp-003', employee_name: 'Rina Permata', attendance_date: today, clock_in_time: `${today}T02:15:00Z`, clock_out_time: null, clock_in_source: 'phone', is_tardy: true, tardiness_minutes: 15 },
  { id: 'att-4', employee_id: 'emp-004', employee_name: 'Agus Setiawan', attendance_date: today, clock_in_time: `${today}T02:30:00Z`, clock_out_time: null, clock_in_source: 'aws_device', is_tardy: true, tardiness_minutes: 30 },
];

export const DEMO_LEAVE_REQUESTS = [
  { id: 'lr-1', employee_id: 'emp-003', employee_name: 'Rina Permata', leave_type: 'annual', is_paid: true, start_date: '2026-07-01', end_date: '2026-07-03', total_days: 3, reason: 'Liburan keluarga', status: 'pending', submitted_at: '2026-06-24T08:00:00Z' },
  { id: 'lr-2', employee_id: 'emp-004', employee_name: 'Agus Setiawan', leave_type: 'sick', is_paid: true, start_date: '2026-06-20', end_date: '2026-06-20', total_days: 1, reason: 'Demam', status: 'approved', submitted_at: '2026-06-19T10:00:00Z', approved_by: 'emp-002' },
  { id: 'lr-3', employee_id: 'emp-005', employee_name: 'Dewi Lestari', leave_type: 'unpaid', is_paid: false, start_date: '2026-07-10', end_date: '2026-07-14', total_days: 5, reason: 'Urusan pribadi', status: 'pending', submitted_at: '2026-06-25T07:30:00Z' },
];

export const DEMO_NOTIFICATIONS = [
  { id: 'n-1', recipient_id: 'emp-001', notification_type: 'tardiness_announcement', visibility: 'public', title: 'Laporan Keterlambatan (25 Jun 2026)', content: 'Rina Permata terlambat 15 menit, Agus Setiawan terlambat 30 menit.', is_read: false, created_at: `${today}T02:05:00Z` },
  { id: 'n-2', recipient_id: 'emp-001', notification_type: 'leave_request', visibility: 'private', title: 'Permohonan Cuti Baru', content: 'Rina Permata mengajukan cuti tahunan 3 hari (1-3 Juli 2026).', is_read: false, created_at: `${today}T01:00:00Z` },
  { id: 'n-3', recipient_id: 'emp-001', notification_type: 'system', visibility: 'private', title: 'Selamat Datang di TARA v2', content: 'Sistem TARA telah diperbarui. Semua 7 agen otonom aktif dan berjalan.', is_read: true, created_at: '2026-06-24T08:00:00Z' },
  { id: 'n-4', recipient_id: 'emp-003', notification_type: 'clock_confirmation', visibility: 'private', title: 'Konfirmasi Clock-In', content: 'Halo Rina, Anda telah clock-in pada 09:15 WIB. Anda tercatat terlambat 15 menit.', is_read: false, created_at: `${today}T02:15:00Z` },
];

export const DEMO_LEAVE_BALANCE = { remaining_days: 10, total_entitlement: 12, used_days: 2, carryover_days: 0, year: 2026 };

export const DEMO_AGENT_CONFIGS = [
  { id: 'ac-1', agent_name: 'leave_request', is_enabled: true, health_status: 'healthy', last_heartbeat_at: new Date().toISOString() },
  { id: 'ac-2', agent_name: 'absensi', is_enabled: true, health_status: 'healthy', last_heartbeat_at: new Date().toISOString() },
  { id: 'ac-3', agent_name: 'clock_confirmation', is_enabled: true, health_status: 'healthy', last_heartbeat_at: new Date().toISOString() },
  { id: 'ac-4', agent_name: 'weekly_checkin', is_enabled: true, health_status: 'healthy', last_heartbeat_at: new Date().toISOString() },
  { id: 'ac-5', agent_name: 'late_report', is_enabled: true, health_status: 'healthy', last_heartbeat_at: new Date().toISOString() },
  { id: 'ac-6', agent_name: 'onboarding', is_enabled: true, health_status: 'healthy', last_heartbeat_at: new Date().toISOString() },
  { id: 'ac-7', agent_name: 'saldo_cuti', is_enabled: true, health_status: 'healthy', last_heartbeat_at: new Date().toISOString() },
];

export const DEMO_SCHEDULES = [
  { id: 'sch-1', schedule_name: 'Shift Normal', start_time: '08:00', end_time: '17:00', break_start: '12:00', break_end: '13:00', work_days: [1, 2, 3, 4, 5], is_default: true, is_active: true, assignments: [] },
  { id: 'sch-2', schedule_name: 'Shift Pagi', start_time: '06:00', end_time: '14:00', break_start: '10:00', break_end: '10:30', work_days: [1, 2, 3, 4, 5], is_default: false, is_active: true, assignments: [] },
];

export const DEMO_LOANS = [
  { id: 'loan-1', employee_id: 'emp-003', employee: { id: 'emp-003', full_name: 'Rina Permata', employee_code: 'EMP-001' }, loan_type: 'kasbon', amount: 2000000, remaining_balance: 1500000, installment_amount: 500000, status: 'active', request_date: '2026-05-01' },
];

export const DEMO_PAYROLL_COMPONENTS = [
  { id: 'pc-1', component_name: 'BPJS Kesehatan', component_type: 'deduction', category: 'insurance', default_amount: 1, is_percentage: true, percentage_of: 'base_salary', is_mandatory: true, is_active: true },
  { id: 'pc-2', component_name: 'PPh 21', component_type: 'deduction', category: 'tax', default_amount: 5, is_percentage: true, percentage_of: 'base_salary', is_mandatory: true, is_active: true },
  { id: 'pc-3', component_name: 'Tunjangan Transport', component_type: 'addition', category: 'allowance', default_amount: 500000, is_percentage: false, is_mandatory: true, is_active: true },
  { id: 'pc-4', component_name: 'Tunjangan Makan', component_type: 'addition', category: 'allowance', default_amount: 750000, is_percentage: false, is_mandatory: true, is_active: true },
];

export const DEMO_HOLIDAYS = [
  { id: 'h-1', holiday_date: '2026-08-17', holiday_name: 'Hari Kemerdekaan RI', is_active: true },
  { id: 'h-2', holiday_date: '2026-12-25', holiday_name: 'Hari Natal', is_active: true },
  { id: 'h-3', holiday_date: '2026-01-01', holiday_name: 'Tahun Baru', is_active: true },
];

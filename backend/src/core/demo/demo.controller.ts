import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, Res } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import {
  DEMO_ACCOUNTS, DEMO_EMPLOYEES, DEMO_DEPARTMENTS, DEMO_ROLES,
  DEMO_OFFICES, DEMO_ATTENDANCE, DEMO_LEAVE_REQUESTS, DEMO_NOTIFICATIONS,
  DEMO_LEAVE_BALANCE, DEMO_AGENT_CONFIGS, DEMO_SCHEDULES, DEMO_LOANS,
  DEMO_PAYROLL_COMPONENTS, DEMO_HOLIDAYS,
} from './demo.data';

const JWT_SECRET = process.env.JWT_SECRET || 'tara-dev-secret-key-2024';

/**
 * Demo Controller — serves mock data for all TARA endpoints when no DB is available.
 * Handles all routes so the frontend can be fully explored with realistic data.
 */
@Controller()
export class DemoController {
  // === AUTH ===
  @Post('auth/login')
  login(@Body() body: { email: string; password: string }) {
    const account = DEMO_ACCOUNTS[body.email];
    if (!account || account.password !== body.password) {
      return { statusCode: 401, message: 'Invalid credentials' };
    }
    const emp = DEMO_EMPLOYEES.find(e => e.id === account.employee_id);
    const token = jwt.sign({ sub: emp.id, email: emp.email, role: emp.role, department_id: null }, JWT_SECRET, { expiresIn: '8h' });
    return { success: true, token, user: emp };
  }

  @Get('auth/me')
  getMe(@Req() req: any) {
    const emp = this.extractUser(req);
    if (!emp) return { statusCode: 401, message: 'Unauthorized' };
    return { success: true, data: emp };
  }

  // === EMPLOYEES ===
  @Get('employees')
  getEmployees() { return { success: true, data: DEMO_EMPLOYEES }; }

  @Get('employees/me')
  getMyProfile(@Req() req: any) { return { success: true, data: this.extractUser(req) || DEMO_EMPLOYEES[0] }; }

  @Get('employees/:id')
  getEmployeeById(@Param('id') id: string) {
    const emp = DEMO_EMPLOYEES.find(e => e.id === id);
    if (!emp) return { statusCode: 404, message: 'Employee not found' };
    return { success: true, data: emp };
  }

  // === ATTENDANCE ===
  @Get('attendance/dashboard')
  getAttendanceDashboard() {
    return { success: true, data: { total_employees: 6, clocked_in: 4, tardy: 2, absent: 2, clocked_out: 0, records: DEMO_ATTENDANCE } };
  }

  @Get('attendance/my-history')
  getMyAttendance() { return { success: true, data: DEMO_ATTENDANCE.slice(0, 2) }; }

  @Post('attendance/clock-in')
  clockIn(@Body() body: any) { return { success: true, data: { id: 'att-new', message: 'Clock-in recorded', timestamp: new Date().toISOString() } }; }

  @Post('attendance/clock-out')
  clockOut(@Body() body: any) { return { success: true, data: { id: 'att-new', message: 'Clock-out recorded', timestamp: new Date().toISOString() } }; }

  // === LEAVES ===
  @Get('leaves/pending')
  getPendingLeaves(@Query('status') status?: string) {
    const filtered = status ? DEMO_LEAVE_REQUESTS.filter(l => l.status === status) : DEMO_LEAVE_REQUESTS;
    return { success: true, data: filtered };
  }

  @Get('leaves/my-requests')
  getMyLeaves() { return { success: true, data: DEMO_LEAVE_REQUESTS.filter(l => l.employee_id === 'emp-003') }; }

  @Get('leaves/my-balance')
  getMyBalance() { return { success: true, data: DEMO_LEAVE_BALANCE }; }

  @Post('leaves/request')
  submitLeave(@Body() body: any) { return { success: true, data: { id: 'lr-new', status: 'pending', message: 'Leave request submitted' } }; }

  @Put('leaves/:id/approve')
  approveLeave(@Param('id') id: string) { return { success: true, data: { id, status: 'approved' } }; }

  @Put('leaves/:id/reject')
  rejectLeave(@Param('id') id: string) { return { success: true, data: { id, status: 'rejected' } }; }

  // === NOTIFICATIONS ===
  @Get('notifications/my-notifications')
  getMyNotifications(@Req() req: any) {
    const emp = this.extractUser(req);
    const notifs = emp ? DEMO_NOTIFICATIONS.filter(n => n.recipient_id === emp.id) : DEMO_NOTIFICATIONS;
    return { success: true, data: notifs };
  }

  @Get('notifications/public')
  getPublicNotifications() { return { success: true, data: DEMO_NOTIFICATIONS.filter(n => n.visibility === 'public') }; }

  // === SETTINGS ===
  @Get('settings')
  getSettings() { return { success: true, data: [] }; }

  @Get('settings/company')
  getCompanySettings() {
    return {
      success: true,
      data: {
        company_name: 'Ralali',
        legal_name: 'PT. Ralali',
        industry: 'Teknologi Informasi',
        tax_id: '',
        email: '',
        phone: '',
        website: '',
        address: 'Capital Cove Business Loft, BSD City, Jl. BSD Grand Boulevard No.26, Cilenggang, Serpong Sub-District, South Tangerang City, Banten 15310',
        founded_year: '',
        total_employees: 6,
      },
    };
  }

  @Put('settings/company')
  updateCompanySettings(@Body() body: any) {
    return { success: true, data: body, message: 'Company settings updated' };
  }

  @Get('settings/agents')
  getAgentConfigs() { return { success: true, data: DEMO_AGENT_CONFIGS }; }

  @Get('settings/:category')
  getSettingsByCategory() { return { success: true, data: [] }; }

  // === DASHBOARD STATS ===
  @Get('dashboard/stats')
  getDashboardStats() {
    const todayRecords = DEMO_ATTENDANCE;
    const totalEmployees = DEMO_EMPLOYEES.length;
    const presentToday = todayRecords.filter(a => a.clock_in_time).length;
    const lateToday = todayRecords.filter(a => a.is_tardy).length;
    const pendingLeaves = DEMO_LEAVE_REQUESTS.filter(l => l.status === 'pending').length;
    return {
      success: true,
      data: {
        total_employees: totalEmployees,
        present_today: presentToday,
        pending_leave: pendingLeaves,
        late_today: lateToday,
      },
    };
  }

  // === ADMIN ===
  @Get('admin/offices')
  getOffices() { return { success: true, data: DEMO_OFFICES }; }

  @Get('admin/offices/:id')
  getOfficeById(@Param('id') id: string) {
    const office = DEMO_OFFICES.find(o => o.id === id);
    if (!office) return { statusCode: 404, message: 'Office not found' };
    return { success: true, data: office };
  }

  @Put('admin/offices/:id')
  updateOffice(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: { ...body, id }, message: 'Office updated' };
  }

  @Get('admin/departments')
  getDepartments() { return { success: true, data: DEMO_DEPARTMENTS }; }

  @Put('admin/departments/:id')
  updateDepartment(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: { ...body, id }, message: 'Department updated' };
  }

  @Get('admin/roles')
  getRoles() { return { success: true, data: DEMO_ROLES }; }

  @Get('admin/users')
  getUsers() {
    // Return users with full details (name, department, role)
    return {
      success: true,
      data: DEMO_EMPLOYEES.map(e => ({
        id: e.id,
        employee_code: e.employee_code,
        full_name: e.full_name,
        email: e.email,
        department: e.department,
        role: e.role,
        office: e.office,
        employment_status: e.employment_status,
      })),
    };
  }

  @Get('admin/notification-channels')
  getChannels() { return { success: true, data: [{ channel: 'in_app', enabled: true }, { channel: 'whatsapp', enabled: false }, { channel: 'telegram', enabled: false }] }; }

  @Get('admin/hermes')
  getHermes() { return { success: true, data: { enabled: false, connection_url: '', agents: [], event_filter: [] } }; }

  @Get('admin/hermes/agents')
  getHermesAgents() { return { success: true, data: [] }; }

  @Get('admin/attendance-config')
  getAttConfig() { return { success: true, data: { source: 'hybrid', aws_sync_enabled: true, aws_sync_cron: '*/15 * * * *', allow_manual_override: true } }; }

  // === PAYROLL ===
  @Get('payroll/periods')
  getPayrollPeriods() { return { success: true, data: [{ id: 'pp-1', period_name: 'Juni 2026', start_date: '2026-06-01', end_date: '2026-06-30', status: 'draft' }] }; }

  @Get('payroll/components')
  getComponents() { return { success: true, data: DEMO_PAYROLL_COMPONENTS }; }

  @Get('payroll/loans')
  getLoans() { return { success: true, data: DEMO_LOANS }; }

  @Get('payroll/my-loans')
  getMyLoans() { return { success: true, data: DEMO_LOANS }; }

  @Get('payroll/my-payslips')
  getMyPayslips() { return { success: true, data: [] }; }

  @Get('payroll/schedules')
  getSchedules() { return { success: true, data: DEMO_SCHEDULES }; }

  @Get('payroll/my-schedule')
  getMySchedule() { return { success: true, data: DEMO_SCHEDULES[0] }; }

  @Get('payroll/absences')
  getAbsences() { return { success: true, data: [{ id: 'abs-1', employee: { full_name: 'Rizky Pratama' }, absence_date: '2026-06-23', absence_type: 'no_info', resolved: false }] }; }

  @Get('payroll/company-holidays')
  getCompanyHolidays() { return { success: true, data: [{ id: 'ch-1', holiday_date: '2026-06-28', holiday_name: 'Anniversary Perusahaan' }] }; }

  @Get('settings/public-holidays')
  getPublicHolidays() { return { success: true, data: DEMO_HOLIDAYS }; }

  // === SOP ===
  @Get('sop')
  getSopDocuments() {
    return {
      success: true,
      data: [
        { id: 'sop-1', title: 'SOP Pengajuan Cuti', description: 'Prosedur pengajuan cuti tahunan dan cuti khusus', category: 'HR', file_name: 'sop-cuti.pdf', file_size: 245000, mime_type: 'application/pdf', created_at: '2026-06-01T00:00:00Z', is_active: true },
        { id: 'sop-2', title: 'SOP Absensi & Kehadiran', description: 'Aturan clock-in/out dan keterlambatan', category: 'HR', file_name: 'sop-absensi.pdf', file_size: 180000, mime_type: 'application/pdf', created_at: '2026-06-05T00:00:00Z', is_active: true },
        { id: 'sop-3', title: 'SOP Onboarding Karyawan Baru', description: 'Langkah-langkah proses onboarding 7 hari', category: 'HR', file_name: 'sop-onboarding.pdf', file_size: 320000, mime_type: 'application/pdf', created_at: '2026-06-10T00:00:00Z', is_active: true },
        { id: 'sop-4', title: 'SOP Keamanan Informasi', description: 'Kebijakan keamanan data dan akses sistem', category: 'IT', file_name: 'sop-keamanan-it.pdf', file_size: 410000, mime_type: 'application/pdf', created_at: '2026-06-12T00:00:00Z', is_active: true },
        { id: 'sop-5', title: 'SOP Pengadaan Barang', description: 'Prosedur procurement dan pembelian', category: 'Operations', file_name: 'sop-pengadaan.pdf', file_size: 275000, mime_type: 'application/pdf', created_at: '2026-06-15T00:00:00Z', is_active: true },
      ],
    };
  }

  // === CATCH-ALL for any unmatched POST/PUT/DELETE ===
  @Post('*path')
  postCatchAll() { return { success: true, message: 'Demo mode: action simulated' }; }

  @Put('*path')
  putCatchAll() { return { success: true, message: 'Demo mode: update simulated' }; }

  @Delete('*path')
  deleteCatchAll() { return { success: true, message: 'Demo mode: delete simulated' }; }

  // === Helper ===
  private extractUser(req: any) {
    const authHeader = req.headers?.['authorization'];
    if (!authHeader) return DEMO_EMPLOYEES[0]; // Default to first user in demo
    try {
      const token = authHeader.replace('Bearer ', '');
      const payload = jwt.verify(token, JWT_SECRET) as any;
      return DEMO_EMPLOYEES.find(e => e.id === payload.sub) || DEMO_EMPLOYEES[0];
    } catch {
      return DEMO_EMPLOYEES[0];
    }
  }
}

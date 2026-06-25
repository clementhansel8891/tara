import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesGuard, Roles } from '../../auth/guards/roles.guard';
import { OrganizationService } from '../services/organization.service';
import { NotificationChannelService } from '../services/notification-channel.service';
import { HermesIntegrationService } from '../services/hermes-integration.service';
import { AttendanceConfigService } from '../services/attendance-config.service';

@Controller('admin')
@UseGuards(JwtGuard, RolesGuard)
@Roles('SuperAdmin', 'HR_Admin')
export class AdminSettingsController {
  constructor(
    private readonly orgService: OrganizationService,
    private readonly channelService: NotificationChannelService,
    private readonly hermesService: HermesIntegrationService,
    private readonly attendanceConfigService: AttendanceConfigService,
  ) {}

  // === Office Locations ===
  @Get('offices')
  async getOffices() { return { success: true, data: await this.orgService.getOfficeLocations() }; }

  @Post('offices')
  async createOffice(@Body() dto: any) { return { success: true, data: await this.orgService.createOfficeLocation(dto) }; }

  @Put('offices/:id')
  async updateOffice(@Param('id') id: string, @Body() dto: any) { return { success: true, data: await this.orgService.updateOfficeLocation(id, dto) }; }

  @Delete('offices/:id')
  async deleteOffice(@Param('id') id: string) { await this.orgService.deleteOfficeLocation(id); return { success: true }; }

  // === Departments ===
  @Get('departments')
  async getDepartments() { return { success: true, data: await this.orgService.getDepartments() }; }

  @Post('departments')
  async createDepartment(@Body() dto: any) { return { success: true, data: await this.orgService.createDepartment(dto) }; }

  @Put('departments/:id')
  async updateDepartment(@Param('id') id: string, @Body() dto: any) { return { success: true, data: await this.orgService.updateDepartment(id, dto) }; }

  @Delete('departments/:id')
  async deleteDepartment(@Param('id') id: string) { await this.orgService.deleteDepartment(id); return { success: true }; }

  // === Roles & Permissions ===
  @Get('roles')
  async getRoles() { return { success: true, data: await this.orgService.getRoles() }; }

  @Post('roles')
  async createRole(@Body() dto: any) { return { success: true, data: await this.orgService.createRole(dto) }; }

  @Put('roles/:id')
  async updateRole(@Param('id') id: string, @Body() dto: any) { return { success: true, data: await this.orgService.updateRole(id, dto) }; }

  @Delete('roles/:id')
  async deleteRole(@Param('id') id: string) { await this.orgService.deleteRole(id); return { success: true }; }

  @Get('roles/:id/permissions')
  async getRolePermissions(@Param('id') id: string) { return { success: true, data: await this.orgService.getRolePermissions(id) }; }

  @Put('roles/:id/permissions')
  async updatePermissions(@Param('id') id: string, @Body() dto: { permissions: Record<string, boolean> }) {
    return { success: true, data: await this.orgService.updateRolePermissions(id, dto.permissions) };
  }

  // === User Credentials ===
  @Get('users/by-role/:role')
  async getUsersByRole(@Param('role') role: string) { return { success: true, data: await this.orgService.getEmployeesByRole(role) }; }

  @Put('users/:id/credentials')
  async updateCredentials(@Param('id') id: string, @Body() dto: any) {
    return { success: true, data: await this.orgService.updateEmployeeCredentials(id, dto) };
  }

  // === Notification Channels ===
  @Get('notification-channels')
  async getChannels() { return { success: true, data: await this.channelService.getChannelConfigs() }; }

  @Put('notification-channels/:channel')
  async updateChannel(@Param('channel') channel: any, @Body() dto: any) {
    return { success: true, data: await this.channelService.updateChannelConfig(channel, dto) };
  }

  @Post('notification-channels/:channel/test')
  async testChannel(@Param('channel') channel: any) {
    return { success: true, data: await this.channelService.testChannel(channel) };
  }

  @Get('notification-rules')
  async getNotificationRules() { return { success: true, data: await this.channelService.getNotificationRules() }; }

  @Put('notification-rules')
  async updateNotificationRules(@Body() dto: { rules: any[] }) {
    return { success: true, data: await this.channelService.updateNotificationRules(dto.rules) };
  }

  // === Hermes Integration ===
  @Get('hermes')
  async getHermesConfig() { return { success: true, data: await this.hermesService.getConfig() }; }

  @Put('hermes')
  async updateHermesConfig(@Body() dto: any) { return { success: true, data: await this.hermesService.updateConfig(dto) }; }

  @Get('hermes/agents')
  async getHermesAgents() { return { success: true, data: await this.hermesService.getAgents() }; }

  @Post('hermes/agents')
  async addHermesAgent(@Body() dto: any) { return { success: true, data: await this.hermesService.addAgent(dto) }; }

  @Put('hermes/agents/:id')
  async updateHermesAgent(@Param('id') id: string, @Body() dto: any) {
    return { success: true, data: await this.hermesService.updateAgent(id, dto) };
  }

  @Delete('hermes/agents/:id')
  async removeHermesAgent(@Param('id') id: string) { await this.hermesService.removeAgent(id); return { success: true }; }

  @Post('hermes/test')
  async testHermesConnection() { return { success: true, data: await this.hermesService.testConnection() }; }

  // === Attendance Source Config ===
  @Get('attendance-config')
  async getAttendanceConfig() { return { success: true, data: await this.attendanceConfigService.getConfig() }; }

  @Put('attendance-config')
  async updateAttendanceConfig(@Body() dto: any) { return { success: true, data: await this.attendanceConfigService.updateConfig(dto) }; }
}

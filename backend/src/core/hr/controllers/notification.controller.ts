import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { NotificationService } from '../services/notification.service';
import {
  SendNotificationDto,
  SendBulkNotificationDto,
  SendPublicAnnouncementDto,
} from '../dto/send-notification.dto';

/**
 * NotificationController for TARA HR System
 * 
 * Implements Task 13.1: Notification endpoints
 * Requirements: 9.1, 9.2, 9.3
 * 
 * Endpoints:
 * - POST /notifications/send - Send single notification (HR Team only)
 * - POST /notifications/bulk - Send bulk notifications (HR Team only)
 * - POST /notifications/announcement - Send public announcement (HR Team only)
 * - GET /notifications/my - Get employee's notifications
 * - PATCH /notifications/:id/read - Mark notification as read
 * - PATCH /notifications/read-all - Mark all notifications as read
 * - GET /notifications/unread-count - Get unread count
 */
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Send a single notification
   * Access: HR Team only
   * 
   * POST /notifications/send
   */
  @Post('send')
  @HttpCode(HttpStatus.CREATED)
  async sendNotification(@Body() dto: SendNotificationDto) {
    return this.notificationService.sendNotification({
      recipient_id: dto.recipient_id,
      type: dto.type,
      visibility: dto.visibility,
      title: dto.title,
      content: dto.content,
      metadata: dto.metadata,
    });
  }

  /**
   * Send bulk notifications to multiple recipients
   * Access: HR Team only
   * 
   * POST /notifications/bulk
   */
  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  async sendBulkNotification(@Body() dto: SendBulkNotificationDto) {
    return this.notificationService.sendBulkNotification({
      recipient_ids: dto.recipient_ids,
      type: dto.type,
      visibility: dto.visibility,
      title: dto.title,
      content: dto.content,
      metadata: dto.metadata,
    });
  }

  /**
   * Send public announcement to all employees
   * Access: HR Team only
   * 
   * POST /notifications/announcement
   */
  @Post('announcement')
  @HttpCode(HttpStatus.CREATED)
  async sendPublicAnnouncement(@Body() dto: SendPublicAnnouncementDto) {
    return this.notificationService.sendPublicAnnouncement({
      type: dto.type,
      title: dto.title,
      content: dto.content,
      metadata: dto.metadata,
      exclude_ids: dto.exclude_ids,
    });
  }

  /**
   * Get notifications for the authenticated employee
   * Access: All authenticated employees
   * 
   * GET /notifications/my?page=1&limit=20&unread_only=false
   */
  @Get('my')
  async getMyNotifications(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('unread_only') unreadOnly?: string,
  ) {
    const employeeId = req.user?.employee_id || req.user?.id;

    return this.notificationService.getNotifications(employeeId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      unread_only: unreadOnly === 'true',
    });
  }

  /**
   * Mark a notification as read
   * Access: Notification recipient only
   * 
   * PATCH /notifications/:id/read
   */
  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Param('id') notificationId: string, @Request() req: any) {
    const employeeId = req.user?.employee_id || req.user?.id;

    return this.notificationService.markAsRead(notificationId, employeeId);
  }

  /**
   * Mark all notifications as read for the authenticated employee
   * Access: All authenticated employees
   * 
   * PATCH /notifications/read-all
   */
  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Request() req: any) {
    const employeeId = req.user?.employee_id || req.user?.id;

    const count = await this.notificationService.markAllAsRead(employeeId);

    return {
      message: 'All notifications marked as read',
      count,
    };
  }

  /**
   * Get unread notification count for the authenticated employee
   * Access: All authenticated employees
   * 
   * GET /notifications/unread-count
   */
  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    const employeeId = req.user?.employee_id || req.user?.id;

    const count = await this.notificationService.getUnreadCount(employeeId);

    return {
      count,
    };
  }
}

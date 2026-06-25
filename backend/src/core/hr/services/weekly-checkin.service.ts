import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';
import { EventBusService } from './event-bus.service';

/**
 * WeeklyCheckinService for TARA HR System
 *
 * Handles weekly productivity check-in submissions. Each check-in captures the
 * three standard questions for a given week:
 *   - weekly accomplishments
 *   - challenges
 *   - next week's goals
 *
 * Responses are persisted in the WeeklyCheckin table, which enforces a UNIQUE
 * constraint on (employee_id, week_start_date) so an employee can only submit a
 * single check-in per week. On submission an event is emitted to the Event Bus
 * for downstream consumers (e.g. the Weekly Checkin Agent reporting pipeline).
 *
 * Requirements:
 * - 4.2: Store check-in responses with Employee ID and timestamp
 * - 4.5: Include questions about weekly accomplishments, challenges, and next week's goals
 *
 * Task: 15.1
 */
@Injectable()
export class WeeklyCheckinService {
  private readonly logger = new Logger(WeeklyCheckinService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBusService: EventBusService,
  ) {}

  /**
   * Submit a weekly check-in for an employee.
   *
   * Stores the responses to the three standard check-in questions
   * (accomplishments, challenges, next week's goals) for the given week.
   * The (employee_id, week_start_date) pair is unique, so a second submission
   * for the same week is rejected.
   *
   * Requirements:
   * - 4.2: Persist responses with Employee ID and submission timestamp
   * - 4.5: Capture accomplishments, challenges, and next week's goals
   *
   * @param data.employee_id - ID of the employee submitting the check-in
   * @param data.week_start_date - Monday (start) of the check-in week
   * @param data.accomplishments - Response: what was accomplished this week
   * @param data.challenges - Response: challenges faced this week
   * @param data.next_week_goals - Response: goals for next week
   * @returns The created WeeklyCheckin record
   * @throws BadRequestException if the employee does not exist or a check-in
   *         already exists for the given week
   */
  async submitCheckin(data: {
    employee_id: string;
    week_start_date: Date;
    accomplishments?: string;
    challenges?: string;
    next_week_goals?: string;
  }): Promise<any> {
    const { employee_id, accomplishments, challenges, next_week_goals } = data;

    if (!employee_id) {
      throw new BadRequestException('employee_id is required');
    }

    if (!data.week_start_date) {
      throw new BadRequestException('week_start_date is required');
    }

    // Normalize to a date-only value (drop time component) so the UNIQUE
    // constraint on (employee_id, week_start_date) behaves predictably.
    const week_start_date = this.normalizeToDate(data.week_start_date);

    this.logger.log(
      `Processing weekly check-in for employee ${employee_id}, week starting ${this.formatDate(
        week_start_date,
      )}`,
    );

    // Validate the employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: employee_id },
      select: {
        id: true,
        full_name: true,
        department_id: true,
      },
    });

    if (!employee) {
      throw new BadRequestException(`Employee not found: ${employee_id}`);
    }

    // Reject duplicate submissions for the same week (UNIQUE constraint)
    const existing = await this.prisma.weeklyCheckin.findUnique({
      where: {
        employee_id_week_start_date: {
          employee_id,
          week_start_date,
        },
      },
    });

    if (existing) {
      this.logger.warn(
        `Duplicate weekly check-in for employee ${employee_id}, week ${this.formatDate(
          week_start_date,
        )}`,
      );
      throw new BadRequestException(
        `A weekly check-in has already been submitted for the week starting ${this.formatDate(
          week_start_date,
        )}.`,
      );
    }

    let checkin: any;
    try {
      checkin = await this.prisma.weeklyCheckin.create({
        data: {
          employee_id,
          week_start_date,
          accomplishments: accomplishments ?? null,
          challenges: challenges ?? null,
          next_week_goals: next_week_goals ?? null,
          submitted_at: new Date(),
        },
      });
    } catch (error: any) {
      // Handle race condition where the unique constraint fires between the
      // existence check above and the insert (Prisma error code P2002).
      if (error?.code === 'P2002') {
        throw new BadRequestException(
          `A weekly check-in has already been submitted for the week starting ${this.formatDate(
            week_start_date,
          )}.`,
        );
      }
      this.logger.error(
        `Failed to create weekly check-in for employee ${employee_id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }

    this.logger.log(
      `Weekly check-in created: ID ${checkin.id} for employee ${employee_id}`,
    );

    // Emit event to the Event Bus for downstream consumers (reporting pipeline)
    try {
      await this.eventBusService.emit({
        event_type: 'checkin.response.submitted',
        event_version: '1.0',
        actor: {
          id: employee_id,
          type: 'employee',
        },
        entity: {
          id: checkin.id,
          type: 'weekly_checkin',
        },
        payload: {
          checkin_id: checkin.id,
          employee_id: checkin.employee_id,
          employee_name: employee.full_name,
          week_start_date: this.formatDate(checkin.week_start_date),
          accomplishments: checkin.accomplishments,
          challenges: checkin.challenges,
          next_week_goals: checkin.next_week_goals,
          submitted_at: checkin.submitted_at.toISOString(),
        },
        metadata: {
          department_id: employee.department_id,
        },
      });

      this.logger.log(
        `Event emitted: checkin.response.submitted for check-in ${checkin.id}`,
      );
    } catch (error: any) {
      // Don't fail the submission if the event can't be emitted; it can be retried.
      this.logger.error(
        `Failed to emit checkin.response.submitted event: ${error.message}`,
        error.stack,
      );
    }

    return checkin;
  }

  /**
   * Retrieve a single weekly check-in for an employee and week.
   *
   * @param employee_id - ID of the employee
   * @param week_start_date - Start (Monday) of the check-in week
   * @returns The WeeklyCheckin record or null if none exists
   */
  async getCheckin(
    employee_id: string,
    week_start_date: Date,
  ): Promise<any | null> {
    return this.prisma.weeklyCheckin.findUnique({
      where: {
        employee_id_week_start_date: {
          employee_id,
          week_start_date: this.normalizeToDate(week_start_date),
        },
      },
    });
  }

  /**
   * List weekly check-ins for an employee, most recent first.
   *
   * @param employee_id - ID of the employee
   * @param options - Optional pagination (limit, offset)
   * @returns Array of WeeklyCheckin records
   */
  async getCheckinsForEmployee(
    employee_id: string,
    options?: { limit?: number; offset?: number },
  ): Promise<any[]> {
    return this.prisma.weeklyCheckin.findMany({
      where: { employee_id },
      orderBy: { week_start_date: 'desc' },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    });
  }

  /**
   * Normalize a date to midnight (date-only) so that time components don't
   * affect the UNIQUE constraint on (employee_id, week_start_date).
   */
  private normalizeToDate(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }

  /**
   * Format a date as YYYY-MM-DD.
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

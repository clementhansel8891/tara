import { describe, it, expect } from 'vitest';
import {
  mapToScheduledShift,
  mapToAvailableStaff,
  type WorkShiftLike,
} from './consumer-contracts';
import { Employee } from '../entities/employee.entity';

function makeEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: 'emp-1',
    tenant_id: 'tnt-1',
    employee_code: 'E001',
    first_name: 'Ada',
    last_name: 'Lovelace',
    full_name: 'Ada Lovelace',
    email: 'ada@example.com',
    department_id: 'dep-1',
    position: 'Cashier',
    role_title: 'Senior Cashier',
    status: 'active',
    employment_type: 'full_time',
    hire_date: new Date('2020-01-01T00:00:00Z'),
    created_at: new Date('2020-01-01T00:00:00Z'),
    updated_at: new Date('2020-01-01T00:00:00Z'),
    ...overrides,
  } as Employee;
}

function makeShift(overrides: Partial<WorkShiftLike> = {}): WorkShiftLike {
  return {
    id: 'shift-1',
    employee_id: 'emp-1',
    // Wednesday in UTC (2024-01-03 is a Wednesday => dayOfWeek 3)
    start_time: new Date('2024-01-03T09:05:00Z'),
    end_time: new Date('2024-01-03T17:30:00Z'),
    ...overrides,
  };
}

describe('mapToScheduledShift', () => {
  it('projects all ScheduledShift fields with correct names', () => {
    const result = mapToScheduledShift(makeShift(), makeEmployee());

    expect(result).toEqual({
      id: 'shift-1',
      employeeId: 'emp-1',
      name: 'Ada Lovelace',
      role: 'Senior Cashier',
      startTime: '09:05',
      endTime: '17:30',
      dayOfWeek: 3,
      status: 'draft',
    });
  });

  it('formats startTime/endTime as zero-padded "HH:mm" in UTC', () => {
    const result = mapToScheduledShift(
      makeShift({
        start_time: new Date('2024-01-03T00:00:00Z'),
        end_time: new Date('2024-01-03T08:09:00Z'),
      }),
    );
    expect(result.startTime).toBe('00:00');
    expect(result.endTime).toBe('08:09');
  });

  it('derives dayOfWeek (0-6) from the shift start time', () => {
    // 2024-01-07 is a Sunday => 0
    const sunday = mapToScheduledShift(
      makeShift({ start_time: new Date('2024-01-07T10:00:00Z') }),
    );
    expect(sunday.dayOfWeek).toBe(0);
    // 2024-01-06 is a Saturday => 6
    const saturday = mapToScheduledShift(
      makeShift({ start_time: new Date('2024-01-06T10:00:00Z') }),
    );
    expect(saturday.dayOfWeek).toBe(6);
  });

  it('maps APPROVED/PUBLISHED status (any casing) to "published"', () => {
    expect(mapToScheduledShift(makeShift({ status: 'APPROVED' })).status).toBe(
      'published',
    );
    expect(mapToScheduledShift(makeShift({ status: 'published' })).status).toBe(
      'published',
    );
    expect(
      mapToScheduledShift(makeShift({ schedule_status: 'APPROVED' })).status,
    ).toBe('published');
  });

  it('maps any other / missing status to "draft"', () => {
    expect(mapToScheduledShift(makeShift({ status: 'DRAFT' })).status).toBe('draft');
    expect(mapToScheduledShift(makeShift({})).status).toBe('draft');
    expect(
      mapToScheduledShift(makeShift({ schedule_status: 'PENDING' })).status,
    ).toBe('draft');
  });

  it('prefers shift status over the schedule status when both present', () => {
    const result = mapToScheduledShift(
      makeShift({ status: 'APPROVED', schedule_status: 'DRAFT' }),
    );
    expect(result.status).toBe('published');
  });

  it('falls back to first_name + last_name when full_name is empty', () => {
    const result = mapToScheduledShift(
      makeShift(),
      makeEmployee({ full_name: '' }),
    );
    expect(result.name).toBe('Ada Lovelace');
  });

  it('falls back to position when role_title is empty', () => {
    const result = mapToScheduledShift(
      makeShift(),
      makeEmployee({ role_title: '' }),
    );
    expect(result.role).toBe('Cashier');
  });

  it('yields empty name/role when no employee is supplied', () => {
    const result = mapToScheduledShift(makeShift());
    expect(result.name).toBe('');
    expect(result.role).toBe('');
  });

  it('accepts ISO string timestamps as well as Date instances', () => {
    const result = mapToScheduledShift(
      makeShift({
        start_time: '2024-01-03T09:05:00Z',
        end_time: '2024-01-03T17:30:00Z',
      }),
    );
    expect(result.startTime).toBe('09:05');
    expect(result.endTime).toBe('17:30');
    expect(result.dayOfWeek).toBe(3);
  });
});

describe('mapToAvailableStaff (regression alongside ScheduledShift)', () => {
  it('projects id/name/role', () => {
    expect(mapToAvailableStaff(makeEmployee())).toEqual({
      id: 'emp-1',
      name: 'Ada Lovelace',
      role: 'Senior Cashier',
    });
  });
});

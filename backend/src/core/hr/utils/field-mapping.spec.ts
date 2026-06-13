import { describe, it, expect } from 'vitest';
import {
  mapToColumns,
  mapEmployeeFieldsToColumns,
  mapWorkScheduleFieldsToColumns,
  mapWorkShiftFieldsToColumns,
  mapPayrollRunFieldsToColumns,
} from './field-mapping';

describe('mapToColumns (generic field-mapping discipline)', () => {
  const aliasMap = { camelKey: 'snake_key' };
  const allowed = ['snake_key', 'plain'];

  it('renames aliased keys to their schema column', () => {
    expect(mapToColumns({ camelKey: 1 }, aliasMap, allowed)).toEqual({
      snake_key: 1,
    });
  });

  it('keeps allowed columns that need no alias', () => {
    expect(mapToColumns({ plain: 'v' }, aliasMap, allowed)).toEqual({
      plain: 'v',
    });
  });

  it('drops keys that are not real columns', () => {
    expect(mapToColumns({ unknown: 'x', plain: 'v' }, aliasMap, allowed)).toEqual({
      plain: 'v',
    });
  });

  it('skips undefined values (partial-update semantics)', () => {
    expect(
      mapToColumns({ plain: undefined, snake_key: 2 }, aliasMap, allowed),
    ).toEqual({ snake_key: 2 });
  });

  it('preserves null and falsy values that are explicitly supplied', () => {
    expect(mapToColumns({ plain: null, snake_key: 0 }, aliasMap, allowed)).toEqual({
      plain: null,
      snake_key: 0,
    });
  });

  it('returns an empty object for nullish input', () => {
    expect(mapToColumns(undefined, aliasMap, allowed)).toEqual({});
    expect(mapToColumns(null, aliasMap, allowed)).toEqual({});
  });
});

describe('mapEmployeeFieldsToColumns', () => {
  it('maps compatibility aliases to schema columns', () => {
    const result = mapEmployeeFieldsToColumns({
      job_title: 'Barista',
      position_id: 'role-123',
      documents_metadata: { a: 1 },
    });
    expect(result).toEqual({
      positions: 'Barista',
      job_role_id: 'role-123',
      document_metadata: { a: 1 },
    });
  });

  it('drops fields with no backing column (full_name, currency, role_title duplicates aside)', () => {
    const result = mapEmployeeFieldsToColumns({
      first_name: 'Ada',
      full_name: 'Ada Lovelace',
      currency: 'USD',
    });
    expect(result).toEqual({ first_name: 'Ada' });
    expect(result).not.toHaveProperty('full_name');
    expect(result).not.toHaveProperty('currency');
  });

  it('maps role_title and position aliases to the positions column', () => {
    expect(mapEmployeeFieldsToColumns({ role_title: 'Manager' })).toEqual({
      positions: 'Manager',
    });
    expect(mapEmployeeFieldsToColumns({ position: 'Cashier' })).toEqual({
      positions: 'Cashier',
    });
  });

  it('passes through correctly named columns unchanged', () => {
    const result = mapEmployeeFieldsToColumns({
      tenant_id: 't1',
      employee_code: 'E-1',
      base_salary: 1000,
      status: 'active',
    });
    expect(result).toEqual({
      tenant_id: 't1',
      employee_code: 'E-1',
      base_salary: 1000,
      status: 'active',
    });
  });
});

describe('mapWorkScheduleFieldsToColumns', () => {
  it('maps createdBy alias to created_by', () => {
    expect(
      mapWorkScheduleFieldsToColumns({ createdBy: 'u-1', name: 'Week 1' }),
    ).toEqual({ created_by: 'u-1', name: 'Week 1' });
  });
});

describe('mapWorkShiftFieldsToColumns', () => {
  it('maps scheduleId/roleId camelCase aliases to schema columns', () => {
    const result = mapWorkShiftFieldsToColumns({
      scheduleId: 'sch-1',
      roleId: 'role-1',
      employee_id: 'emp-1',
    });
    expect(result).toEqual({
      schedule_id: 'sch-1',
      role_id: 'role-1',
      employee_id: 'emp-1',
    });
  });
});

describe('mapPayrollRunFieldsToColumns', () => {
  it('maps camelCase entity fields to snake_case columns', () => {
    const result = mapPayrollRunFieldsToColumns({
      totalGrossPay: 5000,
      totalNetPay: 4200,
      baseCurrency: 'IDR',
      status: 'DRAFT',
    });
    expect(result).toEqual({
      total_gross_pay: 5000,
      total_net_pay: 4200,
      base_currency: 'IDR',
      status: 'DRAFT',
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { AwsDeviceMappingService } from './aws-device-mapping.service';

describe('AwsDeviceMappingService', () => {
  let service: AwsDeviceMappingService;
  let mockPrisma: any;
  let mockEventBus: any;

  beforeEach(() => {
    mockPrisma = {
      employee: {
        findUnique: vi.fn(),
      },
      aWSDeviceMapping: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };

    mockEventBus = {
      emit: vi.fn().mockResolvedValue(undefined),
    };

    service = new AwsDeviceMappingService(mockPrisma, mockEventBus);
  });

  describe('createMapping', () => {
    const validData = {
      aws_employee_id: 'AWS-001',
      tara_employee_id: 'tara-uuid-1',
      aws_device_id: 'DEVICE-A',
      is_active: true,
    };

    const mockEmployee = {
      id: 'tara-uuid-1',
      full_name: 'John Doe',
      employee_code: 'EMP-001',
    };

    it('should create a mapping when employee exists and no duplicates', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(mockEmployee);
      mockPrisma.aWSDeviceMapping.findUnique
        .mockResolvedValueOnce(null) // aws_employee_id check
        .mockResolvedValueOnce(null); // tara_employee_id check
      mockPrisma.aWSDeviceMapping.create.mockResolvedValue({
        id: 'mapping-1',
        ...validData,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await service.createMapping(validData, 'actor-1');

      expect(result.id).toBe('mapping-1');
      expect(result.aws_employee_id).toBe('AWS-001');
      expect(result.tara_employee_id).toBe('tara-uuid-1');
      expect(mockPrisma.employee.findUnique).toHaveBeenCalledWith({
        where: { id: 'tara-uuid-1' },
      });
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({ event_type: 'aws_device_mapping.created' }),
      );
    });

    it('should reject when tara_employee_id does not reference a real employee', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(null);

      await expect(
        service.createMapping(validData, 'actor-1'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.createMapping(validData, 'actor-1'),
      ).rejects.toThrow(/Employee does not exist/);
    });

    it('should reject when aws_employee_id already exists', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(mockEmployee);
      mockPrisma.aWSDeviceMapping.findUnique.mockResolvedValueOnce({
        id: 'existing-mapping',
        aws_employee_id: 'AWS-001',
      });

      await expect(
        service.createMapping(validData, 'actor-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject when tara_employee_id already has a mapping', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(mockEmployee);
      mockPrisma.aWSDeviceMapping.findUnique
        .mockResolvedValueOnce(null) // aws_employee_id ok
        .mockResolvedValueOnce({
          id: 'existing-mapping',
          tara_employee_id: 'tara-uuid-1',
          aws_employee_id: 'AWS-OTHER',
        }); // tara_employee_id conflict

      await expect(
        service.createMapping(validData, 'actor-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('should default is_active to true if not provided', async () => {
      const dataWithoutActive = {
        aws_employee_id: 'AWS-002',
        tara_employee_id: 'tara-uuid-2',
      };

      mockPrisma.employee.findUnique.mockResolvedValue({ id: 'tara-uuid-2' });
      mockPrisma.aWSDeviceMapping.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      mockPrisma.aWSDeviceMapping.create.mockResolvedValue({
        id: 'mapping-2',
        ...dataWithoutActive,
        aws_device_id: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await service.createMapping(dataWithoutActive, 'actor-1');
      expect(result.is_active).toBe(true);
      expect(mockPrisma.aWSDeviceMapping.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ is_active: true }),
      });
    });
  });

  describe('listMappings', () => {
    it('should list all mappings without filters', async () => {
      const mockMappings = [
        { id: 'mapping-1', aws_employee_id: 'AWS-001' },
        { id: 'mapping-2', aws_employee_id: 'AWS-002' },
      ];
      mockPrisma.aWSDeviceMapping.findMany.mockResolvedValue(mockMappings);

      const result = await service.listMappings();

      expect(result).toEqual(mockMappings);
      expect(mockPrisma.aWSDeviceMapping.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          employee: {
            select: { id: true, full_name: true, employee_code: true, email: true },
          },
        },
        orderBy: { created_at: 'desc' },
      });
    });

    it('should filter by is_active', async () => {
      mockPrisma.aWSDeviceMapping.findMany.mockResolvedValue([]);

      await service.listMappings({ is_active: true });

      expect(mockPrisma.aWSDeviceMapping.findMany).toHaveBeenCalledWith({
        where: { is_active: true },
        include: expect.any(Object),
        orderBy: { created_at: 'desc' },
      });
    });
  });

  describe('getMappingById', () => {
    it('should return a mapping when found', async () => {
      const mockMapping = { id: 'mapping-1', aws_employee_id: 'AWS-001' };
      mockPrisma.aWSDeviceMapping.findUnique.mockResolvedValue(mockMapping);

      const result = await service.getMappingById('mapping-1');

      expect(result).toEqual(mockMapping);
    });

    it('should throw NotFoundException when mapping does not exist', async () => {
      mockPrisma.aWSDeviceMapping.findUnique.mockResolvedValue(null);

      await expect(service.getMappingById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getMappingByAwsEmployeeId', () => {
    it('should return a mapping when found', async () => {
      const mockMapping = { id: 'mapping-1', aws_employee_id: 'AWS-001' };
      mockPrisma.aWSDeviceMapping.findUnique.mockResolvedValue(mockMapping);

      const result = await service.getMappingByAwsEmployeeId('AWS-001');

      expect(result).toEqual(mockMapping);
      expect(mockPrisma.aWSDeviceMapping.findUnique).toHaveBeenCalledWith({
        where: { aws_employee_id: 'AWS-001' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException for unknown aws_employee_id', async () => {
      mockPrisma.aWSDeviceMapping.findUnique.mockResolvedValue(null);

      await expect(
        service.getMappingByAwsEmployeeId('UNKNOWN'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateMapping', () => {
    const existingMapping = {
      id: 'mapping-1',
      aws_employee_id: 'AWS-001',
      tara_employee_id: 'tara-uuid-1',
      aws_device_id: 'DEVICE-A',
      is_active: true,
    };

    it('should update a mapping successfully', async () => {
      mockPrisma.aWSDeviceMapping.findUnique.mockResolvedValue(existingMapping);
      mockPrisma.aWSDeviceMapping.update.mockResolvedValue({
        ...existingMapping,
        is_active: false,
        updated_at: new Date(),
      });

      const result = await service.updateMapping(
        'mapping-1',
        { is_active: false },
        'actor-1',
      );

      expect(result.is_active).toBe(false);
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({ event_type: 'aws_device_mapping.updated' }),
      );
    });

    it('should throw NotFoundException for non-existent mapping', async () => {
      mockPrisma.aWSDeviceMapping.findUnique.mockResolvedValue(null);

      await expect(
        service.updateMapping('nonexistent', { is_active: false }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should validate new tara_employee_id references a real employee', async () => {
      mockPrisma.aWSDeviceMapping.findUnique.mockResolvedValue(existingMapping);
      mockPrisma.employee.findUnique.mockResolvedValue(null);

      await expect(
        service.updateMapping('mapping-1', {
          tara_employee_id: 'invalid-uuid',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject conflicting aws_employee_id update', async () => {
      mockPrisma.aWSDeviceMapping.findUnique
        .mockResolvedValueOnce(existingMapping) // existing mapping
        .mockResolvedValueOnce({ id: 'other-mapping', aws_employee_id: 'AWS-999' }); // duplicate check

      // The second findUnique for tara_employee_id is not called because we're only changing aws_employee_id
      mockPrisma.employee.findUnique.mockResolvedValue(null); // not needed in this path

      await expect(
        service.updateMapping('mapping-1', { aws_employee_id: 'AWS-999' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deleteMapping', () => {
    const existingMapping = {
      id: 'mapping-1',
      aws_employee_id: 'AWS-001',
      tara_employee_id: 'tara-uuid-1',
    };

    it('should delete a mapping successfully', async () => {
      mockPrisma.aWSDeviceMapping.findUnique.mockResolvedValue(existingMapping);
      mockPrisma.aWSDeviceMapping.delete.mockResolvedValue(existingMapping);

      const result = await service.deleteMapping('mapping-1', 'actor-1');

      expect(result.success).toBe(true);
      expect(mockPrisma.aWSDeviceMapping.delete).toHaveBeenCalledWith({
        where: { id: 'mapping-1' },
      });
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({ event_type: 'aws_device_mapping.deleted' }),
      );
    });

    it('should throw NotFoundException for non-existent mapping', async () => {
      mockPrisma.aWSDeviceMapping.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteMapping('nonexistent', 'actor-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

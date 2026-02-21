import type { TrainingAssignment, TrainingProgram } from "@/core/types/hr/training";
import { prisma } from "@/core/persistence/database/client";
// Triggering IDE type refresh

/**
 * Mapping helper for Training Program
 */
const mapToProgram = (db: any): TrainingProgram => ({
  id: db.id,
  tenantId: db.companyId,
  name: db.name,
  status: db.status as any,
  completionRate: db.completionRate,
  dueDate: db.dueDate?.toISOString().split('T')[0],
  createdAt: db.createdAt.toISOString(),
  updatedAt: db.updatedAt.toISOString(),
} as TrainingProgram);

/**
 * Mapping helper for Training Assignment
 */
const mapToAssignment = (db: any): TrainingAssignment => ({
  id: db.id,
  tenantId: db.companyId,
  programId: db.programId,
  employeeId: db.employeeId,
  status: db.status as any,
  assignedAt: db.assignedAt.toISOString().split('T')[0],
  createdAt: db.createdAt.toISOString(),
  updatedAt: db.updatedAt.toISOString(),
} as TrainingAssignment);

export const trainingRepo = {
  /**
   * Programs
   */
  async listPrograms(tenantId: string): Promise<TrainingProgram[]> {
    const list = await prisma.trainingProgram.findMany({
      where: { companyId: tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return list.map(mapToProgram);
  },

  async createProgram(
    tenantId: string,
    payload: Omit<TrainingProgram, "id" | "tenantId" | "createdAt" | "updatedAt">,
  ): Promise<TrainingProgram> {
    const record = await prisma.trainingProgram.create({
      data: {
        companyId: tenantId,
        name: payload.name,
        status: payload.status,
        completionRate: payload.completionRate,
        dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
      },
    });
    return mapToProgram(record);
  },

  /**
   * Assignments
   */
  async listAssignments(tenantId: string): Promise<TrainingAssignment[]> {
    const list = await prisma.trainingAssignment.findMany({
      where: { companyId: tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return list.map(mapToAssignment);
  },

  async assignTraining(
    tenantId: string,
    payload: Omit<TrainingAssignment, "id" | "tenantId" | "createdAt" | "updatedAt">,
  ): Promise<TrainingAssignment> {
    const record = await prisma.trainingAssignment.create({
      data: {
        companyId: tenantId,
        programId: payload.programId,
        employeeId: payload.employeeId,
        status: payload.status,
        assignedAt: new Date(payload.assignedAt),
      },
    });
    return mapToAssignment(record);
  },

  async updateAssignment(
    tenantId: string,
    assignmentId: string,
    patch: Partial<TrainingAssignment>,
  ): Promise<TrainingAssignment | null> {
    const data: any = {};
    if (patch.status) data.status = patch.status;
    
    const updated = await prisma.trainingAssignment.update({
      where: {
        id: assignmentId,
        companyId: tenantId,
      },
      data,
    });
    
    return mapToAssignment(updated);
  },
};

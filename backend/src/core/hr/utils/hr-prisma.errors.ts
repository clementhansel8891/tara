import { BadRequestException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

/**
 * Maps Prisma FK constraint errors (P2003) to human-readable domain errors.
 * Call this inside a catch block in repository methods.
 */
export function handlePrismaFkError(error: unknown, context?: string): never {
  if (error instanceof PrismaClientKnownRequestError) {
    if (error.code === 'P2003') {
      const field = (error.meta?.field_name as string) ?? 'unknown field';
      const entity = context ? `[${context}] ` : '';
      throw new BadRequestException(
        `${entity}Invalid reference: '${field}' points to a non-existent record.`,
      );
    }
    if (error.code === 'P2025') {
      const entity = context ? `[${context}] ` : '';
      throw new BadRequestException(
        `${entity}Record not found or already deleted.`,
      );
    }
  }
  throw error;
}

/**
 * Lightweight existence check before a Prisma write.
 * Throws BadRequestException early, before hitting the DB FK constraint.
 */
export async function assertExists<T>(
  finder: () => Promise<T | null>,
  fieldName: string,
  id: string,
): Promise<void> {
  const result = await finder();
  if (!result) {
    throw new BadRequestException(
      `Invalid reference: '${fieldName}' with id '${id}' does not exist.`,
    );
  }
}

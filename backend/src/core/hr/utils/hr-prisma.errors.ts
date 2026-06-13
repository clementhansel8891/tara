import {
  BadRequestException,
  ConflictException,
  HttpException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

/**
 * Typed error surface for the HR module.
 *
 * Goal (Requirements 1.1, 1.3, 1.4): no validation, lookup, or business-rule
 * failure should ever escape as an HTTP 500. Service and repository code throws
 * the NestJS HTTP exceptions re-exported below instead of bare `throw new Error(...)`,
 * and Prisma errors are mapped to the correct 4xx status by `mapPrismaError`.
 *
 * Prisma error code mapping:
 *   - P2025 (record not found)            -> 404 NotFoundException
 *   - P2002 (unique constraint violation) -> 409 ConflictException
 *   - P2003 (foreign key violation)       -> 400 BadRequestException
 *   - P2000 (value too long for column)   -> 400 BadRequestException
 *   - anything else                       -> log then 500 (last resort only)
 */

const logger = new Logger('HrPrismaErrors');

/**
 * The set of NestJS HTTP exceptions that the HR module uses as its typed error
 * surface. Importing from here keeps the discipline visible and consistent and
 * makes the intended status-code mapping explicit at every throw site.
 */
export {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

/**
 * Maps a Prisma known-request error to the appropriate NestJS HTTP exception.
 *
 * - Returns a typed 4xx exception for the mapped Prisma codes.
 * - Returns `null` for anything that is not a recognised Prisma error, so the
 *   caller can decide whether to rethrow an already-typed `HttpException` or
 *   fall back to a logged 500.
 */
export function prismaErrorToHttpException(
  error: unknown,
  context?: string,
): HttpException | null {
  if (!(error instanceof PrismaClientKnownRequestError)) {
    return null;
  }

  const prefix = context ? `[${context}] ` : '';

  switch (error.code) {
    case 'P2025': {
      // An operation failed because it depends on one or more records that were
      // required but not found.
      return new NotFoundException(
        `${prefix}Record not found or already deleted.`,
      );
    }
    case 'P2002': {
      // Unique constraint failed.
      const target = formatTarget(error.meta?.target);
      return new ConflictException(
        `${prefix}A record with the same ${target} already exists.`,
      );
    }
    case 'P2003': {
      // Foreign key constraint failed.
      const field = (error.meta?.field_name as string) ?? 'unknown field';
      return new BadRequestException(
        `${prefix}Invalid reference: '${field}' points to a non-existent record.`,
      );
    }
    case 'P2000': {
      // The provided value for the column is too long for the column's type.
      const column = (error.meta?.column_name as string) ?? 'a field';
      return new BadRequestException(
        `${prefix}The value provided for '${column}' is too long.`,
      );
    }
    default:
      return null;
  }
}

/**
 * Central catch-block handler. Call this from `catch (error) { mapPrismaError(error, 'Entity'); }`.
 *
 * Resolution order:
 *   1. If the error is a mappable Prisma error -> throw the mapped 4xx exception.
 *   2. If the error is already a NestJS `HttpException` -> rethrow it unchanged
 *      (preserves 400/403/404/409 raised deliberately upstream).
 *   3. Otherwise -> log the unexpected error and throw a 500 as a last resort.
 */
export function mapPrismaError(error: unknown, context?: string): never {
  const mapped = prismaErrorToHttpException(error, context);
  if (mapped) {
    throw mapped;
  }

  if (error instanceof HttpException) {
    throw error;
  }

  const prefix = context ? `[${context}] ` : '';
  logger.error(
    `${prefix}Unexpected error mapped to 500: ${
      error instanceof Error ? error.message : String(error)
    }`,
    error instanceof Error ? error.stack : undefined,
  );
  throw new InternalServerErrorException(
    `${prefix}An unexpected error occurred while processing the request.`,
  );
}

function formatTarget(target: unknown): string {
  if (Array.isArray(target)) {
    return target.join(', ');
  }
  if (typeof target === 'string') {
    return target;
  }
  return 'value';
}

/**
 * Maps Prisma FK / not-found constraint errors to domain HTTP exceptions.
 *
 * Retained for backward compatibility with existing repository catch blocks.
 * Now delegates to `mapPrismaError` so that the full code mapping (including
 * P2025 -> 404 and P2002 -> 409) is applied consistently.
 */
export function handlePrismaFkError(error: unknown, context?: string): never {
  mapPrismaError(error, context);
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

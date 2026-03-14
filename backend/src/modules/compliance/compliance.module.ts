import { Module } from '@nestjs/common';
import { ComplianceEngineService } from './compliance.service';
import { ComplianceSuggestionService } from './compliance-suggestion.service';
import { PrismaService } from '../../persistence/prisma.service';

/**
 * ComplianceEngineModule
 * Phase 2 — Global Compliance Engine module.
 *
 * Provides ComplianceEngineService to:
 *  - HRModule (for payroll integration in Phase 4)
 *  - Any future module requiring compliance calculations
 *
 * Uses Prisma directly (not repository pattern) to support cross-tenant
 * Superadmin operations in the Global Explorer.
 */
@Module({
  providers: [
    ComplianceEngineService,
    ComplianceSuggestionService,
    PrismaService,
  ],
  exports: [ComplianceEngineService, ComplianceSuggestionService],
})
export class ComplianceEngineModule {}

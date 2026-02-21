import { Module } from '@nestjs/common';
import { HRController } from './hr.controller';
import { HRService } from './hr.service';
import { IHRRepository } from './repositories/hr.repository.interface';
import { HRDbRepository } from './repositories/hr.db.repository';
import { PrismaService } from '../../persistence/prisma.service';

/**
 * HR Module
 * Core module for Human Resources operations
 */
@Module({
  controllers: [HRController],
  providers: [
    HRService,
    PrismaService,
    {
      provide: IHRRepository,
      useClass: HRDbRepository,
    },
  ],
  exports: [HRService], // Export for cross-module usage
})
export class HRModule {}

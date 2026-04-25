import { Module } from '@nestjs/common';
import { PrismaService } from '../../persistence/prisma.service';
import { IncentivesService } from './incentives.service';
import { IncentivesListener } from './listeners/incentives.listener';
import { IncentivesController } from './incentives.controller';

@Module({
  providers: [PrismaService, IncentivesService, IncentivesListener],
  controllers: [IncentivesController],
  exports: [IncentivesService],
})
export class IncentivesModule {}

import { Module } from '@nestjs/common';
import { TimeAndAttendanceController } from './time.controller';
import { TimeAndAttendanceService } from './time.service';

@Module({
  controllers: [TimeAndAttendanceController],
  providers: [TimeAndAttendanceService],
  exports: [TimeAndAttendanceService],
})
export class TimeAndAttendanceModule {}

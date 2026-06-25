import { Module } from '@nestjs/common';
import { DemoController } from './demo.controller';

/**
 * Demo Module — provides mock data endpoints when DATABASE is unavailable.
 * Register this module in AppModule to enable demo mode.
 */
@Module({
  controllers: [DemoController],
})
export class DemoModule {}

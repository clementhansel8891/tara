import { Module } from "@nestjs/common";
import { IntelligenceController } from "./intelligence.controller";
import { IntelligenceService } from "./intelligence.service";
import { HRModule } from "../../core/hr/hr.module";
import { PersistenceModule } from "../../persistence/persistence.module";

@Module({
  imports: [HRModule, PersistenceModule],
  controllers: [IntelligenceController],
  providers: [IntelligenceService],
  exports: [IntelligenceService],
})
export class IntelligenceModule {}

import { Module } from "@nestjs/common";
import { ExplorerController } from "./explorer.controller";
import { ExplorerService } from "./explorer.service";
import { HRModule } from "../../core/hr/hr.module";
import { PersistenceModule } from "../../persistence/persistence.module";

@Module({
  imports: [HRModule, PersistenceModule],
  controllers: [ExplorerController],
  providers: [ExplorerService],
  exports: [ExplorerService],
})
export class ExplorerModule {}

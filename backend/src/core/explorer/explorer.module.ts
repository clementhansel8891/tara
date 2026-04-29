import { Module } from "@nestjs/common";
import { ExplorerController } from "./explorer.controller";
import { ExplorerService } from "./explorer.service";
import { PersistenceModule } from "../../persistence/persistence.module";
import { AuditModule } from "../../shared/audit/audit.module";
import { FileProcessingModule } from "../../shared/file-processing/file-processing.module";
import { CollaborationGateway } from "./collaboration.gateway";

@Module({
  imports: [PersistenceModule, AuditModule, FileProcessingModule],
  controllers: [ExplorerController],
  providers: [ExplorerService, CollaborationGateway],
  exports: [ExplorerService],
})
export class ExplorerModule {}

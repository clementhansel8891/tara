import { Module } from "@nestjs/common";
import { InventoryController } from "./inventory.controller";
import { InventoryService } from "./inventory.service";
import { IInventoryRepository } from "./repositories/inventory.repository.interface";
import { InventoryDbRepository } from "./repositories/inventory.db.repository";
import { SkuGeneratorService } from "./sku-generator.service";
import { LabelTemplateService } from "./label-template.service";
import { PrismaService } from "../../persistence/prisma.service";
import { InventoryRolesGuard } from "./guards/inventory-roles.guard";
import { PersistenceModule } from "../../persistence/persistence.module";
import { FileProcessingModule } from "../../shared/file-processing/file-processing.module";
import { AuditModule } from "../../shared/audit/audit.module";
import { RetailListener } from "./listeners/retail.listener";
import { ProcurementListener } from "./listeners/procurement.listener";
import { ITDeviceListener } from "./listeners/it-device.listener";
import { InventoryEventListener } from "./listeners/inventory-event.listener";
import { InventoryAgentModule } from "../../agentic/inventory/inventory-agent.module";

@Module({
  imports: [PersistenceModule, FileProcessingModule, AuditModule, InventoryAgentModule],
  controllers: [InventoryController],
  providers: [
    InventoryService,
    SkuGeneratorService,
    LabelTemplateService,
    PrismaService,
    InventoryRolesGuard,
    RetailListener,
    ProcurementListener,
    ITDeviceListener,
    InventoryEventListener,
    {
      provide: IInventoryRepository,
      useClass: InventoryDbRepository,
    },
  ],
  exports: [
    InventoryService,
    SkuGeneratorService,
    LabelTemplateService,
    IInventoryRepository,
  ],
})
export class InventoryModule {}

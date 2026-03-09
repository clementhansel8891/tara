import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from "@nestjs/common";
import { Request, Response } from "express";
import { FileInterceptor } from "@nestjs/platform-express";
import { TenantContext } from "../../gateway/tenant-context.interface";
import { TenantInterceptor } from "../../gateway/tenant.interceptor";
import { TenantGuard } from "../../shared/guards/tenant.guard";
import { ModuleStateGuard } from "../auth/guards/module-state.guard";
import { BranchGatingGuard } from "../auth/guards/branch-gating.guard";
import { RequiredModule } from "../../shared/decorators/required-module.decorator";
import { CreateAdjustmentDto } from "./dto/create-adjustment.dto";
import { CreateItemDto } from "./dto/create-item.dto";
import { StockIntakeDto } from "./dto/stock-intake.dto";
import { TransferStockDto } from "./dto/transfer-stock.dto";
import { ImportItemDto } from "./dto/import-item.dto";
import { CreateMovementRequestDto } from "./dto/create-movement-request.dto";
import { InventoryService } from "./inventory.service";
import { FileProcessingService } from "../../shared/file-processing/file-processing.service";
import { AuditService } from "../../shared/audit/audit.service";
import { SkuGeneratorService } from "./sku-generator.service";
import { LabelTemplateService } from "./label-template.service";
import { v4 as uuidv4 } from "uuid";
import { PrismaService } from "../../persistence/prisma.service";
import { isModuleActive } from "../../shared/helpers/module-active.helper";

interface RequestWithTenant extends Request {
  tenantContext: TenantContext;
}

@Controller("inventory")
@UseInterceptors(TenantInterceptor)
@UseGuards(ModuleStateGuard, BranchGatingGuard, TenantGuard)
@RequiredModule("inventory")
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly skuGenerator: SkuGeneratorService,
    private readonly labelTemplateService: LabelTemplateService,
    private readonly fileProcessingService: FileProcessingService,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  @Get("dashboard")
  async getDashboard(@Req() request: RequestWithTenant) {
    const { tenantId: tenant_id } = request.tenantContext;
    const dashboardData = await this.inventoryService.getDashboard(tenant_id);

    const moduleContributions: any = {};
    if (await isModuleActive(this.prisma, tenant_id, "retail")) {
      const activeStores = await this.prisma.location.findMany({
        where: { tenantId: tenant_id, type: "STORE" },
        select: { id: true },
      });
      const storeIds = activeStores.map((s) => s.id);

      const storeInventoryAgg = await this.prisma.stockLevel.aggregate({
        where: { tenantId: tenant_id, locationId: { in: storeIds } },
        _sum: { onHand: true },
      });

      const pendingStockTransfers =
        await this.prisma.procurementRequisition.count({
          where: {
            tenantId: tenant_id,
            status: "SUBMITTED",
            departmentId: { in: storeIds }, // Using departmentId as store reference since stores are departments or we can just return 0 to fix it simply
          },
        });

      moduleContributions.retail = {
        storeInventoryCount: storeInventoryAgg._sum.onHand || 0,
        pendingStoreTransfers: pendingStockTransfers,
      };
    }

    return {
      success: true,
      tenant_id,
      data: {
        ...dashboardData,
        moduleContributions,
      },
    };
  }

  @Get("items")
  async getItems(@Req() request: RequestWithTenant) {
    const { tenantId: tenant_id } = request.tenantContext;
    const data = await this.inventoryService.getItems(tenant_id);
    return { success: true, tenant_id, count: data.length, data };
  }

  @Post("items")
  async createItem(
    @Req() request: RequestWithTenant,
    @Body() dto: CreateItemDto,
  ) {
    const { tenantId: tenant_id, userId } = request.tenantContext;
    return {
      success: true,
      tenant_id,
      message: "Inventory item created",
      data: await this.inventoryService.createItem(tenant_id, dto, userId),
    };
  }

  @Post("items/batch-delete")
  async batchDeleteItems(
    @Req() request: RequestWithTenant,
    @Body() body: { itemIds: string[] },
  ) {
    const { tenantId: tenant_id, userId } = request.tenantContext;
    await this.inventoryService.batchDeleteItems(
      tenant_id,
      body.itemIds,
      userId,
    );
    return {
      success: true,
      tenant_id,
      message: "Batch delete successful",
    };
  }

  @Delete("items/:id")
  async deleteItem(
    @Req() request: RequestWithTenant,
    @Param("id") itemId: string,
  ) {
    const { tenantId: tenant_id, userId } = request.tenantContext;
    await this.inventoryService.deleteItem(tenant_id, itemId, userId);
    return {
      success: true,
      tenant_id,
      message: "Inventory item deleted",
    };
  }

  @Post("items/import")
  @UseInterceptors(FileInterceptor("file"))
  async importItems(
    @Req() request: RequestWithTenant,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const { tenantId: tenant_id, userId } = request.tenantContext;
    if (!file) {
      return { success: false, message: "No file uploaded" };
    }

    let result;
    if (file.originalname.endsWith(".csv")) {
      result = await this.fileProcessingService.parseCsv(
        file.buffer,
        ImportItemDto,
      );
    } else {
      result = await this.fileProcessingService.parseExcel(
        file.buffer,
        ImportItemDto,
      );
    }

    if (result.errors.length > 0) {
      return {
        success: false,
        message: "Validation failed",
        errors: result.errors,
      };
    }

    const imported = await this.inventoryService.batchCreateItems(
      tenant_id,
      result.data,
      userId,
    );

    await this.auditService.log({
      tenantId: tenant_id,
      userId: request.tenantContext.userId || "system",
      module: "INVENTORY",
      action: "IMPORT",
      entityType: "ITEM",
      entityId: "BATCH",
      metadata: {
        filename: file.originalname,
        count: imported.length,
        traceId: uuidv4(),
      },
    });

    return {
      success: true,
      tenant_id,
      message: `${imported.length} items imported successfully`,
      data: imported,
    };
  }

  @Post("items/batch-json")
  async batchCreateItemsJson(
    @Req() request: RequestWithTenant,
    @Body() body: { items: any[] },
  ) {
    const { tenantId: tenant_id, userId } = request.tenantContext;
    // Map UI fields to DTO fields if necessary, but batchCreateItems handles CreateItemDto[]
    // The UI sends: sku, name, category, barcode, basePrice, uom, description, active
    const data = body.items.map((item) => ({
      ...item,
      // Ensure category is passed as string for SKU generation logic
      category: item.category,
      uom: item.uom || "pcs",
    }));

    const items = await this.inventoryService.batchCreateItems(
      tenant_id,
      data as CreateItemDto[],
      userId,
    );

    return {
      success: true,
      tenant_id,
      message: `${items.length} items created successfully`,
      data: items,
    };
  }

  @Get("items/export")
  async exportItems(
    @Req() request: RequestWithTenant,
    @Res() res: Response,
    @Query("watermarkText") watermarkText?: string,
    @Query("wmX") wmX?: string,
    @Query("wmY") wmY?: string,
  ) {
    const { tenantId: tenant_id, userId } = request.tenantContext;
    const items = await this.inventoryService.getItems(tenant_id);

    const traceId = uuidv4();
    const buffer = await this.fileProcessingService.generateExcel(
      items,
      [
        { header: "SKU", key: "sku", width: 20 },
        { header: "Name", key: "name", width: 40 },
        { header: "Category", key: "category", width: 20 },
        { header: "UOM", key: "uom", width: 10 },
        { header: "Active", key: "active", width: 10 },
      ],
      {
        traceId,
        watermark: watermarkText
          ? {
              text: watermarkText,
              position: { x: parseInt(wmX || "1"), y: parseInt(wmY || "1") },
            }
          : undefined,
      },
    );

    await this.auditService.log({
      tenantId: tenant_id,
      userId: request.tenantContext.userId || "system",
      module: "INVENTORY",
      action: "EXPORT",
      entityType: "ITEM",
      entityId: "BATCH",
      metadata: {
        traceId,
        watermark: watermarkText,
      },
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=inventory_export_${tenant_id}.xlsx`,
    );
    res.send(buffer);
  }

  @Get("balances")
  async getBalances(
    @Req() request: RequestWithTenant,
    @Query("locationId") locationId?: string,
    @Query("departmentId") departmentId?: string,
  ) {
    const { tenantId: tenant_id } = request.tenantContext;
    const data = await this.inventoryService.getBalances(
      tenant_id,
      locationId,
      departmentId,
    );
    return { success: true, tenant_id, count: data.length, data };
  }

  @Get("movements")
  async getMovements(
    @Req() request: RequestWithTenant,
    @Query("itemId") itemId?: string,
  ) {
    const { tenantId: tenant_id } = request.tenantContext;
    const data = await this.inventoryService.getMovements(tenant_id, itemId);
    return { success: true, tenant_id, count: data.length, data };
  }

  @Post("intake")
  async intakeStock(
    @Req() request: RequestWithTenant,
    @Body() dto: StockIntakeDto,
  ) {
    const { tenantId: tenant_id, locationId, userId } = request.tenantContext;
    if (locationId && !dto.locationId) dto.locationId = locationId;
    return {
      success: true,
      tenant_id,
      message: "Stock intake recorded",
      data: await this.inventoryService.intakeStock(tenant_id, dto, userId),
    };
  }

  @Post("batch-intake")
  async batchIntakeStock(
    @Req() request: RequestWithTenant,
    @Body() body: { items: StockIntakeDto[] },
  ) {
    const { tenantId: tenant_id, userId } = request.tenantContext;
    return {
      success: true,
      tenant_id,
      message: "Batch stock intake recorded",
      data: await this.inventoryService.batchIntakeStock(
        tenant_id,
        body.items,
        userId,
      ),
    };
  }

  @Post("transfer")
  async transferStock(
    @Req() request: RequestWithTenant,
    @Body() dto: TransferStockDto,
  ) {
    const { tenantId: tenant_id, userId } = request.tenantContext;
    return {
      success: true,
      tenant_id,
      message: "Stock transfer recorded",
      data: await this.inventoryService.transferStock(tenant_id, dto, userId),
    };
  }

  @Get("adjustments")
  async getAdjustments(@Req() request: RequestWithTenant) {
    const { tenantId: tenant_id } = request.tenantContext;
    const data = await this.inventoryService.getAdjustments(tenant_id);
    return { success: true, tenant_id, count: data.length, data };
  }

  @Post("adjustments")
  async createAdjustment(
    @Req() request: RequestWithTenant,
    @Body() dto: CreateAdjustmentDto,
  ) {
    const { tenantId: tenant_id, locationId, userId } = request.tenantContext;
    if (locationId && !dto.locationId) dto.locationId = locationId;
    return {
      success: true,
      tenant_id,
      message: "Stock adjustment request created",
      data: await this.inventoryService.createAdjustment(
        tenant_id,
        dto,
        userId,
      ),
    };
  }

  @Put("adjustments/:id/approve")
  async approveAdjustment(
    @Req() request: RequestWithTenant,
    @Param("id") adjustmentId: string,
    @Body() body: { approvedBy: string },
  ) {
    const { tenantId: tenant_id } = request.tenantContext;
    return {
      success: true,
      tenant_id,
      message: "Stock adjustment approved",
      data: await this.inventoryService.approveAdjustment(
        tenant_id,
        adjustmentId,
        body.approvedBy || "system",
      ),
    };
  }

  @Get("alerts")
  async getAlerts(@Req() request: RequestWithTenant) {
    const { tenantId: tenant_id } = request.tenantContext;
    const data = await this.inventoryService.getAlerts(tenant_id);
    return { success: true, tenant_id, count: data.length, data };
  }

  @Put("alerts/:id/status")
  async setAlertStatus(
    @Req() request: RequestWithTenant,
    @Param("id") alertId: string,
    @Body() body: { status: "open" | "acknowledged" | "resolved" },
  ) {
    const { tenantId: tenant_id } = request.tenantContext;
    return {
      success: true,
      tenant_id,
      message: "Alert status updated",
      data: await this.inventoryService.setAlertStatus(
        tenant_id,
        alertId,
        body.status,
      ),
    };
  }

  @Get("audit-cycles")
  async getAuditCycles(@Req() request: RequestWithTenant) {
    const { tenantId: tenant_id } = request.tenantContext;
    const data = await this.inventoryService.getAuditCycles(tenant_id);
    return { success: true, tenant_id, count: data.length, data };
  }

  @Post("audit-cycles")
  async createAuditCycle(@Req() request: RequestWithTenant, @Body() body: any) {
    const { tenantId: tenant_id } = request.tenantContext;
    return {
      success: true,
      tenant_id,
      message: "Audit cycle started",
      data: await this.inventoryService.createAuditCycle(tenant_id, body),
    };
  }

  @Put("audit-cycles/:id")
  async updateAuditCycle(
    @Req() request: RequestWithTenant,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    const { tenantId: tenant_id } = request.tenantContext;
    return {
      success: true,
      tenant_id,
      message: "Audit cycle updated",
      data: await this.inventoryService.updateAuditCycle(tenant_id, id, body),
    };
  }

  @Get("integration-events")
  async getIntegrationEvents(@Req() request: RequestWithTenant) {
    const { tenantId: tenant_id } = request.tenantContext;
    const data = await this.inventoryService.getIntegrationEvents(tenant_id);
    return { success: true, tenant_id, count: data.length, data };
  }

  @Post("scans/low-stock")
  async runLowStockScan(@Req() request: RequestWithTenant) {
    const { tenantId: tenant_id } = request.tenantContext;
    return {
      success: true,
      tenant_id,
      message: "Low stock scan completed",
      data: await this.inventoryService.runLowStockScan(tenant_id),
    };
  }

  @Post("scans/expiry")
  async runExpiryScan(@Req() request: RequestWithTenant) {
    const { tenantId: tenant_id } = request.tenantContext;
    return {
      success: true,
      tenant_id,
      message: "Expiry scan completed",
      data: await this.inventoryService.runExpiryScan(tenant_id),
    };
  }

  @Post("consume")
  async consumeStock(@Req() request: RequestWithTenant, @Body() dto: any) {
    const { tenantId: tenant_id, locationId } = request.tenantContext;
    if (locationId && !dto.locationId) dto.locationId = locationId;
    return {
      success: true,
      tenant_id,
      message: "Stock consumption recorded",
      data: await this.inventoryService.consumeStock(tenant_id, dto),
    };
  }

  @Post("procurement-request")
  async requestProcurement(
    @Req() request: RequestWithTenant,
    @Body() body: any,
  ) {
    const { tenantId: tenant_id } = request.tenantContext;
    return {
      success: true,
      tenant_id,
      message: "Procurement request created",
      data: await this.inventoryService.requestProcurement(tenant_id, body),
    };
  }

  @Get("generate-sku")
  async generateSku(
    @Req() request: RequestWithTenant,
    @Query("category") category: string,
  ) {
    const { tenantId: tenant_id } = request.tenantContext;
    const sku = await this.skuGenerator.generateSku(tenant_id, category);
    return { success: true, tenant_id, sku };
  }

  @Get("generate-barcode")
  async generateBarcode(
    @Req() request: RequestWithTenant,
    @Query("sku") sku: string,
  ) {
    const { tenantId: tenant_id } = request.tenantContext;
    const barcode = this.skuGenerator.generateBarcode(tenant_id, sku);
    return { success: true, tenant_id, barcode };
  }

  @Get("label/:sku")
  async getLabel(
    @Req() request: RequestWithTenant,
    @Param("sku") sku: string,
    @Query("format") format: "html" | "zpl" = "html",
  ) {
    const { tenantId: tenant_id } = request.tenantContext;

    // In a real scenario, we'd fetch the actual product data to populate the label
    // For this implementation, we'll derive it from the SKU or use defaults
    const labelData = {
      name: `Product ${sku}`,
      sku: sku,
      barcode: sku, // Usually barcode is the SKU or a separate field
      price: 29.99,
      unit: "pcs",
    };

    if (format === "zpl") {
      return {
        success: true,
        tenant_id,
        zpl: this.labelTemplateService.generateZPL(labelData),
      };
    }

    return {
      success: true,
      tenant_id,
      html: this.labelTemplateService.generateLabelHtml(labelData),
    };
  }

  @Get("items/pending")
  async getPendingItems(@Req() request: RequestWithTenant) {
    const { tenantId: tenant_id } = request.tenantContext;
    const data = await this.inventoryService.getPendingItems(tenant_id);
    return { success: true, tenant_id, count: data.length, data };
  }

  @Put("items/:id/approve")
  async approveItem(
    @Req() request: RequestWithTenant,
    @Param("id") itemId: string,
  ) {
    const { tenantId: tenant_id, userId } = request.tenantContext;
    const item = await this.inventoryService.approveItem(
      tenant_id,
      itemId,
      userId || "system",
    );
    return {
      success: true,
      tenant_id,
      message: "Item approved and activated",
      data: item,
    };
  }

  @Put("items/:id/reject")
  async rejectItem(
    @Req() request: RequestWithTenant,
    @Param("id") itemId: string,
  ) {
    const { tenantId: tenant_id, userId } = request.tenantContext;
    const item = await this.inventoryService.rejectItem(
      tenant_id,
      itemId,
      userId || "system",
    );
    return {
      success: true,
      tenant_id,
      message: "Item rejected",
      data: item,
    };
  }

  @Post("movements/request")
  async createMovementRequest(
    @Req() request: RequestWithTenant,
    @Body() dto: CreateMovementRequestDto,
  ) {
    const { tenantId: tenant_id, userId } = request.tenantContext;
    return {
      success: true,
      tenant_id,
      message: "Movement request created",
      data: await this.inventoryService.createMovementRequest(
        tenant_id,
        dto,
        userId,
      ),
    };
  }
}

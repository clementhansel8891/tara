import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../persistence/prisma.service";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs/promises";
import * as path from "path";
import { AuditService } from "../../shared/audit/audit.service";

@Injectable()
export class ItemImageService {
  private readonly storagePath = path.join(process.cwd(), "storage", "inventory", "images");

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {
    // Ensure storage directory exists
    this.ensureDirectory();
  }

  private async ensureDirectory() {
    try {
      await fs.mkdir(this.storagePath, { recursive: true });
    } catch (err) {
      console.error("Failed to create storage directory:", err);
    }
  }

  async uploadImage(
    tenantId: string,
    itemId: string,
    file: Express.Multer.File,
    userId: string,
  ) {
    // 1. Validate item existence
    const item = await this.prisma.item_masters.findFirst({
      where: { id: itemId, tenant_id: tenantId },
    });
    if (!item) throw new NotFoundException(`Item ${itemId} not found`);

    // 2. Generate filename and save file
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    const filePath = path.join(this.storagePath, fileName);

    await fs.writeFile(filePath, file.buffer);

    // 3. Save to database
    const imageUrl = `/v1/inventory/images/${fileName}`;

    return await this.prisma.$transaction(async (tx) => {
      // Check if this is the first image, if so make it primary
      const existingImages = await tx.item_images.count({
        where: { item_id: itemId, tenant_id: tenantId },
      });

      const isPrimary = existingImages === 0;

      const image = await tx.item_images.create({
        data: {
          id: uuidv4(),
          tenant_id: tenantId,
          item_id: itemId,
          url: imageUrl,
          is_primary: isPrimary,
          order: existingImages,
        },
      });

      // Update item_masters image_url if this is primary
      if (isPrimary) {
        await tx.item_masters.update({
          where: { id: itemId },
          data: { image_url: imageUrl },
        });
      }

      await this.auditService.log({
        tenant_id: tenantId,
        user_id: userId,
        module: "inventory",
        action: "UPLOAD_IMAGE",
        entity_type: "ITEM_IMAGE",
        entity_id: image.id,
        metadata: { item_id: itemId, url: imageUrl },
      }, tx);

      return image;
    });
  }

  async deleteImage(tenantId: string, itemId: string, imageId: string, userId: string) {
    const image = await this.prisma.item_images.findFirst({
      where: { id: imageId, item_id: itemId, tenant_id: tenantId },
    });

    if (!image) throw new NotFoundException(`Image ${imageId} not found for item ${itemId}`);

    await this.prisma.$transaction(async (tx) => {
      await tx.item_images.delete({ where: { id: imageId } });

      // If deleted image was primary, set another one as primary if exists
      if (image.is_primary) {
        const nextImage = await tx.item_images.findFirst({
          where: { item_id: itemId, tenant_id: tenantId },
          orderBy: { order: "asc" },
        });

        if (nextImage) {
          await tx.item_images.update({
            where: { id: nextImage.id },
            data: { is_primary: true },
          });
          await tx.item_masters.update({
            where: { id: itemId },
            data: { image_url: nextImage.url },
          });
        } else {
          await tx.item_masters.update({
            where: { id: itemId },
            data: { image_url: null },
          });
        }
      }

      // Re-order remaining images
      const remainingImages = await tx.item_images.findMany({
        where: { item_id: itemId, tenant_id: tenantId },
        orderBy: { order: "asc" },
      });

      for (let i = 0; i < remainingImages.length; i++) {
        await tx.item_images.update({
          where: { id: remainingImages[i].id },
          data: { order: i },
        });
      }
    });

    // Delete physical file
    const fileName = path.basename(image.url);
    const filePath = path.join(this.storagePath, fileName);
    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.warn(`Failed to delete file ${filePath}:`, err);
    }

    await this.auditService.log({
      tenant_id: tenantId,
      user_id: userId,
      module: "inventory",
      action: "DELETE_IMAGE",
      entity_type: "ITEM_IMAGE",
      entity_id: imageId,
      metadata: { item_id: itemId },
    });
  }

  async setPrimaryImage(tenantId: string, itemId: string, imageId: string, userId: string) {
    const image = await this.prisma.item_images.findFirst({
      where: { id: imageId, item_id: itemId, tenant_id: tenantId },
    });

    if (!image) throw new NotFoundException(`Image ${imageId} not found for item ${itemId}`);

    return await this.prisma.$transaction(async (tx) => {
      // Unset current primary
      await tx.item_images.updateMany({
        where: { item_id: itemId, tenant_id: tenantId, is_primary: true },
        data: { is_primary: false },
      });

      // Set new primary
      const updated = await tx.item_images.update({
        where: { id: imageId },
        data: { is_primary: true },
      });

      // Update item_masters
      await tx.item_masters.update({
        where: { id: itemId },
        data: { image_url: image.url },
      });

      await this.auditService.log({
        tenant_id: tenantId,
        user_id: userId,
        module: "inventory",
        action: "SET_PRIMARY_IMAGE",
        entity_type: "ITEM_IMAGE",
        entity_id: imageId,
        metadata: { item_id: itemId },
      }, tx);

      return updated;
    });
  }

  async listImages(tenantId: string, itemId: string) {
    return this.prisma.item_images.findMany({
      where: { item_id: itemId, tenant_id: tenantId },
      orderBy: { order: "asc" },
    });
  }

  async getImagePath(fileName: string): Promise<string> {
    const filePath = path.join(this.storagePath, fileName);
    try {
      await fs.access(filePath);
      return filePath;
    } catch {
      throw new NotFoundException("Image not found");
    }
  }
}

import { Injectable } from "@nestjs/common";
import { IInventoryRepository } from "./repositories/inventory.repository.interface";

@Injectable()
export class SkuGeneratorService {
  constructor(private readonly repository: IInventoryRepository) {}

  /**
   * Generates a unique, sequential SKU based on the highest existing value in a category.
   * Pattern: [6-Digit Sequence][Category Suffix] (e.g., 530202BRTA)
   */
  async generateSku(tenant_id: string, category: string): Promise<string> {
    console.log(
      `[SkuGenerator] Generating SKU for tenant: ${tenant_id}, category: ${category}`,
    );

    // 1. Fetch highest SKU in category
    const highestSku = await this.repository.findHighestSkuByCategory(
      tenant_id,
      category,
    );

    if (!highestSku) {
      // Fallback: Default starting point (000001 + Category Suffix)
      return `000001${category}`;
    }

    // 2. Pattern Identification: Extract the numeric sequence
    // We look for the numeric part in the SKU.
    const match = highestSku.match(/(\d+)/);
    if (!match) {
      // If no digits found, default fallback
      return `000001${category}`;
    }

    const numericStr = match[0];
    const padding = numericStr.length;
    const currentNumber = parseInt(numericStr, 10);
    const nextNumber = currentNumber + 1;

    // 3. Increment and maintain padding
    const nextNumericStr = nextNumber.toString().padStart(padding, "0");

    // 4. Reconstruct SKU by replacing the old numeric part with the new one
    const newSku = highestSku.replace(numericStr, nextNumericStr);

    return newSku;
  }

  /**
   * Generates a Barcode by prepending the Company Prefix (899) to the SKU.
   * Pattern: 899[SKU]
   */
  generateBarcode(tenant_id: string, sku: string): string {
    return `899${sku}`;
  }
}

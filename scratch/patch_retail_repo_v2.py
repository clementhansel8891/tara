import sys
import re

file_path = r'c:\Users\user\Documents\Software-Developer\zenvix-demo\business-flow-suite-v2\backend\src\modules\retail\repositories\retail.db.repository.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Define the full method replacement to avoid partial mismatch issues
new_method = """  async getInventoryStats(ctx: TenantContext,
    options?: { category_id?: string; q?: string },
  ): Promise<{
    total: number;
    critical: number;
    lowStock: number;
    overstock: number;
    outOfStock: number;
    totalSOH: Prisma.Decimal;
    totalATS: Prisma.Decimal;
    totalItems: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalValue: Prisma.Decimal;
    currency?: string;
  }> {
    const scope = MultiTenancyUtil.getScope(ctx);
    const where: any = { 
      tenant_id: scope.tenant_id,
      status: "active" 
    };

    if (scope.location_id) {
      where.stock_levels = {
        some: {
          location_id: scope.location_id
        }
      };
    }

    if (options?.category_id) where.category_id = options.category_id;
    if (options?.q) {
      const q = options.q;
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { barcode: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    const [products, company] = await Promise.all([
      this.prisma.item_masters.findMany({
        where,
        select: {
          base_price: true,
          stock_levels: {
            where: scope.location_id ? { location_id: scope.location_id } : undefined,
            select: {
              on_hand: true,
              available: true,
              reserved: true,
              min_buffer: true,
              max_capacity: true,
            },
          },
        },
      }),
      this.prisma.companies.findFirst({
        where: { tenant_id: ctx.tenant_id },
        select: { currency: true }
      })
    ]);

    const stats = {
      total: products.length,
      critical: 0,
      lowStock: 0,
      overstock: 0,
      outOfStock: 0,
      totalSOH: new Prisma.Decimal(0) as any,
      totalATS: new Prisma.Decimal(0) as any,
      totalItems: products.length,
      lowStockCount: 0,
      outOfStockCount: 0,
      totalValue: new Prisma.Decimal(0) as any,
      currency: company?.currency || "USD"
    };

    products.forEach((p: any) => {
      const totalOnHand = p.stock_levels.reduce(
        (sum: Prisma.Decimal, s: any) =>
          sum.add(new Prisma.Decimal(String(s.on_hand || 0) as any)),
        new Prisma.Decimal(0) as any,
      );

      const currentATS = p.stock_levels.reduce(
        (sum: Prisma.Decimal, s: any) =>
          sum.add(new Prisma.Decimal(String(s.available || 0) as any)),
        new Prisma.Decimal(0) as any,
      );

      const minBuffer = p.stock_levels.reduce(
        (sum: number, s: any) => sum + (s.min_buffer || 0),
        0
      );

      stats.totalSOH = stats.totalSOH.add(totalOnHand);
      stats.totalATS = stats.totalATS.add(currentATS);
      stats.totalValue = stats.totalValue.add(totalOnHand.mul(new Prisma.Decimal(String(p.base_price || 0))));

      if (totalOnHand.lte(0)) {
        stats.outOfStockCount++;
        stats.outOfStock++;
        stats.critical++;
      } else if (minBuffer > 0 && totalOnHand.lte(minBuffer)) {
        stats.lowStockCount++;
        stats.lowStock++;
      } else if (minBuffer === 0 && totalOnHand.lte(5)) {
        stats.lowStockCount++;
        stats.lowStock++;
      }
    });

    return stats;
  }"""

# Use regex to find the method and replace it
# This matches from 'async getInventoryStats' until 'async getActiveShift' (which is the next method)
pattern = r'async getInventoryStats\(ctx: TenantContext,\s+options\?: \{ category_id\?: string; q\?: string \},\s+\): Promise<\{.*?return stats;\s+\}'
content = re.sub(pattern, new_method, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Full method patch applied successfully")

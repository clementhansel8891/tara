import sys

file_path = r'c:\Users\user\Documents\Software-Developer\zenvix-demo\business-flow-suite-v2\backend\src\modules\retail\repositories\retail.db.repository.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update getInventoryStats where clause
old_where = 'const where: any = { ...MultiTenancyUtil.getScope(ctx, {}, { excludeBranch: true }), status: "active" };'
new_where = """    const scope = MultiTenancyUtil.getScope(ctx);
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
    }"""

content = content.replace(old_where, new_where)

# 2. Update getInventoryStats query to include company currency
old_query = """    const products = await this.prisma.item_masters.findMany({
      where,
      select: {
        base_price: true,
        stock_levels: {
          select: {
            on_hand: true,
            available: true,
            min_buffer: true,
            max_capacity: true,
          },
        },
      },
    });"""

new_query = """    const [products, company] = await Promise.all([
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
    ]);"""

content = content.replace(old_query, new_query)

# 3. Add currency to stats object
old_stats = """    const stats = {
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
    };"""

new_stats = """    const stats = {
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
    };"""

content = content.replace(old_stats, new_stats)

# 4. Fix submitOpname SKU resolution
old_pid = '        let productId = adj.product_id;'
new_pid = """        let productId = adj.product_id;

        // If product_id is missing but SKU is provided, resolve it
        if (!productId && adj.sku) {
          const product = await tx.item_masters.findUnique({
            where: { sku: adj.sku, tenant_id: ctx.tenant_id },
            select: { id: true }
          });
          if (product) productId = product.id;
        }

        if (!productId) {
          console.warn(`[RETAIL_OPNAME] Could not resolve item: ${adj.sku || adj.product_id}`);
          continue;
        }"""

content = content.replace(old_pid, new_pid)

# 5. Fix mapProduct currency
old_map = """      currency: "IDR",
      prices: [{ amount: customPrice, currency: "IDR" }],
    };"""

new_map = """      currency: companyCurrency || "USD",
      prices: [{ amount: customPrice, currency: companyCurrency || "USD" }],
    };"""

content = content.replace(old_map, new_map)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied successfully")

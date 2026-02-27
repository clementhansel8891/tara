const { PrismaClient } = require("../node_modules/@prisma/client");
const p = new PrismaClient();
const TENANT_ID = "03bbc0e0-213d-4af4-9ce8-0e4674a58a8f";
const DEFAULT_CATEGORY_NAME = "Universal Default";

async function ensureCategory() {
  let cat = await p.productCategory.findFirst({ where: { tenantId: TENANT_ID, name: DEFAULT_CATEGORY_NAME } });
  if (!cat) {
    cat = await p.productCategory.create({
      data: {
        tenantId: TENANT_ID,
        name: DEFAULT_CATEGORY_NAME,
      },
    });
  }
  return cat.id;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  const categoryId = await ensureCategory();

  const variants = await p.$queryRaw`
    SELECT v.id as variant_id, v.tenant_id, v.item_master_id, v.sku, v.barcode, v.price, v.is_active,
           m.name as master_name, m.description as master_description, m.uom
    FROM item_variants v
    JOIN item_masters m ON m.id = v.item_master_id
    WHERE v.tenant_id = ${TENANT_ID};`;

  const batches = chunk(variants, 200);
  let processed = 0;
  for (const batch of batches) {
    await p.$transaction(
      batch.map((v) =>
        p.product.upsert({
          where: { tenantId_sku: { tenantId: v.tenant_id, sku: v.sku } },
          update: {
            name: v.master_name,
            barcode: v.barcode || v.sku,
            description: (v.master_description || "") + ` | source: master=${v.item_master_id}, variant=${v.variant_id}`,
            unit: v.uom || "unit",
            basePrice: v.price || 0,
            status: v.is_active ? "active" : "inactive",
            categoryId,
            moduleTags: { set: ["retail", "inventory"] },
          },
          create: {
            tenantId: v.tenant_id,
            categoryId,
            name: v.master_name,
            sku: v.sku,
            barcode: v.barcode || v.sku,
            description: (v.master_description || "") + ` | source: master=${v.item_master_id}, variant=${v.variant_id}`,
            unit: v.uom || "unit",
            basePrice: v.price || 0,
            taxRate: 0.11,
            moduleTags: ["retail", "inventory"],
            status: v.is_active ? "active" : "inactive",
          },
        })
      )
    );
    processed += batch.length;
    if (processed % 1000 === 0) console.log(`Processed ${processed}/${variants.length}`);
  }
  const [{ c: productCount }] = await p.$queryRaw`SELECT count(*)::int as c FROM products WHERE tenant_id=${TENANT_ID}`;
  console.log({ tenantId: TENANT_ID, products: productCount });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await p.$disconnect();
  });

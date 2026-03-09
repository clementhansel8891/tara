const { PrismaClient, ItemType } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  const targetTenantId = "comp-demo-a";
  const locationId = "loc-bali-demo";
  const jsonPath = path.join(
    __dirname,
    "../seed-trial/universal_tenant_seed.json",
  );

  console.log(`Starting ROBUST 9K seed for tenant: ${targetTenantId}`);
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const { taxonomy_nodes, item_masters, item_variants } = data;

  // 1. Seed Categories
  console.log(`Seeding ${taxonomy_nodes.length} Categories...`);
  for (const node of taxonomy_nodes) {
    await prisma.productCategory.upsert({
      where: { id: node.id },
      update: { tenantId: targetTenantId, name: node.name || "Unnamed" },
      create: {
        id: node.id,
        tenantId: targetTenantId,
        name: node.name || "Unnamed",
      },
    });
  }
  // Secondary pass for parents
  for (const node of taxonomy_nodes) {
    if (node.parent_id) {
      await prisma.productCategory
        .update({
          where: { id: node.id },
          data: { parentId: node.parent_id },
        })
        .catch(() => {});
    }
  }

  const masterMap = new Map();
  item_masters.forEach((m) => masterMap.set(m.id, m));

  // 2. Prepare and Deduplicate Products
  console.log(`Processing ${item_variants.length} raw variants...`);
  const seenSkus = new Set();
  const seenBarcodes = new Set();

  const finalProducts = [];
  const finalProjections = [];

  for (const variant of item_variants) {
    const sku = String(variant.sku || variant.id);
    const barcode = String(variant.barcode || sku);

    if (seenSkus.has(sku) || seenBarcodes.has(barcode)) {
      continue; // Skip duplicates to avoid FK failure in projections
    }
    seenSkus.add(sku);
    seenBarcodes.add(barcode);

    const master = masterMap.get(variant.item_master_id) || {};
    const catId =
      master.taxonomy_node_ids && master.taxonomy_node_ids.length > 0
        ? master.taxonomy_node_ids[0]
        : taxonomy_nodes[0].id;

    let itemType = "ITEM";
    if (master.type === "SERVICE") itemType = "SERVICE";
    if (master.type === "RAW_MATERIAL") itemType = "RAW_MATERIAL";

    const name =
      (master.name || "Unknown") +
      (variant.variant_attributes
        ? ` - ${Object.values(variant.variant_attributes).join(" ")}`
        : "");

    finalProducts.push({
      id: String(variant.id),
      tenantId: targetTenantId,
      categoryId: catId,
      name: name.substring(0, 100),
      sku: sku,
      barcode: barcode,
      description: master.description || name,
      unit: master.uom || "EACH",
      basePrice: Number(variant.price || 0),
      taxRate: 0.11,
      type: itemType,
      status: "active",
    });

    finalProjections.push({
      id: `proj-${variant.id}`,
      itemMasterId: String(variant.id),
      tenantId: targetTenantId,
      locationId: locationId,
      moduleType: "RETAIL",
      customName: name,
      customDescription: master.description || name,
      price: Number(variant.price || 0),
      isActive: true,
    });
  }

  console.log(`Deduplicated to ${finalProducts.length} unique items.`);

  // 3. Batch Insert
  const BATCH_SIZE = 500;
  for (let i = 0; i < finalProducts.length; i += BATCH_SIZE) {
    const prodBatch = finalProducts.slice(i, i + BATCH_SIZE);
    const projBatch = finalProjections.slice(i, i + BATCH_SIZE);

    await prisma.product.createMany({ data: prodBatch, skipDuplicates: true });
    await prisma.productProjection.createMany({
      data: projBatch,
      skipDuplicates: true,
    });

    console.log(
      `Inserted ${Math.min(i + BATCH_SIZE, finalProducts.length)} / ${finalProducts.length}...`,
    );
  }

  console.log("Massive seed V2 completed successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

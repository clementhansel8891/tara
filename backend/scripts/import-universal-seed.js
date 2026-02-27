/**
 * Import universal_tenant_seed.json into a given tenant/location.
 * Uses raw SQL via pg to avoid Prisma schema drift.
 */

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const { randomUUID } = require("crypto");

// ---- Config ----
const TENANT_ID = "03bbc0e0-213d-4af4-9ce8-0e4674a58a8f";
const LOCATION_ID = "945365fc-5935-4186-aa8d-896fed8b6f9e";
const CHANNEL_ID = randomUUID();
const SEED_PATH = path.resolve(
  __dirname,
  "../../seed-trial/universal_tenant_seed.json",
);

async function main() {
  const url =
    process.env.DATABASE_URL ||
    "postgresql://zenvix:zenvix_dev_password@localhost:5433/zenvix_dev?schema=public";

  const client = new Client({ connectionString: url });
  await client.connect();
  const seed = JSON.parse(fs.readFileSync(SEED_PATH, "utf8"));

  const taxonomyMap = new Map(); // taxonomy_id -> category_id
  console.log("Upserting categories...");
  for (const node of seed.taxonomy_nodes ?? []) {
    const id = randomUUID();
    const slug = node.slug || node.name.toLowerCase().replace(/\s+/g, "-");
    const res = await client.query(
      `
      INSERT INTO product_categories (id, tenant_id, name, parent_id, icon, slug, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6, NOW(), NOW())
      ON CONFLICT (tenant_id, name) DO UPDATE
        SET parent_id = EXCLUDED.parent_id, slug = EXCLUDED.slug, updated_at = NOW()
      RETURNING id
      `,
      [id, TENANT_ID, node.name, null, null, slug],
    );
    taxonomyMap.set(node.id, res.rows[0].id);
  }

  // Second pass to set parent relationships
  for (const node of seed.taxonomy_nodes ?? []) {
    if (!node.parent_id) continue;
    const id = taxonomyMap.get(node.id);
    const parentId = taxonomyMap.get(node.parent_id);
    if (id && parentId) {
      await client.query(
        `UPDATE product_categories SET parent_id = $1, updated_at = NOW() WHERE id = $2`,
        [parentId, id],
      );
    }
  }

  console.log("Upserting item masters...");
  for (const item of seed.item_masters ?? []) {
    const categoryId = taxonomyMap.get(
      (item.taxonomy_node_ids || [])[0],
    ) || null;
    await client.query(
      `
      INSERT INTO item_masters (id, tenant_id, name, description, uom, category_id, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())
      ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name,
            description = EXCLUDED.description,
            uom = EXCLUDED.uom,
            category_id = EXCLUDED.category_id,
            updated_at = NOW()
      `,
      [
        item.id,
        TENANT_ID,
        item.name,
        item.description || null,
        item.uom || "unit",
        categoryId,
      ],
    );
  }

  console.log("Upserting item variants...");
  for (const v of seed.item_variants ?? []) {
    await client.query(
      `
      INSERT INTO item_variants (id, tenant_id, item_master_id, sku, barcode, price, wsale_price, is_active, variant_attributes, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
      ON CONFLICT (tenant_id, sku) DO UPDATE
        SET barcode = EXCLUDED.barcode,
            price = EXCLUDED.price,
            wsale_price = EXCLUDED.wsale_price,
            is_active = EXCLUDED.is_active,
            variant_attributes = EXCLUDED.variant_attributes,
            item_master_id = EXCLUDED.item_master_id,
            updated_at = NOW()
      `,
      [
        v.id,
        TENANT_ID,
        v.item_master_id,
        v.sku,
        v.barcode || null,
        v.price ?? 0,
        v.wsale_price || null,
        v.is_active ?? true,
        v.variant_attributes || {},
      ],
    );
  }

  console.log("Upserting inventory stocks to location", LOCATION_ID);
  for (const s of seed.inventory_stocks ?? []) {
    await client.query(
      `
      INSERT INTO inventory_stocks (id, tenant_id, location_id, item_variant_id, quantity_on_hand, quantity_reserved)
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (location_id, item_variant_id) DO UPDATE
        SET quantity_on_hand = EXCLUDED.quantity_on_hand,
            quantity_reserved = EXCLUDED.quantity_reserved
      `,
      [
        randomUUID(),
        TENANT_ID,
        LOCATION_ID,
        s.item_variant_id,
        s.quantity_on_hand ?? 0,
        s.quantity_reserved ?? 0,
      ],
    );
  }

  console.log("Creating headless channel...");
  await client.query(
    `
    INSERT INTO retail_channels (id, tenant_id, name, type, status, sync_frequency, adapter_type, integration_category, credentials, webhook_url, created_at, updated_at)
    VALUES ($1,$2,$3,$4,'active','manual','CUSTOM','PRESET',$5,$6,NOW(),NOW())
    ON CONFLICT (id) DO NOTHING
    `,
    [
      CHANNEL_ID,
      TENANT_ID,
      "Headless Inventory Channel",
      "headless",
      {},
      null,
    ],
  );

  await client.end();
  console.log("Import complete.");
  console.log("Channel ID:", CHANNEL_ID);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

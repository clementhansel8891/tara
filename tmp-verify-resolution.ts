import { RetailMockRepository } from "../backend/src/core/retail/repositories/retail.mock.repository";

async function verify() {
  console.log("--- Verifying Universal Inventory Resolution Logic ---");

  const repo = new RetailMockRepository();
  const tenantId = "03bbc0e0-213d-4af4-9ce8-0e4674a58a8f";

  const result = await repo.listProducts(tenantId);
  const items = result.items;

  console.log(`Total items found for tenant: ${items.length}`);

  items.forEach((item) => {
    console.log(`\nProduct ID: ${item.id}`);
    console.log(`SKU: ${item.sku}`);
    console.log(`Resolved Name: ${item.name}`);
    console.log(`Resolved Description: ${item.description}`);

    if (item.id === "item-6855309f") {
      if (item.name === "Premium Leather Belt") {
        console.log("✅ PASS: Custom projection name correctly resolved.");
      } else {
        console.log("❌ FAIL: Custom projection name NOT resolved.");
      }
    }
  });
}

verify().catch(console.error);

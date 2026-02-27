const {
  RetailMockRepository,
} = require("./backend/dist/core/retail/repositories/retail.mock.repository");

async function verify() {
  console.log("--- Verifying Universal Inventory Resolution Logic (JS) ---");

  const repo = new RetailMockRepository();
  const tenant_id = "03bbc0e0-213d-4af4-9ce8-0e4674a58a8f";
  const location_id = "loc-jakarta";

  console.log("\n- Case 1: Fetch with Location Override (Jakarta)");
  const jakartaItems = await repo.findAll(tenant_id, location_id);
  console.log("Jakarta Item Name:", jakartaItems[0]?.name);
  console.log("Jakarta Item Desc:", jakartaItems[0]?.description);

  console.log("\n- Case 2: Fetch WITHOUT Location (Fallthrough to Master)");
  const globalItems = await repo.findAll(tenant_id, undefined);
  console.log("Global Item Name:", globalItems[0]?.name);
  console.log("Global Item Desc:", globalItems[0]?.description);

  const success =
    jakartaItems[0]?.name === "JAKARTA SPECIAL BELT" &&
    globalItems[0]?.name === "LEATHER BELT (BASE)";

  if (success) {
    console.log("\n✅ VERIFICATION SUCCESSFUL: Resolution logic is correct.");
  } else {
    console.log("\n❌ VERIFICATION FAILED: Logic mismatch.");
    process.exit(1);
  }
}

verify().catch((err) => {
  console.error(err);
  process.exit(1);
});

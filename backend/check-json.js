const fs = require("fs");
const path = require("path");

const jsonPath = path.join(
  __dirname,
  "../seed-trial/universal_tenant_seed.json",
);
const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

const { item_variants } = data;

const skus = new Set();
const barcodes = new Set();
const ids = new Set();

const dupSkus = [];
const dupBarcodes = [];
const dupIds = [];

item_variants.forEach((v) => {
  if (ids.has(v.id)) dupIds.push(v.id);
  ids.add(v.id);

  if (skus.has(v.sku)) dupSkus.push(v.sku);
  skus.add(v.sku);

  if (barcodes.has(v.barcode)) dupBarcodes.push(v.barcode);
  barcodes.add(v.barcode);
});

console.log("Total Variants:", item_variants.length);
console.log("Duplicate IDs:", dupIds.length);
console.log("Duplicate SKUs:", dupSkus.length);
console.log("Duplicate Barcodes:", dupBarcodes.length);

if (dupSkus.length > 0) console.log("Sample Dup SKUs:", dupSkus.slice(0, 5));
if (dupBarcodes.length > 0)
  console.log("Sample Dup Barcodes:", dupBarcodes.slice(0, 5));

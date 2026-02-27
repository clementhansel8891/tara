require("dotenv").config({ path: "../.env" });
const fetch = require("node-fetch");

async function testSearch() {
  const tenantId = "03bbc0e0-213d-4af4-9ce8-0e4674a58a8f";
  const baseUrl = "http://localhost:3001/api/retail/products";
  const url = `${baseUrl}?q=bag`;

  console.log(`Testing URL: ${url}`);

  const response = await fetch(url, {
    headers: {
      "x-tenant-id": tenantId,
      "x-actor-id": "system-test",
    },
  });

  if (!response.ok) {
    console.error(`Failed: ${response.status}`);
    const text = await response.text();
    console.error(text);
    return;
  }

  const result = await response.json();
  console.log(`Success! Total items matching 'bag': ${result.data.total}`);
  console.log(`Items count: ${result.data.items.length}`);
  if (result.data.items.length > 0) {
    console.log(`First item name: ${result.data.items[0].name}`);
  }
}

testSearch();

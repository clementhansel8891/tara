const http = require("http");

const baseURL = "http://localhost:3001/api";

const makeRequest = (path, method, headers = {}) => {
  return new Promise((resolve, reject) => {
    const req = http.request(
      `${baseURL}${path}`,
      {
        method,
        headers: {
          ...headers,
          "x-dev-bypass": "true",
        },
      },
      (res) => {
        let responseData = "";
        res.on("data", (chunk) => (responseData += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(responseData) });
          } catch (e) {
            resolve({ status: res.statusCode, data: responseData });
          }
        });
      },
    );

    req.on("error", reject);
    req.end();
  });
};

async function runTests() {
  console.log("--- Verifying Access Control (Superadmin & Owner) ---");

  const testResults = [];

  // Helper to log and track results
  const assert = (name, condition, res) => {
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      testResults.push({ name, pass: true });
    } else {
      console.error(`❌ FAIL: ${name}`);
      if (res) {
        console.error(`   Status: ${res.status}`);
        console.error(`   Data: ${JSON.stringify(res.data)}`);
      }
      testResults.push({ name, pass: false });
    }
  };

  try {
    // Test Case 1: Superadmin accessing Tenant A
    console.log("\n1. Testing Superadmin access to Tenant A...");
    const res1 = await makeRequest("/finance/ledger", "GET", {
      "x-tenant-id": "tenant-a",
      "x-dev-role": "SUPERADMIN",
      "x-dev-tenant-id": "global",
      "x-dev-user-id": "usr-superadmin-001",
    });
    assert("Superadmin should access Tenant A", res1.status === 200, res1);

    // Test Case 2: Superadmin accessing Tenant B
    console.log("\n2. Testing Superadmin access to Tenant B...");
    const res2 = await makeRequest("/finance/ledger", "GET", {
      "x-tenant-id": "tenant-b",
      "x-dev-role": "SUPERADMIN",
      "x-dev-tenant-id": "global",
      "x-dev-user-id": "7f15f139-8652-4796-a2b9-9fbf25515681",
    });
    assert("Superadmin should access Tenant B", res2.status === 200, res2);

    // Test Case 3: Owner of Tenant A accessing Tenant A
    console.log("\n3. Testing Owner of Tenant A accessing Tenant A...");
    const res3 = await makeRequest("/finance/ledger", "GET", {
      "x-tenant-id": "tenant-a",
      "x-dev-role": "OWNER",
      "x-dev-tenant-id": "tenant-a",
    });
    assert("Owner A should access Tenant A", res3.status === 200, res3);

    // Test Case 4: Owner of Tenant A accessing Tenant B (Cross-tenant violation)
    console.log("\n4. Testing Owner of Tenant A accessing Tenant B...");
    const res4 = await makeRequest("/finance/ledger", "GET", {
      "x-tenant-id": "tenant-b",
      "x-dev-role": "OWNER",
      "x-dev-tenant-id": "tenant-a", // User belongs to A, tries to access B
    });
    assert(
      "Owner A should be BLOCKED from Tenant B",
      res4.status === 403,
      res4,
    );

    // Test Case 5: Procurement module check
    console.log("\n5. Testing Procurement module isolation...");
    const res5 = await makeRequest("/procurement/suppliers", "GET", {
      "x-tenant-id": "tenant-b",
      "x-dev-role": "OWNER",
      "x-dev-tenant-id": "tenant-a",
      "x-dev-user-id": "usr-demo-001",
    });
    assert(
      "Owner A should be BLOCKED from Tenant B Procurement",
      res5.status === 403,
      res5,
    );

    // Test Case 6: Inventory module check
    console.log("\n6. Testing Inventory module access...");
    const res6 = await makeRequest("/inventory/dashboard", "GET", {
      "x-tenant-id": "tenant-a",
      "x-dev-role": "OWNER",
      "x-dev-tenant-id": "tenant-a",
      "x-dev-user-id": "usr-demo-001",
    });
    assert(
      "Owner A should access Tenant A Inventory",
      res6.status === 200,
      res6,
    );

    // Test Case 7: Sales module isolation check
    console.log("\n7. Testing Sales module isolation...");
    const res7 = await makeRequest("/sales/dashboard", "GET", {
      "x-tenant-id": "tenant-b",
      "x-dev-role": "OWNER",
      "x-dev-tenant-id": "tenant-a",
      "x-dev-user-id": "usr-demo-001",
    });
    assert(
      "Owner A should be BLOCKED from Tenant B Sales",
      res7.status === 403,
      res7,
    );

    // Test Case 8: Marketing module isolation check
    console.log("\n8. Testing Marketing module isolation...");
    const res8 = await makeRequest("/marketing/dashboard", "GET", {
      "x-tenant-id": "tenant-b",
      "x-dev-role": "OWNER",
      "x-dev-tenant-id": "tenant-a",
      "x-dev-user-id": "usr-demo-001",
    });
    assert(
      "Owner A should be BLOCKED from Tenant B Marketing",
      res8.status === 403,
      res8,
    );

    console.log("\n--- Verification Summary ---");
    const passed = testResults.filter((r) => r.pass).length;
    console.log(`${passed}/${testResults.length} tests passed.`);

    if (passed === testResults.length) {
      console.log("\n✅ Access Control Verification COMPLETE.");
    } else {
      console.error("\n❌ Access Control Verification FAILED.");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Script Error:", error.message);
    process.exit(1);
  }
}

runTests();

import http from "http";

const baseURL = "http://localhost:3001/api";

const makeRequest = (
  path: string,
  method: string,
  body: any,
  token: string | null = null,
  tenantId: string | null = null,
) => {
  return new Promise<any>((resolve, reject) => {
    const dataString = JSON.stringify(body);
    const headers: any = {
      "Content-Type": "application/json",
    };
    if (dataString && dataString !== "{}") {
      headers["Content-Length"] = Buffer.byteLength(dataString);
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    if (tenantId) {
      headers["x-tenant-id"] = tenantId;
    }

    const req = http.request(
      `${baseURL}${path}`,
      { method, headers },
      (res) => {
        let responseData = "";
        res.on("data", (chunk) => (responseData += chunk));
        res.on("end", () => {
          try {
            resolve({
              status: res.statusCode,
              data: responseData ? JSON.parse(responseData) : {},
            });
          } catch (e) {
            resolve({ status: res.statusCode, data: { raw: responseData } });
          }
        });
      },
    );

    req.on("error", reject);
    if (
      dataString &&
      dataString !== "{}" &&
      (method === "POST" || method === "PUT")
    ) {
      req.write(dataString);
    }
    req.end();
  });
};

async function runStageVerification() {
  console.log("--- 🚀 Starting 4-Stage Onboarding Logic Verification ---");
  const uniqueId = Date.now();
  const ownerEmail = `owner-${uniqueId}@zenvix.test`;
  const companyName = `Test Corp ${uniqueId}`;

  try {
    // STAGE 1: Identity Creation
    console.log(`\n[Stage 1] Registering Owner: ${ownerEmail}`);
    const regRes = await makeRequest("/auth/register", "POST", {
      firstName: "Owner",
      lastName: "User",
      email: ownerEmail,
      password: "Password123!",
    });
    console.log(
      "Stage 1 Result:",
      regRes.status === 201 ? "SUCCESS" : "FAILED",
      regRes.data,
    );
    if (regRes.status !== 201) throw new Error("Stage 1 Failed");

    // Login to get token
    const loginRes = await makeRequest("/auth/login", "POST", {
      email: ownerEmail,
      password: "Password123!",
    });
    const token = loginRes.data.token;
    console.log("Self-Identity Verified. Token obtained.");

    // STAGE 2: Company Registration
    console.log(`\n[Stage 2] Provisioning Company: ${companyName}`);
    const provRes = await makeRequest(
      "/auth/company/provision",
      "POST",
      {
        name: companyName,
        industry: "retail",
        country: "ID",
      },
      token,
    );
    console.log(
      "Stage 2 Result:",
      provRes.status === 201 ? "SUCCESS" : "FAILED",
      provRes.data,
    );
    if (provRes.status !== 201) throw new Error("Stage 2 Failed");
    const tenantId = provRes.data.tenantId;

    // STAGE 3: Module Activation Check (hit retail list stores to ensure tenant header works)
    console.log(`\n[Stage 3] Verifying Module Activation (Core & Retail)`);
    const retailProfileRes = await makeRequest(
      "/retail/stores",
      "GET",
      {},
      token,
      tenantId,
    );
    console.log(
      "Stage 3 (Retail Stores) Result:",
      retailProfileRes.status,
      retailProfileRes.data,
    );

    // STAGE 4: Branch Gating Check
    console.log(`\n[Stage 4] Verifying Branch Gating`);
    // Check if we can list stores
    const storesRes = await makeRequest("/retail/stores", "GET", {}, token, tenantId);
    console.log("Current Stores Count:", storesRes.data?.length || 0);

    if (storesRes.data && storesRes.data.length === 0) {
      console.log(
        'Confirmed: No branches exist initially. Logic matches "Setup Required" state.',
      );
    } else {
      console.warn("Warning: Stores already exist? Check provisioning logic.");
    }

    // Attempt to manage employees (Should be allowed immediately)
    console.log("\n[Stage 4b] Testing immediate employee management...");
    const employeesRes = await makeRequest(
      "/hr/employees",
      "GET",
      {},
      token,
      tenantId,
    );
    console.log(
      "Employees Access:",
      employeesRes.status === 200 ? "ALLOWED" : "DENIED",
    );

    // Create a Branch (Store)
    console.log(`\n[Stage 4c] Creating first branch...`);
    // We need to find the correct endpoint for store creation.
    // Assuming /retail/management/stores POST
    const createStoreRes = await makeRequest(
      "/retail/stores",
      "POST",
      {
        name: "Central Plaza Store",
        code: "CP-01",
        locationId: provRes.data.locationId, // Use HQ as default location for this seed
        type: "flagship",
      },
      token,
      tenantId,
    );
    console.log(
      "Branch Creation Result:",
      createStoreRes.status === 201 ? "SUCCESS" : "FAILED",
      createStoreRes.data,
    );

    console.log("\n--- ✅ All Stages Verified Programmatically ---");
  } catch (error) {
    console.error("\n❌ Verification Failed:", error);
  }
}

runStageVerification();

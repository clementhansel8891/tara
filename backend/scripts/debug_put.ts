const fetch = require('node-fetch');

async function testPut() {
  const tenantId = '59e54bb4-1e51-4c22-9310-2bc8b24e2369';
  const employeeId = 'a182b3e4-6f1a-49a2-9ab1-a590248092af';
  const url = `http://localhost:3001/api/hr/employees/${employeeId}`;

  const body = {
    firstName: "Test",
    lastName: "Employee",
    roleTitle: "Staff",
    departmentId: "some-dept-id",
    locationId: "",
    employmentType: "full_time",
    status: "active",
    baseSalary: 0
  };

  console.log("Sending PUT request to:", url);
  console.log("Body:", JSON.stringify(body, null, 2));

  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId,
        'x-actor-id': 'superadmin-id',
        'x-user-role': 'SUPERADMIN'
      },
      body: JSON.stringify(body)
    });

    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

testPut();
